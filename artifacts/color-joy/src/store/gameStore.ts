import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { COINS_PER_STAR, LEVELS, MAX_HEARTS, starsRequired } from '@/src/data/levels';
import {
  LOCKED_PICTURES,
  STARTER_TOOLS,
  TOOL_BY_ID,
  type SkinId,
  type ToolId,
} from '@/src/data/shop';
import { jsonStorage } from '@/src/store/storage';

export interface LevelRun {
  mistakes: number;
  hearts: number;
  /** A rewarded ad already gave a heart back in this attempt. */
  revived: boolean;
}

interface GameState {
  coins: number;
  /** Best stars per level picture id (1-3). Missing = not finished. */
  stars: Record<string, number>;
  /** In-progress attempt stats per level picture id. */
  runs: Record<string, Partial<LevelRun>>;
  tools: Record<ToolId, number>;
  skin: SkinId;
  ownedSkins: SkinId[];
  /** Free-coloring pictures the player unlocked. */
  unlocked: string[];

  /** Wrong color: costs a heart. Returns hearts left. */
  addMistake: (imageId: string) => number;
  resetRun: (imageId: string) => void;
  revive: (imageId: string) => void;
  addCoins: (amount: number) => void;
  /** Deducts coins if affordable; returns whether it did. */
  spend: (amount: number) => boolean;
  buyTool: (id: ToolId) => boolean;
  consumeTool: (id: ToolId) => boolean;
  buySkin: (id: SkinId, price: number) => boolean;
  equipSkin: (id: SkinId) => void;
  unlockPicture: (id: string) => void;
  /** Records a finished level; returns the coins earned this time. */
  finishLevel: (imageId: string, stars: number) => number;
}

export function runOf(runs: GameState['runs'], imageId: string): LevelRun {
  const r = runs[imageId] ?? {};
  const mistakes = r.mistakes ?? 0;
  return {
    mistakes,
    hearts: r.hearts ?? Math.max(0, MAX_HEARTS - mistakes),
    revived: r.revived ?? false,
  };
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      coins: 0,
      stars: {},
      runs: {},
      tools: { ...STARTER_TOOLS },
      skin: 'pencil',
      ownedSkins: ['pencil'],
      unlocked: [],

      addMistake: (imageId) => {
        const run = runOf(get().runs, imageId);
        const next = { ...run, mistakes: run.mistakes + 1, hearts: Math.max(0, run.hearts - 1) };
        set((s) => ({ runs: { ...s.runs, [imageId]: next } }));
        return next.hearts;
      },
      resetRun: (imageId) =>
        set((s) => {
          const runs = { ...s.runs };
          delete runs[imageId];
          return { runs };
        }),
      revive: (imageId) =>
        set((s) => {
          const run = runOf(s.runs, imageId);
          return { runs: { ...s.runs, [imageId]: { ...run, hearts: run.hearts + 1, revived: true } } };
        }),
      addCoins: (amount) => set((s) => ({ coins: s.coins + amount })),
      spend: (amount) => {
        if (get().coins < amount) return false;
        set((s) => ({ coins: s.coins - amount }));
        return true;
      },
      buyTool: (id) => {
        const item = TOOL_BY_ID[id];
        if (!get().spend(item.price)) return false;
        set((s) => ({ tools: { ...s.tools, [id]: (s.tools[id] ?? 0) + item.pack } }));
        return true;
      },
      consumeTool: (id) => {
        if ((get().tools[id] ?? 0) <= 0) return false;
        set((s) => ({ tools: { ...s.tools, [id]: s.tools[id] - 1 } }));
        return true;
      },
      buySkin: (id, price) => {
        if (get().ownedSkins.includes(id)) return true;
        if (!get().spend(price)) return false;
        set((s) => ({ ownedSkins: [...s.ownedSkins, id], skin: id }));
        return true;
      },
      equipSkin: (id) => {
        if (get().ownedSkins.includes(id)) set({ skin: id });
      },
      unlockPicture: (id) =>
        set((s) => (s.unlocked.includes(id) ? s : { unlocked: [...s.unlocked, id] })),
      finishLevel: (imageId, stars) => {
        const prev = get().stars[imageId] ?? 0;
        const earned = Math.max(0, stars - prev) * COINS_PER_STAR;
        set((s) => ({
          coins: s.coins + earned,
          stars: { ...s.stars, [imageId]: Math.max(prev, stars) },
        }));
        return earned;
      },
    }),
    {
      name: 'cj-game-v1',
      storage: jsonStorage,
      partialize: (s) => ({
        coins: s.coins,
        stars: s.stars,
        runs: s.runs,
        tools: s.tools,
        skin: s.skin,
        ownedSkins: s.ownedSkins,
        unlocked: s.unlocked,
      }),
    },
  ),
);

export function totalStars(stars: Record<string, number>): number {
  return LEVELS.reduce((sum, l) => sum + (stars[l.id] ?? 0), 0);
}

/** Index of the first level not finished yet (the "current" level). */
export function currentLevelIndex(stars: Record<string, number>): number {
  const i = LEVELS.findIndex((l) => !stars[l.id]);
  return i === -1 ? LEVELS.length - 1 : i;
}

/** Previous level finished AND enough total stars for this level's gate. */
export function isLevelUnlocked(index: number, stars: Record<string, number>): boolean {
  if (index <= 0) return true;
  if (!stars[LEVELS[index - 1].id]) return false;
  return totalStars(stars) >= starsRequired(index);
}

export function isPictureLocked(id: string, unlocked: string[]): boolean {
  return LOCKED_PICTURES.includes(id) && !unlocked.includes(id);
}

/** Storage key for a level's fills, kept apart from free-coloring fills. */
export const levelArtKey = (imageId: string) => `level:${imageId}`;

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { COINS_PER_STAR, LEVELS } from '@/src/data/levels';
import { jsonStorage } from '@/src/store/storage';

interface LevelRun {
  mistakes: number;
  hints: number;
}

interface GameState {
  coins: number;
  /** Best stars per level picture id (1-3). Missing = not finished. */
  stars: Record<string, number>;
  /** In-progress attempt stats per level picture id. */
  runs: Record<string, LevelRun>;
  addMistake: (imageId: string) => void;
  resetRun: (imageId: string) => void;
  /** Records a finished level; returns the coins earned this time. */
  finishLevel: (imageId: string, stars: number) => number;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      coins: 0,
      stars: {},
      runs: {},
      addMistake: (imageId) =>
        set((s) => {
          const run = s.runs[imageId] ?? { mistakes: 0, hints: 0 };
          return { runs: { ...s.runs, [imageId]: { ...run, mistakes: run.mistakes + 1 } } };
        }),
      resetRun: (imageId) =>
        set((s) => {
          const runs = { ...s.runs };
          delete runs[imageId];
          return { runs };
        }),
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
      partialize: (s) => ({ coins: s.coins, stars: s.stars, runs: s.runs }),
    },
  ),
);

/** Index of the first level not finished yet (the "current" level). */
export function currentLevelIndex(stars: Record<string, number>): number {
  const i = LEVELS.findIndex((l) => !stars[l.id]);
  return i === -1 ? LEVELS.length - 1 : i;
}

export function isLevelUnlocked(index: number, stars: Record<string, number>): boolean {
  if (index <= 0) return true;
  return !!stars[LEVELS[index - 1].id];
}

/** Storage key for a level's fills, kept apart from free-coloring fills. */
export const levelArtKey = (imageId: string) => `level:${imageId}`;

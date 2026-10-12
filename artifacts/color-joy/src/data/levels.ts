import { IMAGES } from '@/src/data/images';
import type { ColoringImage, Difficulty } from '@/src/types';
import {
  colorDistance,
  hashString,
  hexToHsl,
  hslToHex,
  seededRandom,
} from '@/src/utils/color';

const ORDER: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2 };

/**
 * Level order: easy pictures first, then medium, then hard. Within a
 * difficulty the library order is kept, so adding pictures appends levels.
 */
export const LEVELS: ColoringImage[] = IMAGES.map((img, i) => ({ img, i }))
  .sort((a, b) => ORDER[a.img.difficulty] - ORDER[b.img.difficulty] || a.i - b.i)
  .map((x) => x.img);

export const LEVEL_INDEX: Record<string, number> = Object.fromEntries(
  LEVELS.map((img, i) => [img.id, i]),
);

/** Lives per level attempt. */
export const MAX_HEARTS = 3;

/** Stars for a finished level: every wrong color costs one star. */
export function starsFor(mistakes: number): 1 | 2 | 3 {
  if (mistakes <= 0) return 3;
  if (mistakes === 1) return 2;
  return 1;
}

export const COINS_PER_STAR = 10;

/**
 * Star gates: every third level needs a total number of stars to open, so
 * players must replay levels and play cleanly to keep progressing.
 */
export function starsRequired(index: number): number {
  if (index <= 0 || index % 3 !== 0) return 0;
  return Math.round(index * 2.2);
}

/** 0 for the first level, 1 for the last. */
const progressOf = (index: number) => (LEVELS.length > 1 ? index / (LEVELS.length - 1) : 0);

/** Number of fake look-alike pencils mixed into a level's pencil box. */
export function decoyCount(index: number): number {
  return Math.min(8, 2 + Math.floor(index * 0.7));
}

/**
 * Pencils for a level: the picture's real colors plus look-alike decoys,
 * shuffled. Decoys get closer to the real shades as levels advance.
 * Deterministic, so the box is the same every time a level opens.
 */
export function levelPencils(image: ColoringImage): string[] {
  const index = LEVEL_INDEX[image.id] ?? 0;
  const t = progressOf(index);
  const rand = seededRandom(hashString(image.id) + index * 977);
  // Lightness / hue offsets shrink as levels get harder.
  const dl = 24 - 13 * t;
  const dh = 22 - 12 * t;
  const minGap = 34 - 10 * t;

  const real = [...image.palette];
  const all = [...real];
  const wanted = decoyCount(index);
  let attempts = 0;
  while (all.length < real.length + wanted && attempts < 400) {
    attempts++;
    const base = real[Math.floor(rand() * real.length)];
    const [h, s, l] = hexToHsl(base);
    const dir = rand() < 0.5 ? -1 : 1;
    const mode = rand();
    let nh = h;
    let ns = s;
    let nl = l;
    if (mode < 0.45) nl = l + dir * dl * (0.8 + rand() * 0.4);
    else if (mode < 0.8) nh = h + dir * dh * (0.8 + rand() * 0.4);
    else {
      nl = l + dir * dl * 0.6;
      nh = h - dir * dh * 0.6;
    }
    if (s < 15) ns = s; // keep greys grey
    nl = Math.max(14, Math.min(90, nl));
    const candidate = hslToHex(nh, ns, nl);
    if (all.every((c) => colorDistance(c, candidate) > minGap * 3)) all.push(candidate);
  }

  // Fisher–Yates with the seeded generator.
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all;
}

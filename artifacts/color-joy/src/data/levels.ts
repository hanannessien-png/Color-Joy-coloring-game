import { IMAGES } from '@/src/data/images';
import type { ColoringImage, Difficulty } from '@/src/types';

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

/** Stars for a finished level, based on wrong taps and hints used. */
export function starsFor(mistakes: number, hints: number): 1 | 2 | 3 {
  const penalty = mistakes + hints * 2;
  if (penalty === 0) return 3;
  if (penalty <= 3) return 2;
  return 1;
}

export const COINS_PER_STAR = 10;

export type CategoryId =
  | 'animals'
  | 'mandala'
  | 'cartoon'
  | 'nature'
  | 'food'
  | 'vehicles'
  | 'fantasy'
  | 'space'
  | 'ocean'
  | 'patterns';

export type Difficulty = 'easy' | 'medium' | 'hard';

/** One tappable closed shape inside a picture. */
export interface Region {
  /** Unique within its picture. */
  id: string;
  /** Closed SVG path data in the 400x400 picture space. */
  d: string;
  /** 1-based index into the picture's paint-by-number palette. */
  n: number;
  /** Point where the paint-by-number label is drawn. */
  l: [number, number];
}

export interface ColoringImage {
  id: string;
  title: string;
  category: CategoryId;
  difficulty: Difficulty;
  /** Paint-by-number colors; region.n points into this list (1-based). */
  palette: string[];
  /** Drawn bottom to top; later regions sit on top of earlier ones. */
  regions: Region[];
  /** Decorative open lines (mouths, whiskers, strings). Not tappable. */
  details?: string[];
}

export type Fill = { kind: 'solid'; color: string };

export interface Category {
  id: CategoryId;
  label: string;
  icon: string;
  color: string;
}

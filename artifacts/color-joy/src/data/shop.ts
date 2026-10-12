import type { MaterialCommunityIcons } from '@expo/vector-icons';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export type ToolId = 'hint' | 'wand' | 'bomb';
export type SkinId = 'pencil' | 'crayon' | 'marker' | 'brush';

export interface ToolItem {
  id: ToolId;
  name: string;
  description: string;
  icon: IconName;
  /** How many uses one purchase gives. */
  pack: number;
  price: number;
}

export const TOOLS: ToolItem[] = [
  {
    id: 'hint',
    name: 'Hint',
    description: 'Shows one part and picks its right pencil',
    icon: 'lightbulb-on',
    pack: 3,
    price: 60,
  },
  {
    id: 'wand',
    name: 'Magic Wand',
    description: 'Colors any part you tap, perfectly',
    icon: 'magic-staff',
    pack: 2,
    price: 80,
  },
  {
    id: 'bomb',
    name: 'Color Bomb',
    description: 'Fills every part of one color at once',
    icon: 'bomb',
    pack: 1,
    price: 90,
  },
];

export const TOOL_BY_ID = Object.fromEntries(TOOLS.map((t) => [t.id, t])) as Record<ToolId, ToolItem>;

export interface SkinItem {
  id: SkinId;
  name: string;
  price: number;
}

export const SKINS: SkinItem[] = [
  { id: 'pencil', name: 'Wooden Pencils', price: 0 },
  { id: 'crayon', name: 'Wax Crayons', price: 150 },
  { id: 'marker', name: 'Felt Markers', price: 250 },
  { id: 'brush', name: 'Paint Brushes', price: 400 },
];

/** Free-coloring pictures that must be unlocked (coins or a rewarded ad). */
export const LOCKED_PICTURES = ['fantasy-dream-castle', 'space-rocket-trip'];
export const PICTURE_PRICE = 120;

/** Coins for watching one rewarded ad in the shop. */
export const AD_COINS = 30;

/** Starting gift so new players can try every tool. */
export const STARTER_TOOLS: Record<ToolId, number> = { hint: 3, wand: 1, bomb: 1 };

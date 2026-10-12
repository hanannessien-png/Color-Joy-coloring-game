import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Fill } from '@/src/types';
import { jsonStorage } from '@/src/store/storage';

export interface RegionChange {
  id: string;
  fill?: Fill;
}

interface ArtState {
  /** fills[imageId][regionId] */
  fills: Record<string, Record<string, Fill>>;
  applyChanges: (imageId: string, changes: RegionChange[]) => void;
}

/** Saved coloring progress for every picture (auto-saved on the device). */
export const useArtStore = create<ArtState>()(
  persist(
    (set) => ({
      fills: {},
      applyChanges: (imageId, changes) =>
        set((state) => {
          const next: Record<string, Fill> = { ...(state.fills[imageId] ?? {}) };
          for (const c of changes) {
            if (c.fill) next[c.id] = c.fill;
            else delete next[c.id];
          }
          return { fills: { ...state.fills, [imageId]: next } };
        }),
    }),
    {
      name: 'cj-art-v1',
      storage: jsonStorage,
      partialize: (s) => ({ fills: s.fills }),
    },
  ),
);

export function fillToColor(fill: Fill | undefined): string {
  if (!fill) return '#FFFFFF';
  return fill.color;
}

export function sameFill(a: Fill | undefined, b: Fill | undefined): boolean {
  if (!a || !b) return a === b;
  return a.kind === b.kind && a.color.toLowerCase() === b.color.toLowerCase();
}

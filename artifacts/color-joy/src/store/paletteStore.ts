import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { MAX_RECENT, PALETTE } from '@/src/data/palette';
import { jsonStorage } from '@/src/store/storage';

interface PaletteState {
  color: string;
  recent: string[];
  selectColor: (color: string) => void;
  /** Called when a color is actually used on the picture. */
  markUsed: (color: string) => void;
}

export const usePaletteStore = create<PaletteState>()(
  persist(
    (set) => ({
      color: PALETTE[3],
      recent: [],
      selectColor: (color) => set({ color }),
      markUsed: (color) =>
        set((s) => {
          const lower = color.toLowerCase();
          if (s.recent[0]?.toLowerCase() === lower) return s;
          const recent = [color, ...s.recent.filter((c) => c.toLowerCase() !== lower)].slice(
            0,
            MAX_RECENT,
          );
          return { recent };
        }),
    }),
    { name: 'cj-palette-v1', storage: jsonStorage },
  ),
);

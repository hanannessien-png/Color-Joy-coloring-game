import React, { useCallback } from 'react';

import { PencilTray } from '@/src/components/PencilTray';
import { PALETTE } from '@/src/data/palette';
import { usePaletteStore } from '@/src/store/paletteStore';

/** Free-coloring pencil box with every color. */
export function Palette({ pencilWidth }: { pencilWidth?: number }) {
  const color = usePaletteStore((s) => s.color);
  const select = useCallback((c: string) => usePaletteStore.getState().selectColor(c), []);
  return <PencilTray colors={PALETTE} selected={color} onSelect={select} pencilWidth={pencilWidth} />;
}

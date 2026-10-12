import { create } from 'zustand';

import type { Fill } from '@/src/types';
import { sameFill, useArtStore } from '@/src/store/artStore';

interface Change {
  id: string;
  prev?: Fill;
  next?: Fill;
}

interface Entry {
  imageId: string;
  changes: Change[];
}

interface HistoryState {
  imageId: string | null;
  undoStack: Entry[];
  redoStack: Entry[];
  /** Start a fresh session for a picture (history is per session). */
  begin: (imageId: string) => void;
  /** Apply a set of region changes and record them for undo. */
  commit: (imageId: string, changes: { id: string; next?: Fill }[]) => boolean;
  undo: () => void;
  redo: () => void;
}

/** Unlimited undo/redo for the current coloring session. */
export const useHistoryStore = create<HistoryState>()((set, get) => ({
  imageId: null,
  undoStack: [],
  redoStack: [],
  begin: (imageId) => {
    if (get().imageId === imageId) return;
    set({ imageId, undoStack: [], redoStack: [] });
  },
  commit: (imageId, changes) => {
    const current = useArtStore.getState().fills[imageId] ?? {};
    const real: Change[] = [];
    for (const c of changes) {
      const prev = current[c.id];
      if (!sameFill(prev, c.next)) real.push({ id: c.id, prev, next: c.next });
    }
    if (real.length === 0) return false;
    useArtStore.getState().applyChanges(
      imageId,
      real.map((c) => ({ id: c.id, fill: c.next })),
    );
    set((s) => ({ undoStack: [...s.undoStack, { imageId, changes: real }], redoStack: [] }));
    return true;
  },
  undo: () => {
    const { undoStack } = get();
    const entry = undoStack[undoStack.length - 1];
    if (!entry) return;
    useArtStore.getState().applyChanges(
      entry.imageId,
      entry.changes.map((c) => ({ id: c.id, fill: c.prev })),
    );
    set((s) => ({ undoStack: s.undoStack.slice(0, -1), redoStack: [...s.redoStack, entry] }));
  },
  redo: () => {
    const { redoStack } = get();
    const entry = redoStack[redoStack.length - 1];
    if (!entry) return;
    useArtStore.getState().applyChanges(
      entry.imageId,
      entry.changes.map((c) => ({ id: c.id, fill: c.next })),
    );
    set((s) => ({ redoStack: s.redoStack.slice(0, -1), undoStack: [...s.undoStack, entry] }));
  },
}));

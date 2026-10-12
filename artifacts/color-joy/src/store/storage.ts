import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, type StateStorage } from 'zustand/middleware';

/**
 * AsyncStorage wrapper that batches rapid writes (e.g. many taps in a row)
 * into a single write per key.
 */
const timers: Record<string, ReturnType<typeof setTimeout>> = {};
const pending: Record<string, string> = {};

const debouncedStorage: StateStorage = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => {
    pending[key] = value;
    if (timers[key]) clearTimeout(timers[key]);
    timers[key] = setTimeout(() => {
      const v = pending[key];
      delete pending[key];
      delete timers[key];
      if (v !== undefined) {
        AsyncStorage.setItem(key, v).catch((err) => {
          console.warn(`Failed to save ${key}`, err);
        });
      }
    }, 400);
  },
  removeItem: (key) => AsyncStorage.removeItem(key),
};

export const jsonStorage = createJSONStorage(() => debouncedStorage);

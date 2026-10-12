import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { jsonStorage } from '@/src/store/storage';

export interface AdStats {
  lastInterstitialAt: number;
  completionsSinceInterstitial: number;
  /** Local date (YYYY-MM-DD) the rewarded counter belongs to. */
  rewardedDay: string;
  rewardedCount: number;
}

interface SettingsState {
  /** True once saved settings have been loaded from the device. */
  hydrated: boolean;
  /** Number of app starts, including the current one. */
  launches: number;
  ads: AdStats;
  noteLaunch: () => void;
  patchAds: (patch: Partial<AdStats>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      hydrated: false,
      launches: 0,
      ads: {
        lastInterstitialAt: 0,
        completionsSinceInterstitial: 0,
        rewardedDay: '',
        rewardedCount: 0,
      },
      noteLaunch: () => set((s) => ({ launches: s.launches + 1 })),
      patchAds: (patch) => set((s) => ({ ads: { ...s.ads, ...patch } })),
    }),
    {
      name: 'cj-settings-v1',
      storage: jsonStorage,
      partialize: (s) => ({ launches: s.launches, ads: s.ads }),
      onRehydrateStorage: () => () => {
        useSettingsStore.setState({ hydrated: true });
      },
    },
  ),
);

export function todayKey(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

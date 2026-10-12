import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { AD_RULES } from '@/src/config/ads';
import { jsonStorage } from '@/src/store/storage';

export interface AdStats {
  lastAppOpenAt: number;
  lastInterstitialAt: number;
  completionsSinceInterstitial: number;
  /** Local date (YYYY-MM-DD) the rewarded counter belongs to. */
  rewardedDay: string;
  rewardedCount: number;
}

interface SettingsState {
  /** True once saved settings have been loaded from the device. */
  hydrated: boolean;
  /** From the first-launch age question; null until answered. */
  birthYear: number | null;
  /** Number of app starts, including the current one. */
  launches: number;
  ads: AdStats;
  setBirthYear: (year: number) => void;
  noteLaunch: () => void;
  patchAds: (patch: Partial<AdStats>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      hydrated: false,
      birthYear: null,
      launches: 0,
      ads: {
        lastAppOpenAt: 0,
        lastInterstitialAt: 0,
        completionsSinceInterstitial: 0,
        rewardedDay: '',
        rewardedCount: 0,
      },
      setBirthYear: (birthYear) => set({ birthYear }),
      noteLaunch: () => set((s) => ({ launches: s.launches + 1 })),
      patchAds: (patch) => set((s) => ({ ads: { ...s.ads, ...patch } })),
    }),
    {
      name: 'cj-settings-v1',
      storage: jsonStorage,
      partialize: (s) => ({ birthYear: s.birthYear, launches: s.launches, ads: s.ads }),
      onRehydrateStorage: () => () => {
        useSettingsStore.setState({ hydrated: true });
      },
    },
  ),
);

/** Conservative: anyone who may still be 13 or younger counts as a child. */
export function isChildBirthYear(birthYear: number): boolean {
  return new Date().getFullYear() - birthYear <= AD_RULES.childMaxAge;
}

export function todayKey(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

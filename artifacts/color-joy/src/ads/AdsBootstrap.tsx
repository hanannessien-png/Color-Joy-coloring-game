import { useEffect, useRef } from 'react';

import { initAds } from '@/src/ads/adManager';
import { useSettingsStore } from '@/src/store/settingsStore';

/** Counts app launches (for the app-open rule) and starts AdMob. */
export function AdsBootstrap() {
  const hydrated = useSettingsStore((s) => s.hydrated);
  const counted = useRef(false);

  useEffect(() => {
    if (!hydrated || counted.current) return;
    counted.current = true;
    useSettingsStore.getState().noteLaunch();
    void initAds();
  }, [hydrated]);

  return null;
}

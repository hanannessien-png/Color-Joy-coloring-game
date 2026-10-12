import React, { useEffect, useRef } from 'react';

import { initAds } from '@/src/ads/adManager';
import { AgeGate } from '@/src/components/AgeGate';
import { isChildBirthYear, useSettingsStore } from '@/src/store/settingsStore';

/**
 * Counts app launches, asks the age question on first launch, then starts
 * AdMob with the matching child / adult settings.
 */
export function AdsBootstrap() {
  const hydrated = useSettingsStore((s) => s.hydrated);
  const birthYear = useSettingsStore((s) => s.birthYear);
  const counted = useRef(false);

  useEffect(() => {
    if (!hydrated || counted.current) return;
    counted.current = true;
    useSettingsStore.getState().noteLaunch();
  }, [hydrated]);

  useEffect(() => {
    if (hydrated && birthYear !== null) void initAds(isChildBirthYear(birthYear));
  }, [hydrated, birthYear]);

  if (!hydrated || birthYear !== null) return null;
  return <AgeGate onSubmit={(y) => useSettingsStore.getState().setBirthYear(y)} />;
}

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getBannerUnitId, getRequestOptions, useAdStatus } from '@/src/ads/adManager';
import { getAdsSdk } from '@/src/ads/sdk';

/**
 * Anchored adaptive banner. Renders nothing until AdMob is ready, and
 * nothing at all in the web preview / Expo Go.
 */
export function AdBanner() {
  const ready = useAdStatus((s) => s.ready);
  const insets = useSafeAreaInsets();
  const sdk = getAdsSdk();
  if (!sdk || !ready) return null;
  const { BannerAd, BannerAdSize } = sdk;
  return (
    <View style={[styles.wrap, { paddingBottom: insets.bottom }]}>
      <BannerAd
        unitId={getBannerUnitId()}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={getRequestOptions()}
        onAdFailedToLoad={(err) => console.warn('[ads] banner error', err)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
});

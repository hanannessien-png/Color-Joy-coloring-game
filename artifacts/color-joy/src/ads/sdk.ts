import Constants, { ExecutionEnvironment } from 'expo-constants';
import type * as AdsModule from 'react-native-google-mobile-ads';

export type AdsSdk = typeof AdsModule;

let cached: AdsSdk | null | undefined;

/**
 * The Google Mobile Ads SDK, or null where it can't run (Expo Go has no
 * native ads module). Loaded lazily so importing this file never crashes.
 */
export function getAdsSdk(): AdsSdk | null {
  if (cached !== undefined) return cached;
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    cached = null;
    return cached;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('react-native-google-mobile-ads') as AdsSdk;
  } catch (err) {
    console.warn('[ads] Google Mobile Ads SDK unavailable', err);
    cached = null;
  }
  return cached;
}

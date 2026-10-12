import type * as AdsModule from 'react-native-google-mobile-ads';

export type AdsSdk = typeof AdsModule;

/** AdMob has no web SDK: ads are disabled in the web preview. */
export function getAdsSdk(): AdsSdk | null {
  return null;
}

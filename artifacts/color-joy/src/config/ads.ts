/**
 * All AdMob settings in one place.
 *
 * The real ad units below are used only in release builds. Development
 * builds always use Google's official test ads, so testing never produces
 * invalid traffic on the real account.
 *
 * The AdMob App ID lives in app.json (react-native-google-mobile-ads plugin).
 */
export const AD_UNITS = {
  banner: 'ca-app-pub-6225158226956884/1265237283',
  interstitial: 'ca-app-pub-6225158226956884/6689788504',
  // App-open unit exists in AdMob but is unused: Families policy forbids
  // full-screen ads at app launch. ca-app-pub-6225158226956884/4411020234
  rewarded: 'ca-app-pub-6225158226956884/4922156121',
} as const;

export type AdKind = keyof typeof AD_UNITS;

export const AD_RULES = {
  /** Interstitial: after every 3 finished pictures... */
  interstitialEvery: 3,
  /** ...and at least 2 minutes after the previous one. */
  interstitialMinGapMs: 2 * 60 * 1000,
  /** Rewarded ads: at most 10 per day. */
  rewardedMaxPerDay: 10,
  /** Retry delay after an ad fails to load. */
  retryMs: 30 * 1000,
} as const;

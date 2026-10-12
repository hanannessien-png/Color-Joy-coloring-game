import { create } from 'zustand';
import type {
  InterstitialAd,
  RequestOptions,
  RewardedAd,
} from 'react-native-google-mobile-ads';

import { getAdsSdk } from '@/src/ads/sdk';
import { AD_RULES, AD_UNITS, type AdKind } from '@/src/config/ads';
import { todayKey, useSettingsStore } from '@/src/store/settingsStore';

/**
 * AdMob controller. Every ad rule (frequency caps, family-safe requests)
 * is enforced here so screens only ask "may I show an ad now?".
 *
 * Where the SDK is missing (web preview, Expo Go) no ads load. Rewarded ads
 * then grant their reward directly so the flow can still be tested.
 */

interface AdStatus {
  /** SDK initialized and allowed to request ads. */
  ready: boolean;
  /** A rewarded ad can be shown right now. */
  rewardedReady: boolean;
  /** No real ads in this environment (web preview / Expo Go). */
  preview: boolean;
}

export const useAdStatus = create<AdStatus>(() => ({
  ready: false,
  rewardedReady: false,
  preview: getAdsSdk() === null,
}));

const sdk = getAdsSdk();
let started = false;
let requestOptions: RequestOptions = {};

let interstitial: InterstitialAd | null = null;
let interstitialLoaded = false;

let rewarded: RewardedAd | null = null;
let rewardedLoaded = false;
let rewardEarned = false;
let pendingReward: ((earned: boolean) => void) | null = null;

let fullscreenShowing = false;
let lastFullscreenClosedAt = 0;

const stats = () => useSettingsStore.getState().ads;
const patch = (p: Parameters<ReturnType<typeof useSettingsStore.getState>['patchAds']>[0]) =>
  useSettingsStore.getState().patchAds(p);

function unitId(kind: AdKind): string {
  if (!sdk) return '';
  if (__DEV__) {
    const test = {
      banner: sdk.TestIds.ADAPTIVE_BANNER,
      interstitial: sdk.TestIds.INTERSTITIAL,
      rewarded: sdk.TestIds.REWARDED,
    };
    return test[kind];
  }
  return AD_UNITS[kind];
}

export function getBannerUnitId() {
  return unitId('banner');
}

export function getRequestOptions(): RequestOptions {
  return requestOptions;
}

function onFullscreenClosed() {
  fullscreenShowing = false;
  lastFullscreenClosedAt = Date.now();
}

function retry(load: () => void) {
  setTimeout(load, AD_RULES.retryMs);
}

// ---------- Interstitial ----------
function loadInterstitial() {
  if (!sdk) return;
  const { InterstitialAd: Ad, AdEventType } = sdk;
  const ad = Ad.createForAdRequest(unitId('interstitial'), requestOptions);
  interstitialLoaded = false;
  ad.addAdEventListener(AdEventType.LOADED, () => {
    interstitialLoaded = true;
  });
  ad.addAdEventListener(AdEventType.CLOSED, () => {
    onFullscreenClosed();
    loadInterstitial();
  });
  ad.addAdEventListener(AdEventType.ERROR, (err) => {
    console.warn('[ads] interstitial error', err);
    if (fullscreenShowing) onFullscreenClosed();
    retry(loadInterstitial);
  });
  interstitial = ad;
  ad.load();
}

/** Call once per finished picture. */
export function noteCompletion() {
  patch({ completionsSinceInterstitial: stats().completionsSinceInterstitial + 1 });
}

/** Shows an interstitial if the frequency rules allow it. */
export function maybeShowInterstitial(): boolean {
  const s = stats();
  const now = Date.now();
  if (s.completionsSinceInterstitial < AD_RULES.interstitialEvery) return false;
  if (now - s.lastInterstitialAt < AD_RULES.interstitialMinGapMs) return false;
  if (!interstitial || !interstitialLoaded || fullscreenShowing) return false;
  fullscreenShowing = true;
  interstitialLoaded = false;
  patch({ completionsSinceInterstitial: 0, lastInterstitialAt: now });
  interstitial.show().catch((err: unknown) => {
    console.warn('[ads] interstitial show failed', err);
    onFullscreenClosed();
    loadInterstitial();
  });
  return true;
}

// ---------- Rewarded ----------
function loadRewarded() {
  if (!sdk) return;
  const { RewardedAd: Ad, RewardedAdEventType, AdEventType } = sdk;
  const ad = Ad.createForAdRequest(unitId('rewarded'), requestOptions);
  rewardedLoaded = false;
  useAdStatus.setState({ rewardedReady: false });
  ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
    rewardedLoaded = true;
    useAdStatus.setState({ rewardedReady: true });
  });
  ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
    rewardEarned = true;
  });
  ad.addAdEventListener(AdEventType.CLOSED, () => {
    pendingReward?.(rewardEarned);
    pendingReward = null;
    onFullscreenClosed();
    loadRewarded();
  });
  ad.addAdEventListener(AdEventType.ERROR, (err) => {
    console.warn('[ads] rewarded error', err);
    pendingReward?.(false);
    pendingReward = null;
    if (fullscreenShowing) onFullscreenClosed();
    retry(loadRewarded);
  });
  rewarded = ad;
  ad.load();
}

export function rewardedLeftToday(): number {
  const s = stats();
  const used = s.rewardedDay === todayKey() ? s.rewardedCount : 0;
  return Math.max(0, AD_RULES.rewardedMaxPerDay - used);
}

function countRewarded() {
  const s = stats();
  const today = todayKey();
  patch({ rewardedDay: today, rewardedCount: (s.rewardedDay === today ? s.rewardedCount : 0) + 1 });
}

/** Shows a rewarded ad; resolves true only if the reward was earned. */
export function showRewarded(): Promise<boolean> {
  if (rewardedLeftToday() <= 0) return Promise.resolve(false);
  if (!sdk) {
    // Preview: no ad SDK here, grant the reward so the flow can be tried.
    countRewarded();
    return new Promise((res) => setTimeout(() => res(true), 400));
  }
  if (!rewarded || !rewardedLoaded || fullscreenShowing) return Promise.resolve(false);
  const ad = rewarded;
  return new Promise((resolve) => {
    pendingReward = resolve;
    rewardEarned = false;
    fullscreenShowing = true;
    rewardedLoaded = false;
    useAdStatus.setState({ rewardedReady: false });
    countRewarded();
    ad.show().catch((err: unknown) => {
      console.warn('[ads] rewarded show failed', err);
      pendingReward = null;
      onFullscreenClosed();
      resolve(false);
      loadRewarded();
    });
  });
}

// ---------- Setup ----------
/**
 * The game is for everyone, so every request is family-safe: child-directed,
 * under-age-of-consent, G-rated and non-personalized (no consent form needed).
 * Then initializes AdMob and preloads full-screen ads. Safe to call twice.
 */
export async function initAds(): Promise<void> {
  if (started) return;
  started = true;
  if (!sdk) {
    useAdStatus.setState({ rewardedReady: true });
    return;
  }
  const { default: mobileAds, MaxAdContentRating } = sdk;
  try {
    await mobileAds().setRequestConfiguration({
      maxAdContentRating: MaxAdContentRating.G,
      tagForChildDirectedTreatment: true,
      tagForUnderAgeOfConsent: true,
    });
    requestOptions = { requestNonPersonalizedAdsOnly: true };
    await mobileAds().initialize();
    useAdStatus.setState({ ready: true });
    // No app-open ads: Google Play Families policy forbids full-screen ads
    // at app launch, and every player gets family-safe ads.
    loadInterstitial();
    loadRewarded();
  } catch (err) {
    console.warn('[ads] init failed', err);
  }
}

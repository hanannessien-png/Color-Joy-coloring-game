import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useColors } from '@/hooks/useColors';
import {
  maybeShowInterstitial,
  noteCompletion,
  showRewarded,
  useAdStatus,
} from '@/src/ads/adManager';
import { fonts } from '@/constants/fonts';
import { ArtSvg, regionIdAtPoint, TargetArt } from '@/src/components/ArtSvg';
import { CompletionOverlay } from '@/src/components/CompletionOverlay';
import { IconButton } from '@/src/components/IconButton';
import { NumberPalette } from '@/src/components/NumberPalette';
import { Palette } from '@/src/components/Palette';
import { IMAGE_BY_ID } from '@/src/data/images';
import { LEVEL_INDEX, LEVELS, starsFor } from '@/src/data/levels';
import { useCanvasZoom } from '@/src/hooks/useCanvasZoom';
import { useArtStore } from '@/src/store/artStore';
import { levelArtKey, useGameStore } from '@/src/store/gameStore';
import { useHistoryStore } from '@/src/store/historyStore';
import { usePaletteStore } from '@/src/store/paletteStore';
import type { ColoringImage, Fill } from '@/src/types';

type Mode = 'level' | 'free';

export default function ColorScreen() {
  const { id, mode } = useLocalSearchParams<{ id: string; mode?: string }>();
  const image = id ? IMAGE_BY_ID[id] : undefined;
  const c = useColors();

  if (!image) {
    return (
      <View style={[styles.missing, { backgroundColor: c.background }]}>
        <MaterialCommunityIcons name="image-broken-variant" size={44} color={c.mutedForeground} />
        <Text style={[styles.missingText, { color: c.ink }]}>This picture could not be found</Text>
        <Pressable
          onPress={() => router.replace('/')}
          style={[styles.missingBtn, { backgroundColor: c.primary, borderColor: c.ink }]}
        >
          <Text style={styles.missingBtnText}>Back to start</Text>
        </Pressable>
      </View>
    );
  }
  const m: Mode = mode === 'level' && image.id in LEVEL_INDEX ? 'level' : 'free';
  return <Editor key={`${m}:${image.id}`} image={image} mode={m} />;
}

interface Result {
  stars?: number;
  coins?: number;
  mistakes?: number;
}

function Editor({ image, mode }: { image: ColoringImage; mode: Mode }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const isLevel = mode === 'level';
  const artKey = isLevel ? levelArtKey(image.id) : image.id;
  const levelIndex = LEVEL_INDEX[image.id] ?? 0;

  const [area, setArea] = useState({ w: 0, h: 0 });
  const size = Math.max(0, Math.floor(Math.min(area.w - 24, area.h - 16)));

  const total = image.regions.length;
  const fills = useArtStore((s) => s.fills[artKey]);
  const filled = fills ? Object.keys(fills).length : 0;
  const pct = total ? Math.round((filled / total) * 100) : 0;
  const canUndo = useHistoryStore((s) => s.undoStack.length > 0);
  const canRedo = useHistoryStore((s) => s.redoStack.length > 0);
  const mistakes = useGameStore((s) => s.runs[image.id]?.mistakes ?? 0);
  const [result, setResult] = useState<Result | null>(null);
  const [showRef, setShowRef] = useState(false);

  const regionById = useMemo(
    () => Object.fromEntries(image.regions.map((r) => [r.id, r])),
    [image],
  );

  // Paint-by-number progress for each color number.
  const numberProgress = useMemo(() => {
    const totals: Record<number, number> = {};
    const done: Record<number, number> = {};
    for (const r of image.regions) {
      totals[r.n] = (totals[r.n] ?? 0) + 1;
      if (fills?.[r.id]) done[r.n] = (done[r.n] ?? 0) + 1;
    }
    const out: Record<number, number> = {};
    for (const n of Object.keys(totals)) out[+n] = (done[+n] ?? 0) / totals[+n];
    return out;
  }, [image, fills]);

  const firstOpen = () => {
    const n = image.palette.findIndex((_, i) => (numberProgress[i + 1] ?? 0) < 1);
    return n === -1 ? 1 : n + 1;
  };
  const [activeNumber, setActiveNumber] = useState<number>(firstOpen);

  // If the selected color is already finished (e.g. saved progress loaded
  // after the screen opened), jump to the first color that still has work.
  useEffect(() => {
    if (!isLevel || (numberProgress[activeNumber] ?? 0) < 1) return;
    const open = image.palette.findIndex((_, i) => (numberProgress[i + 1] ?? 0) < 1);
    if (open !== -1) setActiveNumber(open + 1);
  }, [isLevel, numberProgress, activeNumber, image]);
  const rewardedReady = useAdStatus((s) => s.rewardedReady);

  useEffect(() => {
    useHistoryStore.getState().begin(artKey);
  }, [artKey]);

  // Wrong-color shake.
  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  const finishIfComplete = useCallback(() => {
    const now = useArtStore.getState().fills[artKey];
    if (!now || Object.keys(now).length < total) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    noteCompletion();
    if (isLevel) {
      const run = useGameStore.getState().runs[image.id] ?? { mistakes: 0, hints: 0 };
      const stars = starsFor(run.mistakes, run.hints);
      const coins = useGameStore.getState().finishLevel(image.id, stars);
      setResult({ stars, coins, mistakes: run.mistakes });
    } else {
      setResult({});
    }
  }, [artKey, total, isLevel, image.id]);

  const fillRegion = useCallback(
    (regionId: string) => {
      if (isLevel) {
        const region = regionById[regionId];
        if (!region || useArtStore.getState().fills[artKey]?.[regionId]) return;
        if (region.n !== activeNumber) {
          useGameStore.getState().addMistake(image.id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
          shake.value = withSequence(
            withTiming(-8, { duration: 50 }),
            withTiming(8, { duration: 50 }),
            withTiming(-5, { duration: 50 }),
            withTiming(0, { duration: 50 }),
          );
          return;
        }
        const fill: Fill = { kind: 'solid', color: image.palette[region.n - 1] };
        useArtStore.getState().applyChanges(artKey, [{ id: regionId, fill }]);
        Haptics.selectionAsync().catch(() => {});
        // Move on to the next unfinished color when this one is complete.
        const now = useArtStore.getState().fills[artKey] ?? {};
        const left = image.regions.some((r) => r.n === activeNumber && !now[r.id]);
        if (!left) {
          const next = image.palette.findIndex(
            (_, i) => image.regions.some((r) => r.n === i + 1 && !now[r.id]),
          );
          if (next !== -1) setActiveNumber(next + 1);
        }
        finishIfComplete();
        return;
      }
      const color = usePaletteStore.getState().color;
      const before = Object.keys(useArtStore.getState().fills[artKey] ?? {}).length;
      const changed = useHistoryStore
        .getState()
        .commit(artKey, [{ id: regionId, next: { kind: 'solid', color } }]);
      if (!changed) return;
      usePaletteStore.getState().markUsed(color);
      Haptics.selectionAsync().catch(() => {});
      // Celebrate only the tap that completes the picture, not later recolors.
      if (before < total) finishIfComplete();
    },
    [isLevel, regionById, artKey, activeNumber, image, shake, finishIfComplete, total],
  );

  const onWebTap = useCallback(
    (clientX: number, clientY: number) => {
      const regionId = regionIdAtPoint(clientX, clientY);
      if (regionId) fillRegion(regionId);
    },
    [fillRegion],
  );

  const zoom = useCanvasZoom(size, onWebTap);
  const { shouldIgnoreTap } = zoom;

  // Native: paths report presses directly; skip the ones that end a pan/pinch.
  const onRegionPress = useCallback(
    (regionId: string) => {
      if (!shouldIgnoreTap()) fillRegion(regionId);
    },
    [fillRegion, shouldIgnoreTap],
  );

  const goBack = () => (router.canGoBack() ? router.back() : router.replace(isLevel ? '/levels' : '/'));
  const nextLevel = LEVELS[levelIndex + 1];

  // Leaving the completion card is a natural break for an interstitial.
  const leaveAfterFinish = () => {
    maybeShowInterstitial();
    goBack();
  };

  const doubleCoins = async () => {
    const coins = result?.coins ?? 0;
    const ok = await showRewarded();
    if (ok && coins > 0) useGameStore.getState().addCoins(coins);
    return ok;
  };

  const goNextLevel = () => {
    maybeShowInterstitial();
    if (!nextLevel) return goBack();
    if (useGameStore.getState().stars[nextLevel.id]) {
      useArtStore.getState().clear(levelArtKey(nextLevel.id));
      useGameStore.getState().resetRun(nextLevel.id);
    }
    router.replace({ pathname: '/color/[id]', params: { id: nextLevel.id, mode: 'level' } });
  };

  const miniRef = 62;
  const bigRef = Math.max(0, size - 40);

  return (
    <View style={[styles.root, { backgroundColor: c.background, paddingTop: topPad + 6 }]}>
      <View style={styles.topBar}>
        <IconButton icon="chevron-left" accessibilityLabel="Back" testID="back" onPress={goBack} />
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: c.ink }]} numberOfLines={1}>
            {isLevel ? `Level ${levelIndex + 1}` : image.title}
          </Text>
          <View style={[styles.progressTrack, { backgroundColor: c.muted, borderColor: c.border }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${pct}%`, backgroundColor: pct === 100 ? c.leaf : c.primary },
              ]}
            />
          </View>
        </View>
        {!isLevel ? (
          <>
            <IconButton
              icon="image-outline"
              accessibilityLabel="Show finished picture"
              testID="toggle-reference"
              onPress={() => setShowRef(true)}
            />
            <IconButton
              icon="undo-variant"
              accessibilityLabel="Undo"
              testID="undo"
              disabled={!canUndo}
              onPress={() => useHistoryStore.getState().undo()}
            />
            <IconButton
              icon="redo-variant"
              accessibilityLabel="Redo"
              testID="redo"
              disabled={!canRedo}
              onPress={() => useHistoryStore.getState().redo()}
            />
          </>
        ) : null}
      </View>

      <View
        style={styles.canvasArea}
        onLayout={(e) => setArea({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      >
        {size > 0 ? (
          <Animated.View style={shakeStyle}>
            <GestureDetector gesture={zoom.gesture}>
              <View
                collapsable={false}
                style={[
                  styles.canvasFrame,
                  { width: size, height: size, borderColor: c.ink, backgroundColor: c.paper },
                ]}
              >
                <Animated.View style={zoom.animatedStyle}>
                  <ArtSvg
                    image={image}
                    size={size - 6}
                    artKey={artKey}
                    onRegionPress={onRegionPress}
                    showNumbers={isLevel}
                    activeNumber={isLevel ? activeNumber : undefined}
                  />
                </Animated.View>
              </View>
            </GestureDetector>
          </Animated.View>
        ) : null}

        <View style={styles.zoomCol}>
          <IconButton icon="plus" size={40} accessibilityLabel="Zoom in" testID="zoom-in" onPress={zoom.zoomIn} />
          <IconButton icon="minus" size={40} accessibilityLabel="Zoom out" testID="zoom-out" onPress={zoom.zoomOut} />
          <IconButton icon="fit-to-screen-outline" size={40} accessibilityLabel="Fit picture" testID="zoom-fit" onPress={zoom.reset} />
        </View>
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: c.paper, borderColor: c.ink }]}>
            <Text style={[styles.badgeText, { color: c.ink }]}>{pct}%</Text>
          </View>
          {isLevel ? (
            <View
              testID="mistakes"
              style={[styles.badge, { backgroundColor: mistakes ? c.errorSoft : c.paper, borderColor: c.ink }]}
            >
              <MaterialCommunityIcons name="close-thick" size={14} color={mistakes ? c.destructive : c.mutedForeground} />
              <Text style={[styles.badgeText, { color: c.ink }]}>{mistakes}</Text>
            </View>
          ) : null}
        </View>

        {showRef ? (
          <Pressable
            testID="reference-big"
            accessibilityLabel="Close reference picture"
            onPress={() => setShowRef(false)}
            style={[styles.refBigWrap, { backgroundColor: 'rgba(255,247,236,0.92)' }]}
          >
            <View style={[styles.refBig, { borderColor: c.ink, backgroundColor: c.paper }]}>
              <TargetArt image={image} size={bigRef} />
            </View>
            <Text style={[styles.refHint, { color: c.ink }]}>Color it like this · tap to close</Text>
          </Pressable>
        ) : null}
      </View>

      <View
        style={[
          styles.panel,
          { backgroundColor: c.paper, borderColor: c.border, paddingBottom: bottomPad + 10 },
        ]}
      >
        {isLevel ? (
          <View style={styles.levelPanel}>
            <Pressable
              testID="reference-mini"
              accessibilityLabel="Show finished picture"
              onPress={() => setShowRef(true)}
              style={[styles.refMini, { borderColor: c.ink, backgroundColor: c.paper }]}
            >
              <TargetArt image={image} size={miniRef} strokeWidth={7} />
              <View style={[styles.refTag, { backgroundColor: c.ink }]}>
                <MaterialCommunityIcons name="magnify-plus-outline" size={12} color="#FFFFFF" />
              </View>
            </Pressable>
            <View style={{ flex: 1 }}>
              <NumberPalette
                palette={image.palette}
                active={activeNumber}
                progress={numberProgress}
                onSelect={setActiveNumber}
              />
            </View>
          </View>
        ) : (
          <Palette />
        )}
      </View>

      {result ? (
        isLevel ? (
          <CompletionOverlay
            image={image}
            artKey={artKey}
            onDoubleCoins={doubleCoins}
            doubleReady={rewardedReady}
            stars={result.stars}
            coinsEarned={result.coins}
            mistakes={result.mistakes}
            primaryLabel={nextLevel ? 'Next level' : 'Back to levels'}
            onPrimary={goNextLevel}
            secondaryLabel="Levels map"
            onSecondary={leaveAfterFinish}
          />
        ) : (
          <CompletionOverlay
            image={image}
            artKey={artKey}
            primaryLabel="Pick another picture"
            onPrimary={leaveAfterFinish}
            secondaryLabel="Keep coloring"
            onSecondary={() => setResult(null)}
          />
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 6,
  },
  titleWrap: { flex: 1, gap: 5, paddingHorizontal: 4 },
  title: { fontFamily: fonts.black, fontSize: 19 },
  progressTrack: { height: 10, borderRadius: 5, borderWidth: 1.5, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5 },
  canvasArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  canvasFrame: {
    borderRadius: 24,
    borderWidth: 3,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelPanel: { flexDirection: 'row', alignItems: 'center', paddingLeft: 12 },
  refMini: {
    padding: 2,
    borderRadius: 14,
    borderWidth: 2.5,
    marginRight: 2,
  },
  refTag: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refBigWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  refBig: { padding: 6, borderRadius: 24, borderWidth: 3 },
  refHint: { fontFamily: fonts.extrabold, fontSize: 15 },
  zoomCol: { position: 'absolute', right: 18, bottom: 16, gap: 8 },
  badges: { position: 'absolute', left: 22, bottom: 16, flexDirection: 'row', gap: 6 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
  },
  badgeText: { fontFamily: fonts.black, fontSize: 15 },
  panel: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 2,
    borderBottomWidth: 0,
    paddingTop: 10,
  },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  missingText: { fontFamily: fonts.extrabold, fontSize: 17 },
  missingBtn: {
    height: 54,
    paddingHorizontal: 26,
    borderRadius: 27,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missingBtnText: { fontFamily: fonts.black, fontSize: 17, color: '#FFFFFF' },
});

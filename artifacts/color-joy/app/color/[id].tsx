import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
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
import { fonts } from '@/constants/fonts';
import {
  maybeShowInterstitial,
  noteCompletion,
  rewardedLeftToday,
  showRewarded,
  useAdStatus,
} from '@/src/ads/adManager';
import { ArtSvg, regionIdAtPoint, TargetArt } from '@/src/components/ArtSvg';
import { CompletionOverlay } from '@/src/components/CompletionOverlay';
import { FailOverlay } from '@/src/components/FailOverlay';
import { HeartsBar } from '@/src/components/HeartsBar';
import { IconButton } from '@/src/components/IconButton';
import { Palette } from '@/src/components/Palette';
import { PencilTray } from '@/src/components/PencilTray';
import { ToolBar } from '@/src/components/ToolBar';
import { IMAGE_BY_ID } from '@/src/data/images';
import { LEVEL_INDEX, LEVELS, levelPencils, starsFor } from '@/src/data/levels';
import { TOOL_BY_ID, type ToolId } from '@/src/data/shop';
import { useCanvasZoom } from '@/src/hooks/useCanvasZoom';
import { useArtStore } from '@/src/store/artStore';
import { levelArtKey, runOf, useGameStore } from '@/src/store/gameStore';
import { useHistoryStore } from '@/src/store/historyStore';
import { usePaletteStore } from '@/src/store/paletteStore';
import type { ColoringImage, Fill } from '@/src/types';
import { sameColor } from '@/src/utils/color';

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
          <Text style={[styles.missingBtnText, { color: c.paper }]}>Back to start</Text>
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

const FRAME_MARGIN = 6;
const CONTROLS_H = 44;

function Editor({ image, mode }: { image: ColoringImage; mode: Mode }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const isLevel = mode === 'level';
  const { height: winH } = useWindowDimensions();
  // Tall phones: spend spare height on bigger, easier-to-see pencils.
  const pencilW = winH >= 820 ? 44 : winH >= 720 ? 38 : 34;
  const artKey = isLevel ? levelArtKey(image.id) : image.id;
  const levelIndex = LEVEL_INDEX[image.id] ?? 0;

  // The picture is as big as the screen allows; the paper hugs it tightly.
  const [area, setArea] = useState({ w: 0, h: 0 });
  const frame = Math.max(
    0,
    Math.floor(Math.min(area.w - FRAME_MARGIN * 2, area.h - CONTROLS_H - FRAME_MARGIN)),
  );
  const size = Math.max(0, frame - 5);

  const total = image.regions.length;
  const fills = useArtStore((s) => s.fills[artKey]);
  const filled = fills ? Object.keys(fills).length : 0;
  const pct = total ? Math.round((filled / total) * 100) : 0;
  const canUndo = useHistoryStore((s) => s.undoStack.length > 0);
  const canRedo = useHistoryStore((s) => s.redoStack.length > 0);
  const hearts = useGameStore((s) => runOf(s.runs, image.id).hearts);
  const revived = useGameStore((s) => runOf(s.runs, image.id).revived);
  const rewardedReady = useAdStatus((s) => s.rewardedReady);
  const [result, setResult] = useState<Result | null>(null);
  const [showRef, setShowRef] = useState(false);

  // Level state: chosen pencil, armed tool, hinted part.
  const pencils = useMemo(() => (isLevel ? levelPencils(image) : []), [isLevel, image]);
  const [pencil, setPencil] = useState<string | null>(null);
  const [armed, setArmed] = useState<ToolId | null>(null);
  const [hintId, setHintId] = useState<string | null>(null);
  const failed = isLevel && hearts <= 0 && !result;

  const regionById = useMemo(
    () => Object.fromEntries(image.regions.map((r) => [r.id, r])),
    [image],
  );
  const targetOf = useCallback(
    (regionId: string) => {
      const r = regionById[regionId];
      return r ? image.palette[r.n - 1] : undefined;
    },
    [regionById, image],
  );

  // Pencils whose parts are all colored get a check mark.
  const doneColors = useMemo(() => {
    const left = new Set<string>();
    for (const r of image.regions) if (!fills?.[r.id]) left.add(image.palette[r.n - 1].toLowerCase());
    return new Set(image.palette.map((p) => p.toLowerCase()).filter((p) => !left.has(p)));
  }, [image, fills]);

  useEffect(() => {
    useHistoryStore.getState().begin(artKey);
  }, [artKey]);

  // Clear a hint once its part has been colored.
  useEffect(() => {
    if (hintId && fills?.[hintId]) setHintId(null);
  }, [hintId, fills]);

  // Feedback animations: canvas shake (wrong color), tray nudge (no pencil).
  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));
  const nudge = useSharedValue(0);
  const nudgeStyle = useAnimatedStyle(() => ({ transform: [{ translateY: nudge.value }] }));
  const wiggle = (v: typeof shake, amp: number) => {
    v.value = withSequence(
      withTiming(-amp, { duration: 50 }),
      withTiming(amp, { duration: 50 }),
      withTiming(-amp / 2, { duration: 50 }),
      withTiming(0, { duration: 50 }),
    );
  };

  const finishIfComplete = useCallback(() => {
    const now = useArtStore.getState().fills[artKey];
    if (!now || Object.keys(now).length < total) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    noteCompletion();
    if (isLevel) {
      const run = runOf(useGameStore.getState().runs, image.id);
      const stars = starsFor(run.mistakes);
      const coins = useGameStore.getState().finishLevel(image.id, stars);
      setResult({ stars, coins, mistakes: run.mistakes });
    } else {
      setResult({});
    }
  }, [artKey, total, isLevel, image.id]);

  /** Level mode: color parts with their right colors. */
  const paintCorrect = useCallback(
    (ids: string[]) => {
      const now = useArtStore.getState().fills[artKey] ?? {};
      const changes = ids
        .filter((id) => !now[id])
        .map((id) => ({ id, fill: { kind: 'solid', color: targetOf(id) ?? '' } as Fill }));
      if (!changes.length) return;
      useArtStore.getState().applyChanges(artKey, changes);
      finishIfComplete();
    },
    [artKey, targetOf, finishIfComplete],
  );

  const fillRegion = useCallback(
    (regionId: string) => {
      if (!isLevel) {
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
        return;
      }

      const target = targetOf(regionId);
      if (!target || useArtStore.getState().fills[artKey]?.[regionId]) return;
      if (runOf(useGameStore.getState().runs, image.id).hearts <= 0) return;

      if (armed) {
        if (!useGameStore.getState().consumeTool(armed)) {
          setArmed(null);
          return;
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        const ids =
          armed === 'bomb'
            ? image.regions.filter((r) => sameColor(image.palette[r.n - 1], target)).map((r) => r.id)
            : [regionId];
        setArmed(null);
        paintCorrect(ids);
        return;
      }

      if (!pencil) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        wiggle(nudge, 6);
        return;
      }
      if (!sameColor(pencil, target)) {
        useGameStore.getState().addMistake(image.id);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        wiggle(shake, 9);
        return;
      }
      Haptics.selectionAsync().catch(() => {});
      paintCorrect([regionId]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isLevel, artKey, total, finishIfComplete, targetOf, image, armed, pencil, paintCorrect],
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

  const pressTool = (id: ToolId) => {
    if (armed === id) {
      setArmed(null);
      return;
    }
    if (id !== 'hint') {
      setArmed(id);
      return;
    }
    setArmed(null);
    const now = useArtStore.getState().fills[artKey] ?? {};
    // A hint already showing: just pick its pencil again, for free.
    const existing = hintId && !now[hintId] ? hintId : null;
    const regionId = existing ?? image.regions.find((r) => !now[r.id])?.id;
    if (!regionId) return;
    if (!existing && !useGameStore.getState().consumeTool('hint')) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setHintId(regionId);
    const target = targetOf(regionId);
    if (target) setPencil(pencils.find((p) => sameColor(p, target)) ?? target);
  };

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

  const revive = async () => {
    const ok = await showRewarded();
    if (ok) useGameStore.getState().revive(image.id);
    return ok;
  };

  const retry = () => {
    useArtStore.getState().clear(artKey);
    useGameStore.getState().resetRun(image.id);
    setPencil(null);
    setArmed(null);
    setHintId(null);
    zoom.reset();
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

  const banner = isLevel
    ? armed
      ? `${TOOL_BY_ID[armed].name}: tap a part`
      : !pencil && filled === 0
        ? 'Pick a pencil, tap a part'
        : null
    : null;

  return (
    <View style={[styles.root, { backgroundColor: c.background, paddingTop: topPad + 4 }]}>
      <View style={styles.topBar}>
        <IconButton icon="chevron-left" size={44} accessibilityLabel="Back" testID="back" onPress={goBack} />
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
        {isLevel ? (
          <>
            <HeartsBar hearts={hearts} />
            <Pressable
              testID="reference-mini"
              accessibilityLabel="Show finished picture"
              onPress={() => setShowRef(true)}
              style={[styles.refMini, { borderColor: c.ink, backgroundColor: c.paper }]}
            >
              <TargetArt image={image} size={40} strokeWidth={9} />
            </Pressable>
          </>
        ) : (
          <>
            <IconButton
              icon="image-outline"
              size={44}
              accessibilityLabel="Show finished picture"
              testID="toggle-reference"
              onPress={() => setShowRef(true)}
            />
            <IconButton
              icon="undo-variant"
              size={44}
              accessibilityLabel="Undo"
              testID="undo"
              disabled={!canUndo}
              onPress={() => useHistoryStore.getState().undo()}
            />
            <IconButton
              icon="redo-variant"
              size={44}
              accessibilityLabel="Redo"
              testID="redo"
              disabled={!canRedo}
              onPress={() => useHistoryStore.getState().redo()}
            />
          </>
        )}
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
                  {
                    width: frame,
                    height: frame,
                    borderColor: c.border,
                    backgroundColor: c.paper,
                    shadowColor: c.ink,
                  },
                ]}
              >
                <Animated.View style={zoom.animatedStyle}>
                  <ArtSvg
                    image={image}
                    size={size}
                    artKey={artKey}
                    onRegionPress={onRegionPress}
                    hintRegionId={isLevel ? hintId : null}
                  />
                </Animated.View>
              </View>
            </GestureDetector>
          </Animated.View>
        ) : null}

        <View style={[styles.controls, { width: frame }]}>
          <View style={styles.bannerSlot}>
            {banner ? (
              <View style={[styles.banner, { backgroundColor: c.plum }]}>
                <Text style={[styles.bannerText, { color: c.paper }]} numberOfLines={1}>
                  {banner}
                </Text>
                {armed ? (
                  <Pressable testID="cancel-tool" hitSlop={10} onPress={() => setArmed(null)}>
                    <MaterialCommunityIcons name="close-circle" size={20} color={c.paper} />
                  </Pressable>
                ) : null}
              </View>
            ) : (
              <Text testID="progress-pct" style={[styles.pctText, { color: c.mutedForeground }]}>
                {pct}% colored
              </Text>
            )}
          </View>
          <IconButton icon="minus" size={36} accessibilityLabel="Zoom out" testID="zoom-out" onPress={zoom.zoomOut} />
          <IconButton icon="fit-to-screen-outline" size={36} accessibilityLabel="Fit picture" testID="zoom-fit" onPress={zoom.reset} />
          <IconButton icon="plus" size={36} accessibilityLabel="Zoom in" testID="zoom-in" onPress={zoom.zoomIn} />
        </View>

        {showRef ? (
          <Pressable
            testID="reference-big"
            accessibilityLabel="Close reference picture"
            onPress={() => setShowRef(false)}
            style={[styles.refBigWrap, { backgroundColor: c.scrim }]}
          >
            <View style={[styles.refBig, { borderColor: c.ink, backgroundColor: c.paper }]}>
              <TargetArt image={image} size={Math.max(0, size - 24)} />
            </View>
            <View style={[styles.refHintPill, { backgroundColor: c.paper }]}>
              <Text style={[styles.refHint, { color: c.ink }]}>Color it like this · tap to close</Text>
            </View>
          </Pressable>
        ) : null}
      </View>

      <View style={[styles.panel, { paddingBottom: bottomPad + 6 }]}>
        {isLevel ? (
          <>
            <ToolBar armed={armed} onUse={pressTool} />
            <Animated.View style={nudgeStyle}>
              <PencilTray
                colors={pencils}
                selected={pencil}
                onSelect={(p) => {
                  setPencil(p);
                  if (armed) setArmed(null);
                }}
                done={doneColors}
                pencilWidth={pencilW}
              />
            </Animated.View>
          </>
        ) : (
          <Palette pencilWidth={pencilW} />
        )}
      </View>

      {failed ? (
        <FailOverlay
          onRevive={!revived && rewardedReady && rewardedLeftToday() > 0 ? revive : undefined}
          onRetry={retry}
          onLeave={goBack}
        />
      ) : null}

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
    gap: 6,
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  titleWrap: { flex: 1, gap: 4, paddingHorizontal: 2 },
  title: { fontFamily: fonts.black, fontSize: 18 },
  progressTrack: { height: 8, borderRadius: 4, borderWidth: 1.5, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  refMini: { padding: 1, borderRadius: 12, borderWidth: 2.5, overflow: 'hidden' },
  canvasArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  canvasFrame: {
    borderRadius: 18,
    borderWidth: 2.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 0,
    elevation: 3,
  },
  controls: { height: CONTROLS_H, flexDirection: 'row', alignItems: 'center', gap: 6 },
  bannerSlot: { flex: 1, alignItems: 'flex-start' },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: '100%',
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 17,
  },
  bannerText: { flexShrink: 1, fontFamily: fonts.extrabold, fontSize: 13 },
  refBigWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  refBig: { padding: 8, borderRadius: 24, borderWidth: 3 },
  refHintPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  refHint: { fontFamily: fonts.extrabold, fontSize: 14 },
  pctText: { fontFamily: fonts.extrabold, fontSize: 14, paddingLeft: 6 },
  panel: { gap: 10, paddingTop: 10 },
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
  missingBtnText: { fontFamily: fonts.black, fontSize: 17 },
});

import React, { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useColors } from '@/hooks/useColors';
import { fonts } from '@/constants/fonts';
import { ArtSvg, regionIdAtPoint, useFilledCount } from '@/src/components/ArtSvg';
import { IconButton } from '@/src/components/IconButton';
import { Palette } from '@/src/components/Palette';
import { IMAGE_BY_ID } from '@/src/data/images';
import { useCanvasZoom } from '@/src/hooks/useCanvasZoom';
import { useArtStore } from '@/src/store/artStore';
import { useHistoryStore } from '@/src/store/historyStore';
import { usePaletteStore } from '@/src/store/paletteStore';
import type { ColoringImage } from '@/src/types';

export default function ColorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const image = id ? IMAGE_BY_ID[id] : undefined;
  const c = useColors();

  if (!image) {
    return (
      <View style={[styles.missing, { backgroundColor: c.background }]}>
        <MaterialCommunityIcons name="image-broken-variant" size={44} color={c.mutedForeground} />
        <Text style={[styles.missingText, { color: c.ink }]}>This picture could not be found</Text>
        <Pressable
          onPress={() => router.replace('/')}
          style={[styles.primaryBtn, { backgroundColor: c.primary, borderColor: c.ink }]}
        >
          <Text style={styles.primaryBtnText}>Back to pictures</Text>
        </Pressable>
      </View>
    );
  }
  return <Editor image={image} />;
}

function Editor({ image }: { image: ColoringImage }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [area, setArea] = useState({ w: 0, h: 0 });
  const size = Math.max(0, Math.floor(Math.min(area.w - 24, area.h - 16)));

  const total = image.regions.length;
  const filled = useFilledCount(image.id);
  const pct = total ? Math.round((filled / total) * 100) : 0;
  const canUndo = useHistoryStore((s) => s.undoStack.length > 0);
  const canRedo = useHistoryStore((s) => s.redoStack.length > 0);
  const [showDone, setShowDone] = useState(false);

  useEffect(() => {
    useHistoryStore.getState().begin(image.id);
  }, [image.id]);

  const fillRegion = useCallback(
    (regionId: string) => {
      const color = usePaletteStore.getState().color;
      const changed = useHistoryStore
        .getState()
        .commit(image.id, [{ id: regionId, next: { kind: 'solid', color } }]);
      if (!changed) return;
      usePaletteStore.getState().markUsed(color);
      Haptics.selectionAsync().catch(() => {});
      const now = useArtStore.getState().fills[image.id];
      if (now && Object.keys(now).length === total) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        setShowDone(true);
      }
    },
    [image.id, total],
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

  return (
    <View style={[styles.root, { backgroundColor: c.background, paddingTop: topPad + 6 }]}>
      <View style={styles.topBar}>
        <IconButton
          icon="chevron-left"
          accessibilityLabel="Back"
          testID="back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        />
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: c.ink }]} numberOfLines={1}>
            {image.title}
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
      </View>

      <View
        style={styles.canvasArea}
        onLayout={(e) => setArea({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      >
        {size > 0 ? (
          <GestureDetector gesture={zoom.gesture}>
            <View
              collapsable={false}
              style={[
                styles.canvasFrame,
                { width: size, height: size, borderColor: c.ink, backgroundColor: c.paper },
              ]}
            >
              <Animated.View style={zoom.animatedStyle}>
                <ArtSvg image={image} size={size - 6} onRegionPress={onRegionPress} />
              </Animated.View>
            </View>
          </GestureDetector>
        ) : null}
        <View style={styles.zoomCol}>
          <IconButton icon="plus" size={40} accessibilityLabel="Zoom in" testID="zoom-in" onPress={zoom.zoomIn} />
          <IconButton icon="minus" size={40} accessibilityLabel="Zoom out" testID="zoom-out" onPress={zoom.zoomOut} />
          <IconButton icon="fit-to-screen-outline" size={40} accessibilityLabel="Fit picture" testID="zoom-fit" onPress={zoom.reset} />
        </View>
        <View style={[styles.pctBadge, { backgroundColor: c.paper, borderColor: c.ink }]}>
          <Text style={[styles.pctText, { color: c.ink }]}>{pct}%</Text>
        </View>
      </View>

      <View
        style={[
          styles.panel,
          { backgroundColor: c.paper, borderColor: c.border, paddingBottom: bottomPad + 10 },
        ]}
      >
        <Palette />
      </View>

      {showDone ? (
        <Animated.View entering={FadeIn.duration(200)} style={[styles.overlay, { backgroundColor: 'rgba(46,42,59,0.45)' }]}>
          <Animated.View
            entering={ZoomIn.springify().damping(14)}
            style={[styles.doneCard, { backgroundColor: c.paper, borderColor: c.ink }]}
          >
            <View style={[styles.doneBadge, { backgroundColor: c.sun, borderColor: c.ink }]}>
              <MaterialCommunityIcons name="star-four-points" size={40} color={c.ink} />
            </View>
            <Text style={[styles.doneTitle, { color: c.ink }]}>Masterpiece!</Text>
            <Text style={[styles.doneSub, { color: c.mutedForeground }]}>
              You colored every part of {image.title}.
            </Text>
            <Pressable
              testID="done-home"
              onPress={() => {
                setShowDone(false);
                router.canGoBack() ? router.back() : router.replace('/');
              }}
              style={({ pressed }) => [
                styles.primaryBtn,
                { backgroundColor: c.primary, borderColor: c.ink, transform: [{ scale: pressed ? 0.96 : 1 }] },
              ]}
            >
              <Text style={styles.primaryBtnText}>Pick another picture</Text>
            </Pressable>
            <Pressable testID="done-keep" onPress={() => setShowDone(false)} hitSlop={8}>
              <Text style={[styles.linkText, { color: c.ink }]}>Keep coloring</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
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
  zoomCol: { position: 'absolute', right: 18, bottom: 16, gap: 8 },
  pctBadge: {
    position: 'absolute',
    left: 22,
    bottom: 16,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    justifyContent: 'center',
  },
  pctText: { fontFamily: fonts.black, fontSize: 15 },
  panel: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 2,
    borderBottomWidth: 0,
    paddingTop: 10,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  doneCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
    borderWidth: 3,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  doneBadge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -62,
  },
  doneTitle: { fontFamily: fonts.black, fontSize: 28 },
  doneSub: { fontFamily: fonts.bold, fontSize: 15, textAlign: 'center' },
  primaryBtn: {
    marginTop: 8,
    height: 54,
    paddingHorizontal: 26,
    borderRadius: 27,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  primaryBtnText: { fontFamily: fonts.black, fontSize: 17, color: '#FFFFFF' },
  linkText: { fontFamily: fonts.extrabold, fontSize: 15, paddingVertical: 8 },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  missingText: { fontFamily: fonts.extrabold, fontSize: 17 },
});

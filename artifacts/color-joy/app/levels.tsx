import React, { useEffect, useRef } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useColors } from '@/hooks/useColors';
import { fonts } from '@/constants/fonts';
import { TargetArt } from '@/src/components/ArtSvg';
import { CoinChip } from '@/src/components/CoinChip';
import { IconButton } from '@/src/components/IconButton';
import { CATEGORY_BY_ID } from '@/src/data/categories';
import { LEVELS } from '@/src/data/levels';
import { useArtStore } from '@/src/store/artStore';
import {
  currentLevelIndex,
  isLevelUnlocked,
  levelArtKey,
  useGameStore,
} from '@/src/store/gameStore';
import type { ColoringImage } from '@/src/types';

const ROW = 128;
const NODE = 84;
const WAVE = [0, 0.75, 1, 0.25, -0.75, -1, -0.25];

function PulseRing({ color }: { color: string }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 1300 }), -1, false);
  }, [t]);
  const style = useAnimatedStyle(() => ({
    opacity: 0.6 * (1 - t.value),
    transform: [{ scale: 1 + 0.45 * t.value }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.pulse, { borderColor: color }, style]}
    />
  );
}

function LevelNode({
  level,
  index,
  stars,
  unlocked,
  current,
}: {
  level: ColoringImage;
  index: number;
  stars: number;
  unlocked: boolean;
  current: boolean;
}) {
  const c = useColors();
  const cat = CATEGORY_BY_ID[level.category];
  const done = stars > 0;

  const open = () => {
    if (!unlocked) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (done) {
      // Replaying a finished level starts from a blank picture.
      useArtStore.getState().clear(levelArtKey(level.id));
      useGameStore.getState().resetRun(level.id);
    }
    router.push({ pathname: '/color/[id]', params: { id: level.id, mode: 'level' } });
  };

  return (
    <View style={styles.nodeWrap}>
      {current ? <PulseRing color={cat.color} /> : null}
      <Pressable
        testID={`level-${index + 1}`}
        accessibilityLabel={`Level ${index + 1}${unlocked ? '' : ', locked'}`}
        onPress={open}
        style={({ pressed }) => [
          styles.node,
          {
            backgroundColor: unlocked ? (done ? c.paper : cat.color) : c.locked,
            borderColor: c.ink,
            shadowColor: c.ink,
            transform: [{ translateY: pressed && unlocked ? 4 : 0 }],
            shadowOffset: { width: 0, height: pressed && unlocked ? 1 : 5 },
          },
        ]}
      >
        {!unlocked ? (
          <MaterialCommunityIcons name="lock" size={30} color={c.paper} />
        ) : done ? (
          <TargetArt image={level} size={NODE - 14} strokeWidth={8} />
        ) : (
          <Text style={styles.nodeNum}>{index + 1}</Text>
        )}
      </Pressable>
      {done ? (
        <View style={styles.starsRow}>
          {[0, 1, 2].map((i) => (
            <MaterialCommunityIcons
              key={i}
              name="star"
              size={i === 1 ? 24 : 20}
              color={i < stars ? c.gold : c.locked}
              style={i === 1 ? { marginTop: -6 } : undefined}
            />
          ))}
        </View>
      ) : current ? (
        <View style={[styles.playTag, { backgroundColor: c.ink }]}>
          <Text style={styles.playTagText}>PLAY</Text>
        </View>
      ) : (
        <Text style={[styles.nodeTitle, { color: unlocked ? c.ink : c.mutedForeground }]}>
          Level {index + 1}
        </Text>
      )}
    </View>
  );
}

export default function LevelsScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const stars = useGameStore((s) => s.stars);
  const current = currentLevelIndex(stars);
  const scrollRef = useRef<ScrollView>(null);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const mapW = Math.min(width, 520);
  const amp = Math.min(110, mapW / 2 - NODE / 2 - 24);
  const pts = LEVELS.map((_, i) => ({
    x: mapW / 2 + WAVE[i % WAVE.length] * amp,
    y: 40 + NODE / 2 + i * ROW,
  }));
  const mapH = pts.length ? pts[pts.length - 1].y + NODE / 2 + 70 : 0;
  const trail = pts
    .map((p, i) => {
      if (i === 0) return `M${p.x} ${p.y}`;
      const prev = pts[i - 1];
      const my = (prev.y + p.y) / 2;
      return `C${prev.x} ${my} ${p.x} ${my} ${p.x} ${p.y}`;
    })
    .join('');
  const finished = Object.keys(stars).filter((id) => LEVELS.some((l) => l.id === id)).length;

  useEffect(() => {
    const y = Math.max(0, current * ROW - 160);
    const t = setTimeout(() => scrollRef.current?.scrollTo({ y, animated: false }), 50);
    return () => clearTimeout(t);
  }, [current]);

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 6, borderColor: c.border }]}>
        <IconButton
          icon="chevron-left"
          accessibilityLabel="Back"
          testID="back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        />
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: c.ink }]}>Levels</Text>
          <Text style={[styles.sub, { color: c.mutedForeground }]}>
            {finished} of {LEVELS.length} finished
          </Text>
        </View>
        <CoinChip />
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingBottom: bottomPad + 20, alignItems: 'center' }}
      >
        <View style={{ width: mapW, height: mapH }}>
          <Svg width={mapW} height={mapH} style={StyleSheet.absoluteFill}>
            <Path d={trail} stroke={c.border} strokeWidth={22} fill="none" strokeLinecap="round" />
            <Path
              d={trail}
              stroke={c.paper}
              strokeWidth={6}
              fill="none"
              strokeDasharray="2 16"
              strokeLinecap="round"
            />
          </Svg>
          {LEVELS.map((level, i) => (
            <View
              key={level.id}
              style={[styles.nodeSlot, { left: pts[i].x - 70, top: pts[i].y - NODE / 2 }]}
            >
              <LevelNode
                level={level}
                index={i}
                stars={stars[level.id] ?? 0}
                unlocked={isLevelUnlocked(i, stars)}
                current={i === current && !stars[level.id]}
              />
            </View>
          ))}
        </View>
        <View style={[styles.moreCard, { borderColor: c.border, backgroundColor: c.paper }]}>
          <MaterialCommunityIcons name="palette-swatch-outline" size={26} color={c.violet} />
          <Text style={[styles.moreText, { color: c.mutedForeground }]}>More levels coming soon</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
  },
  title: { fontFamily: fonts.black, fontSize: 26 },
  sub: { fontFamily: fonts.bold, fontSize: 13, marginTop: -2 },
  nodeSlot: { position: 'absolute', width: 140, alignItems: 'center' },
  nodeWrap: { alignItems: 'center', gap: 8 },
  node: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    borderWidth: 3.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  pulse: {
    position: 'absolute',
    top: 0,
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    borderWidth: 6,
  },
  nodeNum: { fontFamily: fonts.black, fontSize: 32, color: '#FFFFFF' },
  starsRow: { flexDirection: 'row', alignItems: 'flex-start' },
  playTag: { paddingHorizontal: 12, paddingVertical: 3, borderRadius: 10 },
  playTagText: { fontFamily: fonts.black, fontSize: 13, color: '#FFFFFF', letterSpacing: 1 },
  nodeTitle: { fontFamily: fonts.extrabold, fontSize: 13 },
  moreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  moreText: { fontFamily: fonts.extrabold, fontSize: 14 },
});

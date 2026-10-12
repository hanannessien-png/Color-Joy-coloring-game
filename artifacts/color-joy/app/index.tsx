import React, { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useColors } from '@/hooks/useColors';
import { fonts } from '@/constants/fonts';
import { TargetArt } from '@/src/components/ArtSvg';
import { CoinChip } from '@/src/components/CoinChip';
import { IMAGE_BY_ID } from '@/src/data/images';
import { LEVELS } from '@/src/data/levels';
import { currentLevelIndex, useGameStore } from '@/src/store/gameStore';

const HERO_IMAGE = IMAGE_BY_ID['nature-sunflower'];

/** A soft paint blob that drifts up and down forever. */
function Blob({
  color,
  size,
  top,
  left,
  delay,
}: {
  color: string;
  size: number;
  top: number;
  left: number;
  delay: number;
}) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
  }, [t, delay]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: -14 * t.value }, { scale: 1 + 0.06 * t.value }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.blob,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color, top, left },
        style,
      ]}
    />
  );
}

function BigButton({
  label,
  sub,
  icon,
  color,
  textColor,
  onPress,
  testID,
}: {
  label: string;
  sub?: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  textColor: string;
  onPress: () => void;
  testID: string;
}) {
  const c = useColors();
  return (
    <Pressable
      testID={testID}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [
        styles.bigBtn,
        {
          backgroundColor: color,
          borderColor: c.ink,
          shadowColor: c.ink,
          transform: [{ translateY: pressed ? 4 : 0 }],
          shadowOffset: { width: 0, height: pressed ? 1 : 5 },
        },
      ]}
    >
      <View style={[styles.bigIcon, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
        <MaterialCommunityIcons name={icon} size={30} color={textColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.bigLabel, { color: textColor }]}>{label}</Text>
        {sub ? <Text style={[styles.bigSub, { color: textColor }]}>{sub}</Text> : null}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={30} color={textColor} />
    </Pressable>
  );
}

export default function TitleScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const stars = useGameStore((s) => s.stars);
  const levelIdx = currentLevelIndex(stars);
  const allDone = LEVELS.every((l) => stars[l.id]);
  const totalStars = Object.values(stars).reduce((a, b) => a + b, 0);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const w = Math.min(width, 520);
  const heroSize = Math.min(w * 0.58, height * 0.3, 260);

  // Entrance: logo drops in, hero card bobs gently.
  const drop = useSharedValue(0);
  const bob = useSharedValue(0);
  useEffect(() => {
    drop.value = withSpring(1, { damping: 11, stiffness: 120 });
    bob.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );
  }, [drop, bob]);
  const titleStyle = useAnimatedStyle(() => ({
    opacity: drop.value,
    transform: [{ translateY: (1 - drop.value) * -40 }, { scale: 0.8 + 0.2 * drop.value }],
  }));
  const heroStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -8 * bob.value }, { rotate: `${-6 + 4 * bob.value}deg` }],
  }));

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <Blob color={c.blobPink} size={170} top={-40} left={-60} delay={0} />
      <Blob color={c.blobMint} size={130} top={height * 0.3} left={width - 80} delay={400} />
      <Blob color={c.blobSun} size={110} top={height * 0.62} left={-40} delay={800} />
      <Blob color={c.blobLilac} size={90} top={90} left={width - 120} delay={1200} />

      <View style={[styles.content, { paddingTop: topPad + 6, paddingBottom: bottomPad + 18, width: w }]}>
        <View style={styles.topRow}>
          <View style={[styles.starChip, { backgroundColor: c.paper, borderColor: c.ink }]}>
            <MaterialCommunityIcons name="star" size={20} color={c.gold} />
            <Text style={[styles.starText, { color: c.ink }]}>{totalStars}</Text>
          </View>
          <CoinChip />
        </View>

        <Animated.View style={[styles.titleWrap, titleStyle]}>
          <Text style={[styles.title, { color: c.ink }]}>
            <Text style={{ color: c.primary }}>Color</Text> <Text style={{ color: c.accent }}>Joy</Text>
          </Text>
          <Text style={[styles.tagline, { color: c.mutedForeground }]}>Tap, color, relax</Text>
        </Animated.View>

        <View style={styles.heroArea}>
          <Animated.View
            style={[
              styles.heroCard,
              { backgroundColor: c.paper, borderColor: c.ink, shadowColor: c.ink },
              heroStyle,
            ]}
          >
            <TargetArt image={HERO_IMAGE} size={heroSize} strokeWidth={5} />
          </Animated.View>
          <View style={[styles.brush, { backgroundColor: c.sun, borderColor: c.ink }]}>
            <MaterialCommunityIcons name="brush" size={30} color={c.ink} />
          </View>
        </View>

        <View style={styles.buttons}>
          <BigButton
            testID="play"
            label="Play"
            sub={allDone ? 'All levels done — replay any' : `Level ${levelIdx + 1}`}
            icon="play"
            color={c.primary}
            textColor="#FFFFFF"
            onPress={() => router.push('/levels')}
          />
          <BigButton
            testID="free-coloring"
            label="Free Coloring"
            sub="Any color, any picture"
            icon="palette"
            color={c.sun}
            textColor={c.ink}
            onPress={() => router.push('/gallery')}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', overflow: 'hidden' },
  blob: { position: 'absolute', opacity: 0.9 },
  content: { flex: 1, paddingHorizontal: 20 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  starChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 2,
  },
  starText: { fontFamily: fonts.black, fontSize: 17 },
  titleWrap: { alignItems: 'center', marginTop: 18 },
  title: { fontFamily: fonts.black, fontSize: 52, letterSpacing: -1 },
  tagline: { fontFamily: fonts.extrabold, fontSize: 16, marginTop: -4 },
  heroArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroCard: {
    padding: 10,
    borderRadius: 28,
    borderWidth: 3,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  brush: {
    position: 'absolute',
    right: '14%',
    bottom: '12%',
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '12deg' }],
  },
  buttons: { gap: 14 },
  bigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    height: 82,
    paddingHorizontal: 16,
    borderRadius: 26,
    borderWidth: 3,
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  bigIcon: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  bigLabel: { fontFamily: fonts.black, fontSize: 24 },
  bigSub: { fontFamily: fonts.bold, fontSize: 14, opacity: 0.9 },
});

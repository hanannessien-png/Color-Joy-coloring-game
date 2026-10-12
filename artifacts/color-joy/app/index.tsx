import React, { useEffect, useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
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
import { CoinChip } from '@/src/components/CoinChip';
import { LEVELS } from '@/src/data/levels';
import { currentLevelIndex, totalStars, useGameStore } from '@/src/store/gameStore';
import { seededRandom } from '@/src/utils/color';

const hero = require('@/assets/images/hero-pencils.png');

/** A tiny twinkling star in the backdrop. */
function Sparkle({ x, y, size, delay }: { x: number; y: number; size: number; delay: number }) {
  const c = useColors();
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
  }, [t, delay]);
  const style = useAnimatedStyle(() => ({
    opacity: 0.25 + 0.75 * t.value,
    transform: [{ scale: 0.6 + 0.4 * t.value }],
  }));
  return (
    <Animated.View pointerEvents="none" style={[styles.sparkle, { left: x, top: y }, style]}>
      <MaterialCommunityIcons name="star-four-points" size={size} color={c.goldSoft} />
    </Animated.View>
  );
}

function MenuButton({
  label,
  sub,
  icon,
  gradient,
  textColor,
  onPress,
  testID,
  big,
}: {
  label: string;
  sub?: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  gradient: [string, string];
  textColor: string;
  onPress: () => void;
  testID: string;
  big?: boolean;
}) {
  const c = useColors();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [
        styles.menuShadow,
        {
          backgroundColor: c.ink,
          transform: [{ translateY: pressed ? 4 : 0 }],
          marginBottom: pressed ? 0 : 4,
        },
      ]}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.menuBtn, { height: big ? 84 : 66, borderColor: c.ink }]}
      >
        <View style={[styles.menuShine, { backgroundColor: c.paper }]} />
        <View style={[styles.menuIcon, { width: big ? 52 : 42, height: big ? 52 : 42, backgroundColor: c.glass }]}>
          <MaterialCommunityIcons name={icon} size={big ? 32 : 24} color={textColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.menuLabel, { color: textColor, fontSize: big ? 28 : 20 }]}>{label}</Text>
          {sub ? <Text style={[styles.menuSub, { color: textColor }]}>{sub}</Text> : null}
        </View>
        <MaterialCommunityIcons name="chevron-right" size={big ? 32 : 26} color={textColor} />
      </LinearGradient>
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
  const starCount = totalStars(stars);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const w = Math.min(width, 520);
  const heroSize = Math.min(w * 0.82, height * 0.36, 360);

  const sparkles = useMemo(() => {
    const rand = seededRandom(11);
    return Array.from({ length: 14 }, (_, i) => ({
      key: i,
      x: rand() * width,
      y: rand() * height * 0.6,
      size: 8 + rand() * 12,
      delay: rand() * 1600,
    }));
  }, [width, height]);

  // Entrance: logo drops in; the pencil box floats gently.
  const drop = useSharedValue(0);
  const bob = useSharedValue(0);
  useEffect(() => {
    drop.value = withSpring(1, { damping: 11, stiffness: 120 });
    bob.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );
  }, [drop, bob]);
  const titleStyle = useAnimatedStyle(() => ({
    opacity: drop.value,
    transform: [{ translateY: (1 - drop.value) * -40 }, { scale: 0.85 + 0.15 * drop.value }],
  }));
  const heroStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -10 * bob.value }, { rotate: `${-2 + 4 * bob.value}deg` }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + 0.25 * bob.value,
    transform: [{ scale: 0.95 + 0.1 * bob.value }],
  }));

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[c.plum, c.plumSoft, c.plum]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      {sparkles.map(({ key, ...s }) => (
        <Sparkle key={key} {...s} />
      ))}

      <View style={[styles.content, { paddingTop: topPad + 8, paddingBottom: bottomPad + 16, width: w }]}>
        <View style={styles.topRow}>
          <View testID="star-total" style={[styles.chip, { backgroundColor: c.paper, borderColor: c.ink }]}>
            <MaterialCommunityIcons name="star" size={22} color={c.gold} />
            <Text style={[styles.chipText, { color: c.ink }]}>{starCount}</Text>
          </View>
          <View style={styles.topRight}>
            <Pressable
              testID="title-store"
              accessibilityLabel="Shop"
              onPress={() => router.push('/store')}
              style={({ pressed }) => [
                styles.chip,
                { backgroundColor: c.gold, borderColor: c.ink, transform: [{ scale: pressed ? 0.94 : 1 }] },
              ]}
            >
              <MaterialCommunityIcons name="storefront" size={20} color={c.ink} />
              <Text style={[styles.chipText, { color: c.ink }]}>Shop</Text>
            </Pressable>
            <CoinChip />
          </View>
        </View>

        <Animated.View style={[styles.titleWrap, titleStyle]}>
          <Text style={[styles.title, styles.titleShadow, { color: c.ink }]}>Color Joy</Text>
          <Text style={[styles.title, styles.titleFront, { color: c.goldSoft }]}>Color Joy</Text>
          <Text style={[styles.tagline, { color: c.goldSoft }]}>Match the colors, fill the joy</Text>
        </Animated.View>

        <View style={styles.heroArea}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.glow,
              { width: heroSize, height: heroSize, borderRadius: heroSize / 2, backgroundColor: c.violet },
              glowStyle,
            ]}
          />
          <Animated.View style={heroStyle}>
            <Image
              source={hero}
              style={{ width: heroSize, height: heroSize }}
              contentFit="contain"
              accessibilityLabel="A box of colored pencils"
            />
          </Animated.View>
        </View>

        <View style={styles.buttons}>
          <MenuButton
            testID="play"
            big
            label="Play"
            sub={allDone ? 'All levels done · replay any' : `Level ${levelIdx + 1}`}
            icon="play"
            gradient={[c.primary, c.goldDeep]}
            textColor={c.paper}
            onPress={() => router.push('/levels')}
          />
          <MenuButton
            testID="free-coloring"
            label="Free Coloring"
            sub="Any color, any picture"
            icon="palette"
            gradient={[c.goldSoft, c.gold]}
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
  sparkle: { position: 'absolute' },
  content: { flex: 1, paddingHorizontal: 18 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topRight: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 2,
  },
  chipText: { fontFamily: fonts.black, fontSize: 16 },
  titleWrap: { alignItems: 'center', marginTop: 18 },
  title: { fontFamily: fonts.black, fontSize: 56, letterSpacing: -1 },
  titleShadow: { position: 'absolute', top: 5 },
  titleFront: {
    textShadowColor: 'rgba(255,184,0,0.55)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  tagline: { fontFamily: fonts.extrabold, fontSize: 16, marginTop: -4, opacity: 0.9 },
  heroArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute' },
  buttons: { gap: 12 },
  menuShadow: { borderRadius: 28 },
  menuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    borderRadius: 28,
    borderWidth: 3,
    overflow: 'hidden',
  },
  menuShine: {
    position: 'absolute',
    top: 4,
    left: 18,
    right: 18,
    height: 10,
    borderRadius: 5,
    opacity: 0.35,
  },
  menuIcon: { borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { fontFamily: fonts.black },
  menuSub: { fontFamily: fonts.bold, fontSize: 14, opacity: 0.92 },
});

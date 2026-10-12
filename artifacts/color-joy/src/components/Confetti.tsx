import React, { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { useColors } from '@/hooks/useColors';
import { seededRandom } from '@/src/utils/color';

function Piece({
  x,
  color,
  delay,
  drift,
  spin,
  w,
  h,
  fall,
}: {
  x: number;
  color: string;
  delay: number;
  drift: number;
  spin: number;
  w: number;
  h: number;
  fall: number;
}) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(delay, withTiming(1, { duration: 2600, easing: Easing.out(Easing.quad) }));
  }, [t, delay]);
  const style = useAnimatedStyle(() => ({
    opacity: t.value < 0.85 ? 1 : (1 - t.value) / 0.15,
    transform: [
      { translateY: -40 + fall * t.value },
      { translateX: drift * Math.sin(t.value * 6) },
      { rotate: `${spin * t.value}deg` },
    ],
  }));
  return (
    <Animated.View
      style={[styles.piece, { left: x, width: w, height: h, backgroundColor: color }, style]}
    />
  );
}

/** One burst of falling paper confetti. */
export function Confetti({ count = 36 }: { count?: number }) {
  const c = useColors();
  const { width, height } = useWindowDimensions();
  const pieces = useMemo(() => {
    const rand = seededRandom(7);
    const palette = [c.primary, c.sun, c.accent, c.violet, c.sky, c.leaf, c.gold];
    return Array.from({ length: count }, (_, i) => ({
      key: i,
      x: rand() * width,
      color: palette[i % palette.length],
      delay: rand() * 500,
      drift: 10 + rand() * 30,
      spin: 360 + rand() * 720,
      w: 7 + rand() * 6,
      h: 10 + rand() * 8,
      fall: height * (0.6 + rand() * 0.5),
    }));
  }, [count, width, height, c]);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map(({ key, ...p }) => (
        <Piece key={key} {...p} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: { position: 'absolute', top: 0, borderRadius: 2 },
});

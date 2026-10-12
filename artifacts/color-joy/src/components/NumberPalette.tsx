import React, { memo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useColors } from '@/hooks/useColors';
import { fonts } from '@/constants/fonts';

function isLight(hex: string): boolean {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 170;
}

interface Props {
  palette: string[];
  active: number;
  /** progress[n] = 0..1 share of regions with number n already filled. */
  progress: Record<number, number>;
  onSelect: (n: number) => void;
}

const SIZE = 52;

const NumberSwatch = memo(function NumberSwatch({
  color,
  n,
  active,
  done,
  pct,
  onSelect,
}: {
  color: string;
  n: number;
  active: boolean;
  done: boolean;
  pct: number;
  onSelect: (n: number) => void;
}) {
  const c = useColors();
  const light = isLight(color);
  return (
    <Pressable
      testID={`number-${n}`}
      accessibilityRole="button"
      accessibilityLabel={`Color number ${n}`}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onSelect(n);
      }}
      style={({ pressed }) => [
        styles.wrap,
        {
          borderColor: active ? c.ink : 'transparent',
          opacity: done && !active ? 0.45 : 1,
          transform: [{ scale: pressed ? 0.9 : active ? 1.08 : 1 }],
        },
      ]}
    >
      <View
        style={[
          styles.swatch,
          { backgroundColor: color, borderColor: light ? c.border : 'transparent' },
        ]}
      >
        {done ? (
          <MaterialCommunityIcons name="check-bold" size={22} color={light ? c.ink : '#FFFFFF'} />
        ) : (
          <Text style={[styles.num, { color: light ? c.ink : '#FFFFFF' }]}>{n}</Text>
        )}
      </View>
      <View style={[styles.track, { backgroundColor: c.muted }]}>
        <View style={[styles.fill, { width: `${Math.round(pct * 100)}%`, backgroundColor: c.ink }]} />
      </View>
    </Pressable>
  );
});

/** Level palette: only the picture's colors, each with its number. */
export function NumberPalette({ palette, active, progress, onSelect }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {palette.map((color, i) => {
        const n = i + 1;
        const pct = progress[n] ?? 0;
        return (
          <NumberSwatch
            key={n}
            color={color}
            n={n}
            active={n === active}
            done={pct >= 1}
            pct={pct}
            onSelect={onSelect}
          />
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 14, gap: 6, paddingVertical: 4 },
  wrap: {
    alignItems: 'center',
    gap: 5,
    padding: 3,
    borderWidth: 3,
    borderRadius: 20,
  },
  swatch: {
    width: SIZE,
    height: SIZE,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  num: { fontFamily: fonts.black, fontSize: 20 },
  track: { width: SIZE - 8, height: 5, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
});

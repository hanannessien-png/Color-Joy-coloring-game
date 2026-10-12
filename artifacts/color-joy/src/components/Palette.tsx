import React, { memo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useColors } from '@/hooks/useColors';
import { fonts } from '@/constants/fonts';
import { PALETTE } from '@/src/data/palette';
import { usePaletteStore } from '@/src/store/paletteStore';

const SWATCH = 40;

function isLight(hex: string): boolean {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 170;
}

const Swatch = memo(function Swatch({
  color,
  selected,
  size = SWATCH,
}: {
  color: string;
  selected: boolean;
  size?: number;
}) {
  const c = useColors();
  return (
    <Pressable
      testID={`swatch-${color}`}
      accessibilityRole="button"
      accessibilityLabel={`Color ${color}`}
      onPress={() => {
        usePaletteStore.getState().selectColor(color);
        Haptics.selectionAsync().catch(() => {});
      }}
      style={({ pressed }) => [
        styles.swatchWrap,
        {
          width: size + 8,
          height: size + 8,
          borderRadius: (size + 8) / 2,
          borderColor: selected ? c.ink : 'transparent',
          transform: [{ scale: pressed ? 0.88 : selected ? 1.06 : 1 }],
        },
      ]}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          borderWidth: 2,
          borderColor: isLight(color) ? c.border : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selected ? (
          <MaterialCommunityIcons
            name="check-bold"
            size={size * 0.45}
            color={isLight(color) ? c.ink : '#FFFFFF'}
          />
        ) : null}
      </View>
    </Pressable>
  );
});

export function Palette() {
  const c = useColors();
  const color = usePaletteStore((s) => s.color);
  const recent = usePaletteStore((s) => s.recent);
  const selected = color.toLowerCase();

  const columns: string[][] = [];
  for (let i = 0; i < PALETTE.length; i += 3) columns.push(PALETTE.slice(i, i + 3));

  return (
    <View style={styles.wrap}>
      <View style={styles.recentRow}>
        <View style={[styles.current, { backgroundColor: color, borderColor: c.ink }]} />
        <Text style={[styles.label, { color: c.mutedForeground }]}>Recent</Text>
        {recent.length === 0 ? (
          <Text style={[styles.hint, { color: c.mutedForeground }]}>
            Colors you use show up here
          </Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentList}>
            {recent.map((rc) => (
              <Swatch key={`r-${rc}`} color={rc} size={30} selected={rc.toLowerCase() === selected} />
            ))}
          </ScrollView>
        )}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.grid}>
        {columns.map((col, i) => (
          <View key={i} style={styles.column}>
            {col.map((pc) => (
              <Swatch key={pc} color={pc} selected={pc.toLowerCase() === selected} />
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    minHeight: 40,
  },
  current: { width: 30, height: 30, borderRadius: 10, borderWidth: 2.5 },
  label: { fontFamily: fonts.extrabold, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.6 },
  hint: { fontFamily: fonts.semibold, fontSize: 13 },
  recentList: { gap: 2, alignItems: 'center' },
  grid: { paddingHorizontal: 12, gap: 2 },
  column: { gap: 2 },
  swatchWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
});

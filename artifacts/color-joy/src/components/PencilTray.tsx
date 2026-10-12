import React, { memo, useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useColors } from '@/hooks/useColors';
import { Pencil } from '@/src/components/Pencil';
import type { SkinId } from '@/src/data/shop';
import { useGameStore } from '@/src/store/gameStore';
import { sameColor } from '@/src/utils/color';

const LIP_H = 26;

/** Tray geometry for a pencil width; pencils are taller than the tray and sink into it. */
function trayMetrics(pencilW: number) {
  return { itemW: pencilW + 8, raise: Math.round(pencilW * 0.53), trayH: Math.round(pencilW * 3.3) };
}

const PencilItem = memo(function PencilItem({
  color,
  index,
  skin,
  selected,
  done,
  onSelect,
  pencilW,
}: {
  color: string;
  index: number;
  skin: SkinId;
  selected: boolean;
  done: boolean;
  onSelect: (color: string) => void;
  pencilW: number;
}) {
  const { itemW, raise } = trayMetrics(pencilW);
  const c = useColors();
  const lift = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    lift.value = withSpring(selected ? 1 : 0, { damping: 13, stiffness: 220 });
  }, [selected, lift]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: -raise * lift.value }, { rotate: `${-4 * lift.value}deg` }],
  }));
  const hex = color.replace('#', '').toLowerCase();
  return (
    <Pressable
      testID={`pencil-${hex}`}
      accessibilityRole="button"
      accessibilityLabel={`Pencil ${index + 1}`}
      accessibilityState={{ selected }}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onSelect(color);
      }}
      style={[styles.item, { width: itemW }]}
    >
      <Animated.View style={[styles.pencil, style, done && !selected ? styles.done : null]}>
        <Pencil color={color} skin={skin} width={pencilW} />
        {done ? (
          <View style={[styles.check, { top: pencilW * 1.2, backgroundColor: c.leaf, borderColor: c.ink }]}>
            <MaterialCommunityIcons name="check-bold" size={12} color={c.paper} />
          </View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
});

interface Props {
  colors: string[];
  selected: string | null;
  onSelect: (color: string) => void;
  /** Colors already used up (level mode). */
  done?: Set<string>;
  /** Pencil width in px; bigger on tall screens. */
  pencilWidth?: number;
}

/** A wooden pencil box; the chosen pencil pops up out of the box. */
export function PencilTray({ colors, selected, onSelect, done, pencilWidth = 34 }: Props) {
  const { itemW: ITEM_W, raise, trayH } = trayMetrics(pencilWidth);
  const c = useColors();
  const skin = useGameStore((s) => s.skin);
  const scrollRef = useRef<ScrollView>(null);
  const viewW = useRef(0);

  // Keep the chosen pencil in view when it changes from outside (hints).
  const selIndex = selected ? colors.findIndex((x) => sameColor(x, selected)) : -1;
  useEffect(() => {
    if (selIndex < 0 || !viewW.current) return;
    const x = Math.max(0, 12 + selIndex * ITEM_W - viewW.current / 2 + ITEM_W / 2);
    scrollRef.current?.scrollTo({ x, animated: true });
  }, [selIndex, ITEM_W]);

  return (
    <View
      style={[styles.tray, { height: trayH, backgroundColor: c.trayInner, borderColor: c.ink }]}
      onLayout={(e) => {
        viewW.current = e.nativeEvent.layout.width;
      }}
    >
      <View style={[styles.backWall, { backgroundColor: c.tray }]} />
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.row, { paddingTop: raise + 6 }]}
      >
        {colors.map((color, i) => (
          <PencilItem
            key={color}
            color={color}
            index={i}
            skin={skin}
            selected={!!selected && sameColor(color, selected)}
            done={!!done?.has(color.toLowerCase())}
            onSelect={onSelect}
            pencilW={pencilWidth}
          />
        ))}
      </ScrollView>
      <View
        pointerEvents="none"
        style={[styles.lip, { backgroundColor: c.tray, borderColor: c.ink }]}
      >
        <View style={[styles.lipShine, { backgroundColor: c.trayEdge }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tray: {
    marginHorizontal: 8,
    borderRadius: 20,
    borderWidth: 2.5,
    overflow: 'hidden',
  },
  backWall: { position: 'absolute', left: 0, right: 0, top: 0, height: 18 },
  row: { paddingHorizontal: 12, alignItems: 'flex-start' },
  item: { alignItems: 'center' },
  pencil: { alignItems: 'center' },
  done: { opacity: 0.55 },
  check: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lip: {
    position: 'absolute',
    left: -3,
    right: -3,
    bottom: -3,
    height: LIP_H,
    borderTopWidth: 2.5,
  },
  lipShine: { height: 4, marginHorizontal: 14, marginTop: 4, borderRadius: 2, opacity: 0.8 },
});

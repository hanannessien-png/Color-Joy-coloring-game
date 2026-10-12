import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useColors } from '@/hooks/useColors';
import { fonts } from '@/constants/fonts';
import { TOOLS, type ToolId } from '@/src/data/shop';
import { useGameStore } from '@/src/store/gameStore';

interface Props {
  /** Wand / bomb waiting for the player to tap a part. */
  armed: ToolId | null;
  onUse: (id: ToolId) => void;
}

/** Power-ups row. Empty tools open the shop. */
export function ToolBar({ armed, onUse }: Props) {
  const c = useColors();
  const tools = useGameStore((s) => s.tools);
  const tone: Record<ToolId, string> = { hint: c.sun, wand: c.violet, bomb: c.primary };
  const short: Record<ToolId, string> = { hint: 'Hint', wand: 'Wand', bomb: 'Bomb' };

  return (
    <View style={styles.row}>
      {TOOLS.map((t) => {
        const count = tools[t.id] ?? 0;
        const active = armed === t.id;
        return (
          <Pressable
            key={t.id}
            testID={`tool-${t.id}`}
            accessibilityRole="button"
            accessibilityLabel={`${t.name}, ${count} left`}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              if (count <= 0 && !active) {
                router.push('/store');
                return;
              }
              onUse(t.id);
            }}
            style={({ pressed }) => [
              styles.btn,
              {
                backgroundColor: active ? tone[t.id] : c.paper,
                borderColor: c.ink,
                shadowColor: c.ink,
                transform: [{ translateY: pressed ? 2 : 0 }, { scale: active ? 1.06 : 1 }],
              },
            ]}
          >
            <View style={[styles.icon, { backgroundColor: tone[t.id] }]}>
              <MaterialCommunityIcons
                name={t.icon}
                size={20}
                color={t.id === 'hint' ? c.ink : c.paper}
              />
            </View>
            <Text style={[styles.label, { color: active && t.id !== 'hint' ? c.paper : c.ink }]} numberOfLines={1}>
              {active ? 'Tap!' : short[t.id]}
            </Text>
            <View
              style={[
                styles.badge,
                { backgroundColor: count > 0 ? c.ink : c.leaf, borderColor: c.paper },
              ]}
            >
              {count > 0 ? (
                <Text style={[styles.badgeText, { color: c.paper }]}>{count}</Text>
              ) : (
                <MaterialCommunityIcons name="plus" size={13} color={c.paper} />
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, paddingHorizontal: 10 },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingLeft: 4,
    paddingRight: 8,
    borderRadius: 22,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  icon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, fontFamily: fonts.black, fontSize: 14 },
  badge: {
    position: 'absolute',
    top: -8,
    right: -4,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 5,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: fonts.black, fontSize: 12 },
});

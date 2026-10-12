import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useColors } from '@/hooks/useColors';
import { fonts } from '@/constants/fonts';
import { CATEGORIES } from '@/src/data/categories';
import type { CategoryId } from '@/src/types';

export type CategoryFilter = CategoryId | 'all';

interface Props {
  value: CategoryFilter;
  onChange: (v: CategoryFilter) => void;
}

export function CategoryTabs({ value, onChange }: Props) {
  const c = useColors();
  const items: { id: CategoryFilter; label: string; icon: string; color: string }[] = [
    { id: 'all', label: 'All', icon: 'palette', color: c.primary },
    ...CATEGORIES,
  ];
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {items.map((it) => {
        const active = it.id === value;
        return (
          <Pressable
            key={it.id}
            testID={`category-${it.id}`}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              onChange(it.id);
            }}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: active ? it.color : c.paper,
                borderColor: active ? c.ink : c.border,
                shadowColor: active ? c.ink : c.shadow,
                transform: [{ scale: pressed ? 0.94 : 1 }],
              },
            ]}
          >
            <MaterialCommunityIcons
              name={it.icon as keyof typeof MaterialCommunityIcons.glyphMap}
              size={20}
              color={active ? '#FFFFFF' : it.color}
            />
            <Text style={[styles.text, { color: active ? '#FFFFFF' : c.ink }]}>{it.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 16, gap: 10, paddingVertical: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 0,
    elevation: 2,
  },
  text: { fontFamily: fonts.extrabold, fontSize: 15 },
});

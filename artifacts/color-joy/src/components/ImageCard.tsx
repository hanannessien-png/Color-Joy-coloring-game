import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useColors } from '@/hooks/useColors';
import { fonts } from '@/constants/fonts';
import { ArtSvg } from '@/src/components/ArtSvg';
import { CATEGORY_BY_ID } from '@/src/data/categories';
import type { ColoringImage, Difficulty } from '@/src/types';

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

interface Props {
  image: ColoringImage;
  width: number;
}

export const ImageCard = memo(function ImageCard({ image, width }: Props) {
  const c = useColors();
  const cat = CATEGORY_BY_ID[image.category];
  const diffColor =
    image.difficulty === 'easy' ? c.leaf : image.difficulty === 'medium' ? c.sun : c.primary;
  const thumb = width - 20;

  return (
    <Pressable
      testID={`image-${image.id}`}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        router.push({ pathname: '/color/[id]', params: { id: image.id } });
      }}
      style={({ pressed }) => [
        styles.card,
        {
          width,
          backgroundColor: c.card,
          borderColor: c.border,
          shadowColor: c.shadow,
          transform: [{ scale: pressed ? 0.96 : 1 }, { rotate: pressed ? '-1deg' : '0deg' }],
        },
      ]}
    >
      <View style={[styles.thumb, { borderColor: c.border, width: thumb, height: thumb }]}>
        <ArtSvg image={image} size={thumb - 4} strokeWidth={5} />
      </View>
      <Text style={[styles.title, { color: c.ink }]} numberOfLines={1}>
        {image.title}
      </Text>
      <View style={styles.metaRow}>
        <View style={[styles.dot, { backgroundColor: cat.color }]} />
        <Text style={[styles.meta, { color: c.mutedForeground }]} numberOfLines={1}>
          {cat.label}
        </Text>
        <View style={[styles.pill, { backgroundColor: diffColor }]}>
          <Text style={styles.pillText}>{DIFFICULTY_LABEL[image.difficulty]}</Text>
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 2,
    padding: 10,
    gap: 8,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.28,
    shadowRadius: 0,
    elevation: 3,
  },
  thumb: {
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  title: { fontFamily: fonts.extrabold, fontSize: 16, paddingHorizontal: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  meta: { flex: 1, fontFamily: fonts.bold, fontSize: 12 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  pillText: { fontFamily: fonts.extrabold, fontSize: 11, color: '#FFFFFF' },
});

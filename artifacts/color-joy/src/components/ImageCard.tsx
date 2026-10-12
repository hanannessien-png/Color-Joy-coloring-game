import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { fonts } from '@/constants/fonts';
import { ArtSvg } from '@/src/components/ArtSvg';
import { CATEGORY_BY_ID } from '@/src/data/categories';
import { PICTURE_PRICE } from '@/src/data/shop';
import { isPictureLocked, useGameStore } from '@/src/store/gameStore';
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
  const locked = useGameStore((s) => isPictureLocked(image.id, s.unlocked));

  return (
    <Pressable
      testID={`image-${image.id}`}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        if (locked) router.push('/store');
        else router.push({ pathname: '/color/[id]', params: { id: image.id } });
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
        {locked ? (
          <View testID={`locked-${image.id}`} style={[styles.lock, { backgroundColor: c.scrim }]}>
            <View style={[styles.lockBadge, { backgroundColor: c.gold, borderColor: c.ink }]}>
              <MaterialCommunityIcons name="lock" size={22} color={c.ink} />
            </View>
            <View style={[styles.lockPrice, { backgroundColor: c.paper }]}>
              <Text style={[styles.lockPriceText, { color: c.ink }]}>{PICTURE_PRICE} coins</Text>
            </View>
          </View>
        ) : null}
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
  lock: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', gap: 8 },
  lockBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockPrice: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  lockPriceText: { fontFamily: fonts.black, fontSize: 12 },
  title: { fontFamily: fonts.extrabold, fontSize: 16, paddingHorizontal: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  meta: { flex: 1, fontFamily: fonts.bold, fontSize: 12 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  pillText: { fontFamily: fonts.extrabold, fontSize: 11, color: '#FFFFFF' },
});

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { fonts } from '@/constants/fonts';
import { useGameStore } from '@/src/store/gameStore';

export function CoinChip() {
  const c = useColors();
  const coins = useGameStore((s) => s.coins);
  return (
    <View
      testID="coins"
      style={[styles.chip, { backgroundColor: c.paper, borderColor: c.ink, shadowColor: c.ink }]}
    >
      <View style={[styles.coin, { backgroundColor: c.gold, borderColor: c.ink }]}>
        <MaterialCommunityIcons name="star-four-points" size={12} color={c.ink} />
      </View>
      <Text style={[styles.text, { color: c.ink }]}>{coins}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingLeft: 6,
    paddingRight: 14,
    borderRadius: 20,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  coin: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontFamily: fonts.black, fontSize: 17 },
});

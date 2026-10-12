import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { fonts } from '@/constants/fonts';
import { ArtSvg } from '@/src/components/ArtSvg';
import { Confetti } from '@/src/components/Confetti';
import type { ColoringImage } from '@/src/types';

interface Props {
  image: ColoringImage;
  /** Which saved coloring to preview (the player's own work). */
  artKey: string;
  /** Rewarded ad that doubles the coins; omit to hide the offer. */
  onDoubleCoins?: () => Promise<boolean>;
  /** False while no rewarded ad is loaded yet. */
  doubleReady?: boolean;
  /** Level results; omit for free coloring. */
  stars?: number;
  coinsEarned?: number;
  mistakes?: number;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel: string;
  onSecondary: () => void;
}

function Star({ index, earned }: { index: number; earned: boolean }) {
  const c = useColors();
  const s = useSharedValue(0);
  useEffect(() => {
    s.value = withDelay(250 + index * 220, withSpring(1, { damping: 9, stiffness: 160 }));
  }, [s, index]);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: s.value }, { rotate: `${(1 - s.value) * -40}deg` }],
    opacity: s.value,
  }));
  return (
    <Animated.View style={[index === 1 && styles.midStar, style]}>
      <MaterialCommunityIcons
        name="star"
        size={index === 1 ? 64 : 52}
        color={earned ? c.gold : c.locked}
        style={styles.starIcon}
      />
    </Animated.View>
  );
}

export function CompletionOverlay({
  image,
  artKey,
  onDoubleCoins,
  doubleReady = true,
  stars,
  coinsEarned = 0,
  mistakes,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: Props) {
  const c = useColors();
  const fade = useSharedValue(0);
  const pop = useSharedValue(0.8);
  useEffect(() => {
    fade.value = withTiming(1, { duration: 200 });
    pop.value = withSpring(1, { damping: 13 });
  }, [fade, pop]);
  const bgStyle = useAnimatedStyle(() => ({ opacity: fade.value }));
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  const isLevel = stars !== undefined;
  const [bonus, setBonus] = useState<'idle' | 'busy' | 'done' | 'failed'>('idle');
  const watchAd = async () => {
    if (!onDoubleCoins || bonus === 'busy' || bonus === 'done') return;
    setBonus('busy');
    const ok = await onDoubleCoins();
    setBonus(ok ? 'done' : 'failed');
  };
  const showBonus = isLevel && !!onDoubleCoins && coinsEarned > 0;

  return (
    <Animated.View style={[styles.overlay, { backgroundColor: c.scrim }, bgStyle]}>
      <Confetti />
      <Animated.View
        style={[styles.card, { backgroundColor: c.paper, borderColor: c.ink }, cardStyle]}
      >
        {isLevel ? (
          <View style={styles.starsRow}>
            {[0, 1, 2].map((i) => (
              <Star key={i} index={i} earned={i < (stars ?? 0)} />
            ))}
          </View>
        ) : (
          <View style={[styles.badge, { backgroundColor: c.sun, borderColor: c.ink }]}>
            <MaterialCommunityIcons name="star-four-points" size={40} color={c.ink} />
          </View>
        )}
        <Text style={[styles.title, { color: c.ink }]}>
          {isLevel ? (stars === 3 ? 'Perfect!' : 'Level complete!') : 'Masterpiece!'}
        </Text>
        <View style={[styles.preview, { borderColor: c.border, backgroundColor: c.paper }]}>
          <ArtSvg image={image} artKey={artKey} size={150} strokeWidth={5.5} />
        </View>
        {isLevel ? (
          <View style={styles.statsRow}>
            <View style={[styles.stat, { backgroundColor: c.muted }]}>
              <MaterialCommunityIcons name="heart" size={18} color={c.heart} />
              <Text style={[styles.statText, { color: c.ink }]}>
                {mistakes ? `${mistakes} ${mistakes === 1 ? 'mistake' : 'mistakes'}` : 'No mistakes'}
              </Text>
            </View>
            <View style={[styles.stat, { backgroundColor: c.secondary }]}>
              <View style={[styles.coin, { backgroundColor: c.gold, borderColor: c.ink }]} />
              <Text style={[styles.statText, { color: c.ink }]}>
                +{bonus === 'done' ? coinsEarned * 2 : coinsEarned}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={[styles.sub, { color: c.mutedForeground }]}>
            You colored every part of {image.title}.
          </Text>
        )}
        {showBonus ? (
          <Pressable
            testID="double-coins"
            disabled={bonus === 'busy' || bonus === 'done' || (!doubleReady && bonus !== 'failed')}
            onPress={watchAd}
            style={({ pressed }) => [
              styles.bonusBtn,
              {
                backgroundColor: bonus === 'done' ? c.muted : c.sun,
                borderColor: c.ink,
                opacity: !doubleReady && bonus === 'idle' ? 0.6 : 1,
                transform: [{ translateY: pressed ? 2 : 0 }],
              },
            ]}
          >
            {bonus === 'busy' ? (
              <ActivityIndicator color={c.ink} />
            ) : (
              <>
                <MaterialCommunityIcons
                  name={bonus === 'done' ? 'check-bold' : 'play-box-multiple-outline'}
                  size={20}
                  color={c.ink}
                />
                <Text style={[styles.bonusText, { color: c.ink }]}>
                  {bonus === 'done'
                    ? 'Coins doubled!'
                    : bonus === 'failed'
                      ? 'Ad not available — try again'
                      : doubleReady
                        ? `Watch an ad · x2 coins`
                        : 'Ad loading…'}
                </Text>
              </>
            )}
          </Pressable>
        ) : null}
        <Pressable
          testID="done-primary"
          onPress={onPrimary}
          style={({ pressed }) => [
            styles.primaryBtn,
            {
              backgroundColor: c.primary,
              borderColor: c.ink,
              shadowColor: c.ink,
              transform: [{ translateY: pressed ? 3 : 0 }],
            },
          ]}
        >
          <Text style={styles.primaryText}>{primaryLabel}</Text>
        </Pressable>
        <Pressable testID="done-secondary" onPress={onSecondary} hitSlop={8}>
          <Text style={[styles.link, { color: c.ink }]}>{secondaryLabel}</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 30,
    borderWidth: 3,
    paddingHorizontal: 22,
    paddingBottom: 18,
    paddingTop: 10,
    alignItems: 'center',
    gap: 10,
  },
  starsRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: -46, gap: 2 },
  midStar: { marginBottom: 14 },
  starIcon: {
    textShadowColor: 'rgba(46,42,59,0.9)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 0,
  },
  badge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -50,
  },
  title: { fontFamily: fonts.black, fontSize: 28 },
  preview: { borderWidth: 2, borderRadius: 18, overflow: 'hidden' },
  statsRow: { flexDirection: 'row', gap: 8 },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 17,
  },
  statText: { fontFamily: fonts.extrabold, fontSize: 14 },
  coin: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
  sub: { fontFamily: fonts.bold, fontSize: 15, textAlign: 'center' },
  primaryBtn: {
    marginTop: 6,
    height: 56,
    borderRadius: 28,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  primaryText: { fontFamily: fonts.black, fontSize: 18, color: '#FFFFFF' },
  bonusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'stretch',
    height: 48,
    borderRadius: 24,
    borderWidth: 2.5,
    marginTop: 4,
  },
  bonusText: { fontFamily: fonts.extrabold, fontSize: 15 },
  link: { fontFamily: fonts.extrabold, fontSize: 15, paddingVertical: 6 },
});

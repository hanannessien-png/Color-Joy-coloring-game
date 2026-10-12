import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { fonts } from '@/constants/fonts';

interface Props {
  /** Rewarded ad for one heart back; omit when not offered. */
  onRevive?: () => Promise<boolean>;
  onRetry: () => void;
  onLeave: () => void;
}

/** Shown when a level runs out of hearts. */
export function FailOverlay({ onRevive, onRetry, onLeave }: Props) {
  const c = useColors();
  const fade = useSharedValue(0);
  const pop = useSharedValue(0.8);
  const wobble = useSharedValue(0);
  useEffect(() => {
    fade.value = withTiming(1, { duration: 200 });
    pop.value = withSpring(1, { damping: 12 });
    wobble.value = withSequence(
      withTiming(-12, { duration: 90 }),
      withTiming(12, { duration: 90 }),
      withTiming(-6, { duration: 90 }),
      withTiming(0, { duration: 90 }),
    );
  }, [fade, pop, wobble]);
  const bg = useAnimatedStyle(() => ({ opacity: fade.value }));
  const card = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  const heart = useAnimatedStyle(() => ({ transform: [{ rotate: `${wobble.value}deg` }] }));
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const revive = async () => {
    if (!onRevive || busy) return;
    setBusy(true);
    const ok = await onRevive();
    setBusy(false);
    if (!ok) setFailed(true);
  };

  return (
    <Animated.View testID="fail-overlay" style={[styles.overlay, { backgroundColor: c.scrim }, bg]}>
      <Animated.View style={[styles.card, { backgroundColor: c.paper, borderColor: c.ink }, card]}>
        <Animated.View style={[styles.badge, { backgroundColor: c.heart, borderColor: c.ink }, heart]}>
          <MaterialCommunityIcons name="heart-broken" size={44} color={c.paper} />
        </Animated.View>
        <Text style={[styles.title, { color: c.ink }]}>Out of hearts</Text>
        <Text style={[styles.sub, { color: c.mutedForeground }]}>
          Look closely at the finished picture and match each pencil.
        </Text>
        {onRevive ? (
          <Pressable
            testID="revive"
            onPress={revive}
            disabled={busy}
            style={({ pressed }) => [
              styles.btn,
              {
                backgroundColor: c.leaf,
                borderColor: c.ink,
                shadowColor: c.ink,
                transform: [{ translateY: pressed ? 3 : 0 }],
              },
            ]}
          >
            {busy ? (
              <ActivityIndicator color={c.paper} />
            ) : (
              <>
                <MaterialCommunityIcons name="play-circle" size={22} color={c.paper} />
                <Text style={[styles.btnText, { color: c.paper }]}>Watch a video · +1</Text>
                <MaterialCommunityIcons name="heart" size={20} color={c.paper} />
              </>
            )}
          </Pressable>
        ) : null}
        {failed ? (
          <Text style={[styles.note, { color: c.mutedForeground }]}>No video right now. Try again later.</Text>
        ) : null}
        <Pressable
          testID="retry"
          onPress={onRetry}
          style={({ pressed }) => [
            styles.btn,
            {
              backgroundColor: c.primary,
              borderColor: c.ink,
              shadowColor: c.ink,
              transform: [{ translateY: pressed ? 3 : 0 }],
            },
          ]}
        >
          <MaterialCommunityIcons name="restart" size={22} color={c.paper} />
          <Text style={[styles.btnText, { color: c.paper }]}>Start again</Text>
        </Pressable>
        <Pressable testID="fail-leave" onPress={onLeave} hitSlop={8}>
          <Text style={[styles.link, { color: c.ink }]}>Levels map</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
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
    paddingBottom: 16,
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -42,
  },
  title: { fontFamily: fonts.black, fontSize: 28 },
  sub: { fontFamily: fonts.bold, fontSize: 15, textAlign: 'center' },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'stretch',
    height: 54,
    borderRadius: 27,
    borderWidth: 2.5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  btnText: { fontFamily: fonts.black, fontSize: 17 },
  note: { fontFamily: fonts.bold, fontSize: 13 },
  link: { fontFamily: fonts.extrabold, fontSize: 15, paddingVertical: 6 },
});

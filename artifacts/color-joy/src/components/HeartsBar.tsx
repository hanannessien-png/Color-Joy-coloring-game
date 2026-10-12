import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { MAX_HEARTS } from '@/src/data/levels';

function Heart({ full }: { full: boolean }) {
  const c = useColors();
  const s = useSharedValue(1);
  const prev = useRef(full);
  useEffect(() => {
    if (prev.current !== full) {
      s.value = withSequence(withTiming(1.5, { duration: 120 }), withSpring(1, { damping: 6 }));
      prev.current = full;
    }
  }, [full, s]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Animated.View style={style}>
      <MaterialCommunityIcons
        name={full ? 'heart' : 'heart-broken'}
        size={26}
        color={full ? c.heart : c.locked}
        style={full ? styles.shadow : undefined}
      />
    </Animated.View>
  );
}

export function HeartsBar({ hearts }: { hearts: number }) {
  const c = useColors();
  const count = Math.max(MAX_HEARTS, hearts);
  return (
    <View
      testID="hearts"
      accessibilityLabel={`${hearts} hearts left`}
      style={[styles.bar, { backgroundColor: c.paper, borderColor: c.ink }]}
    >
      {Array.from({ length: count }, (_, i) => (
        <Heart key={i} full={i < hearts} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
    height: 40,
    paddingHorizontal: 8,
    borderRadius: 20,
    borderWidth: 2,
  },
  shadow: {
    textShadowColor: 'rgba(46,42,59,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
  },
});

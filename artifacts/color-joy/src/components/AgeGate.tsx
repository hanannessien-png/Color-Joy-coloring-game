import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useColors } from '@/hooks/useColors';
import { fonts } from '@/constants/fonts';

const COLS = 4;
const GAP = 10;

/**
 * First-launch age question. Neutral by design: no default answer and no
 * hint about which answer unlocks anything.
 */
export function AgeGate({ onSubmit }: { onSubmit: (year: number) => void }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const [year, setYear] = useState<number | null>(null);

  const years = useMemo(() => {
    const now = new Date().getFullYear();
    return Array.from({ length: 100 }, (_, i) => now - i);
  }, []);
  const w = Math.min(width, 520);
  const chipW = (w - 40 - GAP * (COLS - 1)) / COLS;

  return (
    <View style={[styles.root, { backgroundColor: c.background, paddingTop: topPad + 16 }]}>
      <View style={[styles.inner, { width: w }]}>
        <View style={[styles.icon, { backgroundColor: c.sun, borderColor: c.ink }]}>
          <MaterialCommunityIcons name="cake-variant" size={34} color={c.ink} />
        </View>
        <Text style={[styles.title, { color: c.ink }]}>Welcome to Color Joy!</Text>
        <Text style={[styles.sub, { color: c.mutedForeground }]}>What year were you born?</Text>

        <FlatList
          testID="age-years"
          data={years}
          keyExtractor={(y) => String(y)}
          numColumns={COLS}
          style={styles.list}
          columnWrapperStyle={{ gap: GAP }}
          contentContainerStyle={{ gap: GAP, paddingHorizontal: 20, paddingBottom: 16 }}
          renderItem={({ item }) => {
            const on = item === year;
            return (
              <Pressable
                testID={`year-${item}`}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setYear(item);
                }}
                style={[
                  styles.chip,
                  {
                    width: chipW,
                    backgroundColor: on ? c.primary : c.paper,
                    borderColor: on ? c.ink : c.border,
                  },
                ]}
              >
                <Text style={[styles.chipText, { color: on ? '#FFFFFF' : c.ink }]}>{item}</Text>
              </Pressable>
            );
          }}
        />

        <View style={[styles.footer, { paddingBottom: bottomPad + 14, borderColor: c.border }]}>
          <Pressable
            testID="age-continue"
            disabled={year === null}
            onPress={() => year !== null && onSubmit(year)}
            style={({ pressed }) => [
              styles.btn,
              {
                backgroundColor: year === null ? c.locked : c.primary,
                borderColor: c.ink,
                transform: [{ translateY: pressed ? 3 : 0 }],
              },
            ]}
          >
            <Text style={styles.btnText}>Continue</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  inner: { flex: 1, alignItems: 'center' },
  icon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: fonts.black, fontSize: 28, marginTop: 12, textAlign: 'center' },
  sub: { fontFamily: fonts.extrabold, fontSize: 17, marginTop: 2, marginBottom: 16 },
  list: { alignSelf: 'stretch', flex: 1 },
  chip: {
    height: 48,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontFamily: fonts.extrabold, fontSize: 17 },
  footer: { alignSelf: 'stretch', paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 2 },
  btn: {
    height: 58,
    borderRadius: 29,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontFamily: fonts.black, fontSize: 19, color: '#FFFFFF' },
});

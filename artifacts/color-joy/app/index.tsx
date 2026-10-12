import React, { useMemo, useState } from 'react';
import { FlatList, Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { fonts } from '@/constants/fonts';
import { CategoryTabs, type CategoryFilter } from '@/src/components/CategoryTabs';
import { ImageCard } from '@/src/components/ImageCard';
import { IMAGES } from '@/src/data/images';

const H_PAD = 16;
const GAP = 14;
const MAX_WIDTH = 720;

export default function HomeScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [filter, setFilter] = useState<CategoryFilter>('all');

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const contentWidth = Math.min(width, MAX_WIDTH);
  const cardWidth = Math.floor((contentWidth - H_PAD * 2 - GAP) / 2);

  const data = useMemo(
    () => (filter === 'all' ? IMAGES : IMAGES.filter((i) => i.category === filter)),
    [filter],
  );

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <FlatList
        data={data}
        keyExtractor={(i) => i.id}
        numColumns={2}
        key="grid-2"
        scrollEnabled={data.length > 0}
        contentContainerStyle={{
          paddingTop: topPad + 8,
          paddingBottom: bottomPad + 24,
          width: contentWidth,
          alignSelf: 'center',
        }}
        columnWrapperStyle={{ gap: GAP, paddingHorizontal: H_PAD }}
        ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <Image
                source={require('@/assets/images/icon.png')}
                style={[styles.logo, { borderColor: c.ink }]}
                contentFit="cover"
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.brand, { color: c.ink }]}>Color Joy</Text>
                <Text style={[styles.tagline, { color: c.mutedForeground }]}>
                  Pick a picture and make it yours
                </Text>
              </View>
            </View>
            <CategoryTabs value={filter} onChange={setFilter} />
            <View style={styles.sectionRow}>
              <Text style={[styles.section, { color: c.ink }]}>
                {filter === 'all' ? 'All pictures' : 'Pictures'}
              </Text>
              <Text style={[styles.count, { color: c.mutedForeground }]}>{data.length}</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="image-off-outline" size={40} color={c.mutedForeground} />
            <Text style={[styles.emptyText, { color: c.mutedForeground }]}>
              No pictures here yet
            </Text>
          </View>
        }
        renderItem={({ item }) => <ImageCard image={item} width={cardWidth} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { gap: 14, marginBottom: 14 },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: H_PAD,
  },
  logo: { width: 56, height: 56, borderRadius: 18, borderWidth: 2.5 },
  brand: { fontFamily: fonts.black, fontSize: 30, letterSpacing: -0.5 },
  tagline: { fontFamily: fonts.bold, fontSize: 14, marginTop: -2 },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    paddingHorizontal: H_PAD,
    marginTop: 4,
  },
  section: { fontFamily: fonts.black, fontSize: 22 },
  count: { fontFamily: fonts.extrabold, fontSize: 16 },
  empty: { alignItems: 'center', gap: 8, paddingTop: 40 },
  emptyText: { fontFamily: fonts.bold, fontSize: 15 },
});

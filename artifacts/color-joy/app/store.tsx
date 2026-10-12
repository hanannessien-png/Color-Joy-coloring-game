import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useColors } from '@/hooks/useColors';
import { fonts } from '@/constants/fonts';
import { rewardedLeftToday, showRewarded, useAdStatus } from '@/src/ads/adManager';
import { AdBanner } from '@/src/ads/AdBanner';
import { TargetArt } from '@/src/components/ArtSvg';
import { CoinChip } from '@/src/components/CoinChip';
import { IconButton } from '@/src/components/IconButton';
import { Pencil } from '@/src/components/Pencil';
import { IMAGE_BY_ID } from '@/src/data/images';
import {
  AD_COINS,
  LOCKED_PICTURES,
  PICTURE_PRICE,
  SKINS,
  TOOLS,
  type SkinItem,
  type ToolItem,
} from '@/src/data/shop';
import { useGameStore } from '@/src/store/gameStore';
import { useSettingsStore } from '@/src/store/settingsStore';

const chest = require('@/assets/images/shop-chest.png');
const SKIN_PREVIEW = ['#FF4D4F', '#FFC93C', '#6BCB3B', '#3FA7F5', '#A66CFF'];

type Toast = { text: string; good: boolean; key: number } | null;

function PriceButton({
  price,
  label,
  onPress,
  testID,
  tone = 'gold',
}: {
  price?: number;
  label?: string;
  onPress: () => void;
  testID: string;
  tone?: 'gold' | 'leaf' | 'muted';
}) {
  const c = useColors();
  const coins = useGameStore((s) => s.coins);
  const short = price !== undefined && coins < price;
  const bg = tone === 'leaf' ? c.leaf : tone === 'muted' ? c.muted : short ? c.muted : c.gold;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.priceBtn,
        {
          backgroundColor: bg,
          borderColor: c.ink,
          shadowColor: c.ink,
          transform: [{ translateY: pressed ? 2 : 0 }],
          shadowOffset: { width: 0, height: pressed ? 1 : 3 },
        },
      ]}
    >
      {price !== undefined ? (
        <>
          <View style={[styles.coinDot, { backgroundColor: c.goldSoft, borderColor: c.ink }]} />
          <Text style={[styles.priceText, { color: short ? c.mutedForeground : c.ink }]}>{price}</Text>
        </>
      ) : (
        <Text style={[styles.priceText, { color: tone === 'leaf' ? c.paper : c.ink }]}>{label}</Text>
      )}
    </Pressable>
  );
}

function SectionTitle({ title, icon }: { title: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }) {
  const c = useColors();
  return (
    <View style={styles.sectionRow}>
      <MaterialCommunityIcons name={icon} size={20} color={c.violet} />
      <Text style={[styles.sectionTitle, { color: c.ink }]}>{title}</Text>
    </View>
  );
}

function FreeCoins({ onToast }: { onToast: (t: string, good: boolean) => void }) {
  const c = useColors();
  const ready = useAdStatus((s) => s.rewardedReady);
  // Re-render when the daily counter changes.
  useSettingsStore((s) => s.ads.rewardedCount);
  const left = rewardedLeftToday();
  const [busy, setBusy] = useState(false);
  const shine = useSharedValue(0);
  useEffect(() => {
    shine.value = withRepeat(
      withSequence(withTiming(1, { duration: 900 }), withTiming(0, { duration: 900 })),
      -1,
    );
  }, [shine]);
  const pulse = useAnimatedStyle(() => ({ transform: [{ scale: 1 + 0.05 * shine.value }] }));

  const watch = async () => {
    if (busy || left <= 0) return;
    setBusy(true);
    const ok = await showRewarded();
    setBusy(false);
    if (ok) {
      useGameStore.getState().addCoins(AD_COINS);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      onToast(`+${AD_COINS} coins!`, true);
    } else {
      onToast('No video right now. Try again later.', false);
    }
  };

  return (
    <LinearGradient
      colors={[c.plumSoft, c.plum]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.freeCard, { borderColor: c.ink }]}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.freeTitle, { color: c.goldSoft }]}>Free coins</Text>
        <Text style={[styles.freeSub, { color: c.paper }]}>Watch a short video, get {AD_COINS} coins</Text>
        <Text style={[styles.freeLeft, { color: c.goldSoft }]}>
          {left > 0 ? `${left} left today` : 'Come back tomorrow'}
        </Text>
      </View>
      <Animated.View style={left > 0 ? pulse : undefined}>
        <Pressable
          testID="watch-ad-coins"
          disabled={busy || left <= 0 || !ready}
          onPress={watch}
          style={({ pressed }) => [
            styles.freeBtn,
            {
              backgroundColor: left > 0 ? c.gold : c.muted,
              borderColor: c.ink,
              opacity: ready || left <= 0 ? 1 : 0.6,
              transform: [{ translateY: pressed ? 2 : 0 }],
            },
          ]}
        >
          {busy ? (
            <ActivityIndicator color={c.ink} />
          ) : (
            <>
              <MaterialCommunityIcons name="play-circle" size={24} color={c.ink} />
              <Text style={[styles.freeBtnText, { color: c.ink }]}>+{AD_COINS}</Text>
            </>
          )}
        </Pressable>
      </Animated.View>
    </LinearGradient>
  );
}

function ToolCard({ item, onToast }: { item: ToolItem; onToast: (t: string, good: boolean) => void }) {
  const c = useColors();
  const owned = useGameStore((s) => s.tools[item.id] ?? 0);
  const tone = item.id === 'hint' ? c.sun : item.id === 'wand' ? c.violet : c.primary;
  const buy = () => {
    if (useGameStore.getState().buyTool(item.id)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      onToast(`${item.name} x${item.pack} added`, true);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      onToast('Not enough coins yet', false);
    }
  };
  return (
    <View style={[styles.row, { backgroundColor: c.paper, borderColor: c.border, shadowColor: c.shadow }]}>
      <View style={[styles.toolIcon, { backgroundColor: tone, borderColor: c.ink }]}>
        <MaterialCommunityIcons name={item.icon} size={28} color={item.id === 'hint' ? c.ink : c.paper} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, { color: c.ink }]}>
          {item.name} <Text style={{ color: c.mutedForeground }}>x{item.pack}</Text>
        </Text>
        <Text style={[styles.rowSub, { color: c.mutedForeground }]}>{item.description}</Text>
        <Text testID={`owned-${item.id}`} style={[styles.owned, { color: c.violet }]}>
          You have {owned}
        </Text>
      </View>
      <PriceButton testID={`buy-${item.id}`} price={item.price} onPress={buy} />
    </View>
  );
}

function SkinCard({ item, onToast }: { item: SkinItem; onToast: (t: string, good: boolean) => void }) {
  const c = useColors();
  const owned = useGameStore((s) => s.ownedSkins.includes(item.id));
  const equipped = useGameStore((s) => s.skin === item.id);
  const press = () => {
    const g = useGameStore.getState();
    if (owned) {
      g.equipSkin(item.id);
      Haptics.selectionAsync().catch(() => {});
      return;
    }
    if (g.buySkin(item.id, item.price)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      onToast(`${item.name} unlocked!`, true);
    } else {
      onToast('Not enough coins yet', false);
    }
  };
  return (
    <View
      style={[
        styles.skinCard,
        {
          backgroundColor: c.paper,
          borderColor: equipped ? c.ink : c.border,
          shadowColor: c.shadow,
        },
      ]}
    >
      <View style={[styles.skinBox, { backgroundColor: c.trayInner }]}>
        {SKIN_PREVIEW.map((col, i) => (
          <View key={col} style={{ marginTop: i % 2 ? 8 : 0 }}>
            <Pencil color={col} skin={item.id} width={22} />
          </View>
        ))}
        <View style={[styles.skinLip, { backgroundColor: c.tray }]} />
      </View>
      <Text style={[styles.skinName, { color: c.ink }]} numberOfLines={1}>
        {item.name}
      </Text>
      {equipped ? (
        <View style={[styles.equipped, { backgroundColor: c.ink }]}>
          <MaterialCommunityIcons name="check-bold" size={14} color={c.paper} />
          <Text style={[styles.equippedText, { color: c.paper }]}>In use</Text>
        </View>
      ) : owned ? (
        <PriceButton testID={`skin-${item.id}`} label="Use" tone="leaf" onPress={press} />
      ) : (
        <PriceButton testID={`skin-${item.id}`} price={item.price} onPress={press} />
      )}
    </View>
  );
}

function PictureCard({ id, onToast }: { id: string; onToast: (t: string, good: boolean) => void }) {
  const c = useColors();
  const image = IMAGE_BY_ID[id];
  const unlocked = useGameStore((s) => s.unlocked.includes(id));
  const [busy, setBusy] = useState(false);
  if (!image) return null;
  const buy = () => {
    const g = useGameStore.getState();
    if (g.spend(PICTURE_PRICE)) {
      g.unlockPicture(id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      onToast(`${image.title} unlocked!`, true);
    } else onToast('Not enough coins yet', false);
  };
  const watch = async () => {
    if (busy) return;
    setBusy(true);
    const ok = await showRewarded();
    setBusy(false);
    if (ok) {
      useGameStore.getState().unlockPicture(id);
      onToast(`${image.title} unlocked!`, true);
    } else onToast('No video right now. Try again later.', false);
  };
  return (
    <View style={[styles.row, { backgroundColor: c.paper, borderColor: c.border, shadowColor: c.shadow }]}>
      <View style={[styles.picThumb, { borderColor: c.border }]}>
        <TargetArt image={image} size={64} strokeWidth={7} />
        {!unlocked ? (
          <View style={[styles.picLock, { backgroundColor: c.scrim }]}>
            <MaterialCommunityIcons name="lock" size={22} color={c.paper} />
          </View>
        ) : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, { color: c.ink }]}>{image.title}</Text>
        <Text style={[styles.rowSub, { color: c.mutedForeground }]}>
          {unlocked ? 'Ready in Free Coloring' : 'Free Coloring picture'}
        </Text>
      </View>
      {unlocked ? (
        <PriceButton
          testID={`open-${id}`}
          label="Color"
          tone="leaf"
          onPress={() => router.push({ pathname: '/color/[id]', params: { id } })}
        />
      ) : (
        <View style={{ gap: 6 }}>
          <PriceButton testID={`unlock-${id}`} price={PICTURE_PRICE} onPress={buy} />
          <Pressable testID={`unlock-ad-${id}`} onPress={watch} disabled={busy} hitSlop={4} style={styles.adLink}>
            {busy ? (
              <ActivityIndicator size="small" color={c.ink} />
            ) : (
              <>
                <MaterialCommunityIcons name="play-circle-outline" size={16} color={c.ink} />
                <Text style={[styles.adLinkText, { color: c.ink }]}>Video</Text>
              </>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default function StoreScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const [toast, setToast] = useState<Toast>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const float = useSharedValue(0);
  useEffect(() => {
    float.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [float]);
  const chestStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -6 * float.value }, { rotate: `${-3 + 3 * float.value}deg` }],
  }));

  const showToast = (text: string, good: boolean) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ text, good, key: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  };

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <LinearGradient
        colors={[c.plum, c.plumSoft]}
        style={[styles.hero, { paddingTop: topPad + 4 }]}
      >
        <View style={styles.headerRow}>
          <IconButton
            icon="chevron-left"
            size={44}
            accessibilityLabel="Back"
            testID="back"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          />
          <View style={{ flex: 1 }} />
          <CoinChip />
        </View>
        <View style={styles.heroBody}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroTitle, { color: c.paper }]}>Shop</Text>
            <Text style={[styles.heroSub, { color: c.goldSoft }]}>Power-ups, pencil boxes and pictures</Text>
          </View>
          <Animated.View style={chestStyle}>
            <Image source={chest} style={styles.chest} contentFit="contain" />
          </Animated.View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <FreeCoins onToast={showToast} />

        <SectionTitle title="Power-ups" icon="flash" />
        {TOOLS.map((t) => (
          <ToolCard key={t.id} item={t} onToast={showToast} />
        ))}

        <SectionTitle title="Pencil boxes" icon="pencil-box-multiple" />
        <View style={styles.skinGrid}>
          {SKINS.map((s) => (
            <SkinCard key={s.id} item={s} onToast={showToast} />
          ))}
        </View>

        <SectionTitle title="Pictures" icon="image-multiple" />
        {LOCKED_PICTURES.map((id) => (
          <PictureCard key={id} id={id} onToast={showToast} />
        ))}
      </ScrollView>

      {toast ? (
        <View pointerEvents="none" style={styles.toastWrap}>
          <View
            key={toast.key}
            testID="store-toast"
            style={[styles.toast, { backgroundColor: toast.good ? c.leaf : c.ink }]}
          >
            <MaterialCommunityIcons
              name={toast.good ? 'check-circle' : 'information'}
              size={18}
              color={c.paper}
            />
            <Text style={[styles.toastText, { color: c.paper }]}>{toast.text}</Text>
          </View>
        </View>
      ) : null}
      <AdBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: { paddingHorizontal: 14, paddingBottom: 6, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  heroBody: { flexDirection: 'row', alignItems: 'center', paddingLeft: 6 },
  heroTitle: { fontFamily: fonts.black, fontSize: 36, letterSpacing: -0.5 },
  heroSub: { fontFamily: fonts.bold, fontSize: 14 },
  chest: { width: 128, height: 128 },
  content: { padding: 14, gap: 10, paddingBottom: 24 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, marginLeft: 4 },
  sectionTitle: { fontFamily: fonts.black, fontSize: 20 },
  freeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 24,
    borderWidth: 2.5,
  },
  freeTitle: { fontFamily: fonts.black, fontSize: 20 },
  freeSub: { fontFamily: fonts.bold, fontSize: 14 },
  freeLeft: { fontFamily: fonts.extrabold, fontSize: 12, marginTop: 4, opacity: 0.9 },
  freeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 26,
    borderWidth: 2.5,
  },
  freeBtnText: { fontFamily: fonts.black, fontSize: 18 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 22,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 0,
    elevation: 2,
  },
  toolIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontFamily: fonts.black, fontSize: 17 },
  rowSub: { fontFamily: fonts.semibold, fontSize: 13 },
  owned: { fontFamily: fonts.extrabold, fontSize: 12, marginTop: 2 },
  priceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minWidth: 82,
    height: 42,
    paddingHorizontal: 12,
    borderRadius: 21,
    borderWidth: 2,
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  coinDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
  priceText: { fontFamily: fonts.black, fontSize: 16 },
  skinGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  skinCard: {
    width: '48%',
    flexGrow: 1,
    padding: 10,
    gap: 8,
    borderRadius: 22,
    borderWidth: 2.5,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 0,
    elevation: 2,
  },
  skinBox: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 3,
    alignSelf: 'stretch',
    height: 78,
    paddingTop: 8,
    borderRadius: 14,
    overflow: 'hidden',
  },
  skinLip: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 18 },
  skinName: { fontFamily: fonts.extrabold, fontSize: 14 },
  equipped: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 21,
  },
  equippedText: { fontFamily: fonts.black, fontSize: 14 },
  picThumb: { borderWidth: 2, borderRadius: 14, overflow: 'hidden' },
  picLock: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  adLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, height: 22 },
  adLinkText: { fontFamily: fonts.extrabold, fontSize: 13, textDecorationLine: 'underline' },
  toastWrap: { position: 'absolute', left: 0, right: 0, bottom: 110, alignItems: 'center' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    height: 42,
    borderRadius: 21,
  },
  toastText: { fontFamily: fonts.extrabold, fontSize: 14 },
});

import { useCallback, useMemo, useRef } from 'react';
import { Platform } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const MIN_SCALE = 1;
const MAX_SCALE = 6;
/** After a pan/pinch ends, ignore region taps for this long (ms). */
const TAP_GUARD_MS = 250;

const clampScale = (s: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));

/**
 * Pinch-to-zoom + pan for the coloring canvas, plus button controls.
 * `onWebTap` receives viewport (client) coordinates of a tap on web.
 */
export function useCanvasZoom(size: number, onWebTap?: (clientX: number, clientY: number) => void) {
  const scale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const start = useRef({ s: 1, x: 0, y: 0 });
  const guard = useRef({ active: false, last: 0 });

  const gesture = useMemo(() => {
    const clampT = (v: number, s: number) => {
      const m = (size * (s - 1)) / 2;
      return Math.min(m, Math.max(-m, v));
    };
    const endGuard = () => {
      guard.current.active = false;
      guard.current.last = Date.now();
    };

    const pinch = Gesture.Pinch()
      .runOnJS(true)
      .onStart(() => {
        start.current.s = scale.value;
        guard.current.active = true;
      })
      .onUpdate((e) => {
        const s = clampScale(start.current.s * e.scale);
        scale.value = s;
        tx.value = clampT(tx.value, s);
        ty.value = clampT(ty.value, s);
      })
      .onEnd(endGuard);

    const pan = Gesture.Pan()
      .runOnJS(true)
      .minDistance(8)
      .averageTouches(true)
      .onStart(() => {
        start.current.x = tx.value;
        start.current.y = ty.value;
        guard.current.active = true;
      })
      .onUpdate((e) => {
        tx.value = clampT(start.current.x + e.translationX, scale.value);
        ty.value = clampT(start.current.y + e.translationY, scale.value);
      })
      .onEnd(endGuard);

    const zoomPan = Gesture.Simultaneous(pinch, pan);
    if (Platform.OS !== 'web' || !onWebTap) return zoomPan;

    // Web: pointer capture stops clicks reaching SVG paths, so taps are
    // detected here and resolved to a region by screen position.
    const tap = Gesture.Tap()
      .runOnJS(true)
      .maxDistance(8)
      .onEnd((e, success) => {
        if (success) onWebTap(e.absoluteX, e.absoluteY);
      });
    return Gesture.Race(zoomPan, tap);
  }, [size, scale, tx, ty, onWebTap]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  const zoomTo = useCallback(
    (s: number) => {
      const target = clampScale(s);
      const m = (size * (target - 1)) / 2;
      scale.value = withTiming(target, { duration: 220 });
      tx.value = withTiming(Math.min(m, Math.max(-m, tx.value)), { duration: 220 });
      ty.value = withTiming(Math.min(m, Math.max(-m, ty.value)), { duration: 220 });
    },
    [size, scale, tx, ty],
  );

  const zoomIn = useCallback(() => zoomTo(scale.value * 1.6), [zoomTo, scale]);
  const zoomOut = useCallback(() => zoomTo(scale.value / 1.6), [zoomTo, scale]);
  const reset = useCallback(() => zoomTo(1), [zoomTo]);

  const shouldIgnoreTap = useCallback(
    () => guard.current.active || Date.now() - guard.current.last < TAP_GUARD_MS,
    [],
  );

  return { gesture, animatedStyle, zoomIn, zoomOut, reset, shouldIgnoreTap };
}

import React, { memo } from 'react';
import { Platform } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';

import colors from '@/constants/colors';
import { VIEWBOX } from '@/src/data/svgHelpers';
import { fillToColor, useArtStore } from '@/src/store/artStore';
import type { ColoringImage, Region } from '@/src/types';

const INK = colors.light.ink;
const HIGHLIGHT = colors.light.hintGlow;
const HINT_STROKE = colors.light.primary;
const PAPER = colors.light.paper;
const REGION_DOM_PREFIX = 'cj-region:';

/** Web only: id of the tappable region under a screen point, if any. */
export function regionIdAtPoint(clientX: number, clientY: number): string | null {
  if (typeof document === 'undefined') return null;
  const stack = document.elementsFromPoint(clientX, clientY);
  for (const start of stack) {
    let el: Element | null = start;
    while (el) {
      const id = el.getAttribute('id');
      if (id && id.startsWith(REGION_DOM_PREFIX)) return id.slice(REGION_DOM_PREFIX.length);
      el = el.parentElement;
    }
  }
  return null;
}

interface RegionPathProps {
  artKey: string;
  region: Region;
  strokeWidth: number;
  highlighted: boolean;
  onPress?: (regionId: string) => void;
}

/**
 * One region. Subscribes only to its own fill, so tapping a region
 * re-renders that single path and nothing else.
 */
const RegionPath = memo(function RegionPath({
  artKey,
  region,
  strokeWidth,
  highlighted,
  onPress,
}: RegionPathProps) {
  const fill = useArtStore((s) => s.fills[artKey]?.[region.id]);
  // Web: the pan/zoom gesture captures the pointer, so DOM clicks never reach
  // the path. Instead the canvas detects the tap and finds the region by DOM
  // id (see regionIdAtPoint). Native: regular onPress on the path.
  const isWeb = Platform.OS === 'web';
  return (
    <Path
      d={region.d}
      fill={fill ? fillToColor(fill) : highlighted ? HIGHLIGHT : PAPER}
      stroke={highlighted && !fill ? HINT_STROKE : INK}
      strokeWidth={highlighted && !fill ? strokeWidth * 1.8 : strokeWidth}
      strokeLinejoin="round"
      strokeLinecap="round"
      id={onPress && isWeb ? `${REGION_DOM_PREFIX}${region.id}` : undefined}
      onPress={onPress && !isWeb ? () => onPress(region.id) : undefined}
    />
  );
});

interface ArtSvgProps {
  image: ColoringImage;
  size: number;
  /** Which saved fills to show; defaults to the free-coloring fills. */
  artKey?: string;
  strokeWidth?: number;
  onRegionPress?: (regionId: string) => void;
  /** Hint: this unfilled part glows so the player can find it. */
  hintRegionId?: string | null;
}

export const ArtSvg = memo(function ArtSvg({
  image,
  size,
  artKey = image.id,
  strokeWidth = 4.5,
  onRegionPress,
  hintRegionId,
}: ArtSvgProps) {
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}>
      {image.regions.map((r) => (
        <RegionPath
          key={r.id}
          artKey={artKey}
          region={r}
          strokeWidth={strokeWidth}
          highlighted={hintRegionId === r.id}
          onPress={onRegionPress}
        />
      ))}
      <Details image={image} strokeWidth={strokeWidth} />
    </Svg>
  );
});

function Details({ image, strokeWidth }: { image: ColoringImage; strokeWidth: number }) {
  if (!image.details || image.details.length === 0) return null;
  return (
    <G pointerEvents="none">
      {image.details.map((d, i) => (
        <Path
          key={i}
          d={d}
          fill="none"
          stroke={INK}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </G>
  );
}

/** The finished picture in its intended colors (the reference to copy). */
export const TargetArt = memo(function TargetArt({
  image,
  size,
  strokeWidth = 4.5,
}: {
  image: ColoringImage;
  size: number;
  strokeWidth?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}>
      {image.regions.map((r) => (
        <Path
          key={r.id}
          d={r.d}
          fill={image.palette[r.n - 1] ?? PAPER}
          stroke={INK}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}
      <Details image={image} strokeWidth={strokeWidth} />
    </Svg>
  );
});

export function useFilledCount(artKey: string): number {
  return useArtStore((s) => {
    const f = s.fills[artKey];
    return f ? Object.keys(f).length : 0;
  });
}

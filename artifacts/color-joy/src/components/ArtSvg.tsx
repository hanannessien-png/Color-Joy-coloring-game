import React, { memo } from 'react';
import { Platform } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';

import colors from '@/constants/colors';
import { VIEWBOX } from '@/src/data/svgHelpers';
import { fillToColor, useArtStore } from '@/src/store/artStore';
import type { ColoringImage, Region } from '@/src/types';

const INK = colors.light.ink;
const REGION_DOM_PREFIX = 'cj-region:';

/** Web only: id of the tappable region under a screen point, if any. */
export function regionIdAtPoint(clientX: number, clientY: number): string | null {
  if (typeof document === 'undefined') return null;
  let el: Element | null = document.elementFromPoint(clientX, clientY);
  while (el) {
    const id = el.getAttribute('id');
    if (id && id.startsWith(REGION_DOM_PREFIX)) return id.slice(REGION_DOM_PREFIX.length);
    el = el.parentElement;
  }
  return null;
}

interface RegionPathProps {
  imageId: string;
  region: Region;
  strokeWidth: number;
  onPress?: (regionId: string) => void;
}

/**
 * One region. Subscribes only to its own fill, so tapping a region
 * re-renders that single path and nothing else.
 */
const RegionPath = memo(function RegionPath({
  imageId,
  region,
  strokeWidth,
  onPress,
}: RegionPathProps) {
  const fill = useArtStore((s) => s.fills[imageId]?.[region.id]);
  // Web: the pan/zoom gesture captures the pointer, so DOM clicks never reach
  // the path. Instead the canvas detects the tap and finds the region by DOM
  // id (see regionIdAtPoint). Native: regular onPress on the path.
  const isWeb = Platform.OS === 'web';
  return (
    <Path
      d={region.d}
      fill={fillToColor(fill)}
      stroke={INK}
      strokeWidth={strokeWidth}
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
  strokeWidth?: number;
  onRegionPress?: (regionId: string) => void;
}

export const ArtSvg = memo(function ArtSvg({
  image,
  size,
  strokeWidth = 4.5,
  onRegionPress,
}: ArtSvgProps) {
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}>
      {image.regions.map((r) => (
        <RegionPath
          key={r.id}
          imageId={image.id}
          region={r}
          strokeWidth={strokeWidth}
          onPress={onRegionPress}
        />
      ))}
      {image.details && image.details.length > 0 ? (
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
      ) : null}
    </Svg>
  );
});

export function useFilledCount(imageId: string): number {
  return useArtStore((s) => {
    const f = s.fills[imageId];
    return f ? Object.keys(f).length : 0;
  });
}

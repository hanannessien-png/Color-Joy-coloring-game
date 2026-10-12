import React, { memo } from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import colors from '@/constants/colors';
import type { SkinId } from '@/src/data/shop';

const T = colors.light;
const SW = 1.8;

/** Drawn in a 40x120 box with the tip at the top. */
export const PENCIL_VIEW = { w: 40, h: 120 };

function WoodPencil({ color }: { color: string }) {
  return (
    <>
      <Path d="M20 2 L36 36 L4 36 Z" fill={T.wood} stroke={T.ink} strokeWidth={SW} strokeLinejoin="round" />
      <Path d="M20 2 L25.4 13.5 L14.6 13.5 Z" fill={color} stroke={T.ink} strokeWidth={SW} strokeLinejoin="round" />
      <Path
        d="M4 36 L9.3 31 L14.6 36 L20 31 L25.3 36 L30.6 31 L36 36 V104 H4 Z"
        fill={color}
        stroke={T.ink}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <Rect x={15} y={35} width={10} height={69} fill={T.paper} opacity={0.28} />
      <Rect x={4.9} y={36} width={4} height={68} fill={T.ink} opacity={0.12} />
      <Rect x={4} y={104} width={32} height={7} fill={T.metal} stroke={T.ink} strokeWidth={SW} />
      <Path d="M4 111 H36 V113 Q36 118 31 118 H9 Q4 118 4 113 Z" fill={T.eraser} stroke={T.ink} strokeWidth={SW} />
    </>
  );
}

function Crayon({ color }: { color: string }) {
  return (
    <>
      <Path d="M10 32 Q11 9 20 4 Q29 9 30 32 Z" fill={color} stroke={T.ink} strokeWidth={SW} strokeLinejoin="round" />
      <Rect x={6} y={30} width={28} height={86} rx={5} fill={color} stroke={T.ink} strokeWidth={SW} />
      <Rect x={6} y={44} width={28} height={58} fill={T.paperWrap} stroke={T.ink} strokeWidth={SW} />
      <Rect x={10} y={58} width={20} height={30} rx={4} fill={color} />
      <Path d="M6 50 H34 M6 96 H34" stroke={color} strokeWidth={2.5} />
      <Rect x={12} y={33} width={5} height={80} rx={2.5} fill={T.paper} opacity={0.25} />
    </>
  );
}

function Marker({ color }: { color: string }) {
  return (
    <>
      <Rect x={7} y={2} width={26} height={42} rx={9} fill={color} stroke={T.ink} strokeWidth={SW} />
      <Rect x={11} y={6} width={5} height={30} rx={2.5} fill={T.paper} opacity={0.35} />
      <Rect x={33} y={10} width={3.5} height={26} rx={1.75} fill={color} stroke={T.ink} strokeWidth={SW * 0.8} />
      <Rect x={6} y={40} width={28} height={76} rx={7} fill={T.paperWrap} stroke={T.ink} strokeWidth={SW} />
      <Rect x={6} y={40} width={28} height={6} fill={T.ink} opacity={0.1} />
      <Rect x={6} y={84} width={28} height={16} fill={color} stroke={T.ink} strokeWidth={SW} />
      <Circle cx={20} cy={64} r={6} fill={color} stroke={T.ink} strokeWidth={SW * 0.8} />
    </>
  );
}

function Brush({ color }: { color: string }) {
  return (
    <>
      <Path d="M20 2 Q31 14 29 36 H11 Q9 14 20 2 Z" fill={color} stroke={T.ink} strokeWidth={SW} strokeLinejoin="round" />
      <Path d="M16 10 Q14 20 14.5 32" stroke={T.paper} strokeOpacity={0.4} strokeWidth={2.5} strokeLinecap="round" fill="none" />
      <Rect x={10} y={35} width={20} height={19} rx={2} fill={T.metal} stroke={T.ink} strokeWidth={SW} />
      <Path d="M10 41 H30 M10 47 H30" stroke={T.ink} strokeWidth={1} opacity={0.4} />
      <Path d="M10.5 54 H29.5 L26 113 Q20 119 14 113 Z" fill={color} stroke={T.ink} strokeWidth={SW} strokeLinejoin="round" />
      <Path d="M15 58 L16.5 108" stroke={T.paper} strokeOpacity={0.3} strokeWidth={3} strokeLinecap="round" />
    </>
  );
}

const SKIN_DRAW: Record<SkinId, React.ComponentType<{ color: string }>> = {
  pencil: WoodPencil,
  crayon: Crayon,
  marker: Marker,
  brush: Brush,
};

export const Pencil = memo(function Pencil({
  color,
  skin,
  width,
}: {
  color: string;
  skin: SkinId;
  width: number;
}) {
  const Draw = SKIN_DRAW[skin] ?? WoodPencil;
  const height = (width * PENCIL_VIEW.h) / PENCIL_VIEW.w;
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${PENCIL_VIEW.w} ${PENCIL_VIEW.h}`}>
      <Draw color={color} />
    </Svg>
  );
});

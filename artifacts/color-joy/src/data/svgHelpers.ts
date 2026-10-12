/**
 * Small helpers that turn simple geometry into closed SVG path strings.
 * All pictures use a 400 x 400 coordinate space.
 */
import type { Region } from '@/src/types';

export const VIEWBOX = 400;

const r1 = (v: number) => Math.round(v * 10) / 10;
const rad = (deg: number) => (deg * Math.PI) / 180;

export function region(id: string, d: string, n: number, l: [number, number]): Region {
  return { id, d, n, l };
}

export function circle(cx: number, cy: number, r: number): string {
  return `M${r1(cx - r)} ${r1(cy)}A${r} ${r} 0 1 0 ${r1(cx + r)} ${r1(cy)}A${r} ${r} 0 1 0 ${r1(cx - r)} ${r1(cy)}Z`;
}

export function ellipse(cx: number, cy: number, rx: number, ry: number, rotDeg = 0): string {
  const c = Math.cos(rad(rotDeg));
  const s = Math.sin(rad(rotDeg));
  const sx = r1(cx - rx * c);
  const sy = r1(cy - rx * s);
  const ex = r1(cx + rx * c);
  const ey = r1(cy + rx * s);
  return `M${sx} ${sy}A${rx} ${ry} ${rotDeg} 1 0 ${ex} ${ey}A${rx} ${ry} ${rotDeg} 1 0 ${sx} ${sy}Z`;
}

export function rect(x: number, y: number, w: number, h: number, r = 0): string {
  if (r <= 0) return `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
  const rr = Math.min(r, w / 2, h / 2);
  return (
    `M${x + rr} ${y}H${x + w - rr}A${rr} ${rr} 0 0 1 ${x + w} ${y + rr}` +
    `V${y + h - rr}A${rr} ${rr} 0 0 1 ${x + w - rr} ${y + h}` +
    `H${x + rr}A${rr} ${rr} 0 0 1 ${x} ${y + h - rr}` +
    `V${y + rr}A${rr} ${rr} 0 0 1 ${x + rr} ${y}Z`
  );
}

export function poly(points: [number, number][]): string {
  return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${r1(x)} ${r1(y)}`).join('') + 'Z';
}

/** Point at a given radius/angle around a center. Angle 0 points up. */
export function polar(cx: number, cy: number, r: number, angleDeg: number): [number, number] {
  const a = rad(angleDeg - 90);
  return [r1(cx + r * Math.cos(a)), r1(cy + r * Math.sin(a))];
}

/** Leaf/petal shape pointing outward from a center. */
export function petal(
  cx: number,
  cy: number,
  angleDeg: number,
  r0: number,
  rTip: number,
  width: number,
): string {
  const a = rad(angleDeg - 90);
  const ux = Math.cos(a);
  const uy = Math.sin(a);
  const px = -uy;
  const py = ux;
  const bx = cx + r0 * ux;
  const by = cy + r0 * uy;
  const tx = cx + rTip * ux;
  const ty = cy + rTip * uy;
  const rm = (r0 + rTip) / 2;
  const mx = cx + rm * ux;
  const my = cy + rm * uy;
  return (
    `M${r1(bx)} ${r1(by)}` +
    `Q${r1(mx + px * width)} ${r1(my + py * width)} ${r1(tx)} ${r1(ty)}` +
    `Q${r1(mx - px * width)} ${r1(my - py * width)} ${r1(bx)} ${r1(by)}Z`
  );
}

export function star(cx: number, cy: number, outer: number, inner: number, points = 5): string {
  const pts: [number, number][] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    pts.push(polar(cx, cy, r, (i * 180) / points));
  }
  return poly(pts);
}

/** Puffy cloud roughly 100 wide, anchored at its left/middle point. */
export function cloud(x: number, y: number): string {
  return (
    `M${x} ${y}A18 18 0 0 1 ${x + 20} ${y - 18}A26 26 0 0 1 ${x + 65} ${y - 22}` +
    `A20 20 0 0 1 ${x + 95} ${y - 5}A14 14 0 0 1 ${x + 95} ${y + 22}` +
    `L${x + 5} ${y + 22}A12 12 0 0 1 ${x} ${y}Z`
  );
}

/**
 * Picture library. Every picture is original line art made of separate
 * closed paths (regions), each with a unique id so it can be tapped.
 *
 * To add a picture: append an object to IMAGES. Regions are drawn in order
 * (first = bottom). `n` is the paint-by-number color (1-based index into
 * `palette`) and `l` is where its number label sits.
 */
import type { ColoringImage } from '@/src/types';
import {
  circle,
  cloud,
  ellipse,
  petal,
  polar,
  poly,
  rect,
  region,
  star,
} from '@/src/data/svgHelpers';

const BG = rect(0, 0, 400, 400);

// ---------- Animals ----------
const happyCat: ColoringImage = {
  id: 'animals-happy-cat',
  title: 'Happy Cat',
  category: 'animals',
  difficulty: 'easy',
  palette: ['#BDE7FF', '#FFA94D', '#FFE0B2', '#FF8FAB', '#7ED957', '#5B4636'],
  regions: [
    region('sky', BG, 1, [40, 40]),
    region('grass', 'M0 320Q100 300 200 320T400 315L400 400L0 400Z', 5, [50, 375]),
    region('tail', 'M270 300Q350 290 340 210Q335 180 315 190Q325 230 300 260Q285 275 262 278Z', 2, [326, 236]),
    region('body', ellipse(210, 285, 80, 62), 2, [262, 290]),
    region('belly', ellipse(200, 300, 42, 36), 3, [200, 305]),
    region('ear-left', poly([[140, 150], [150, 85], [195, 128]]), 2, [153, 97]),
    region('ear-right', poly([[260, 150], [250, 85], [205, 128]]), 2, [247, 97]),
    region('inner-ear-left', poly([[152, 138], [157, 103], [182, 128]]), 4, [162, 124]),
    region('inner-ear-right', poly([[248, 138], [243, 103], [218, 128]]), 4, [238, 124]),
    region('head', circle(200, 175, 62), 2, [200, 132]),
    region('eye-left', ellipse(178, 165, 10, 13), 6, [178, 166]),
    region('eye-right', ellipse(222, 165, 10, 13), 6, [222, 166]),
    region('nose', poly([[192, 185], [208, 185], [200, 195]]), 4, [200, 189]),
    region('cheek-left', circle(160, 196, 9), 4, [160, 197]),
    region('cheek-right', circle(240, 196, 9), 4, [240, 197]),
    region('paw-left', ellipse(170, 342, 22, 13), 3, [170, 343]),
    region('paw-right', ellipse(245, 342, 22, 13), 3, [245, 343]),
  ],
  details: [
    'M200 195Q192 208 182 203M200 195Q208 208 218 203',
    'M150 185L118 178M150 192L116 194M250 185L282 178M250 192L284 194',
  ],
};

// ---------- Mandala ----------
function sunMandala(): ColoringImage {
  const regions = [region('bg', BG, 4, [22, 24])];
  for (let i = 0; i < 12; i++) {
    const a = i * 30;
    regions.push(region(`outer-petal-${i + 1}`, petal(200, 200, a, 100, 185, 34), i % 2 ? 2 : 6, polar(200, 200, 152, a)));
  }
  regions.push(region('ring', circle(200, 200, 115), 3, polar(200, 200, 100, 0)));
  for (let i = 0; i < 8; i++) {
    const a = i * 45 + 22.5;
    regions.push(region(`mid-petal-${i + 1}`, petal(200, 200, a, 50, 112, 28), i % 2 ? 5 : 1, polar(200, 200, 88, a)));
  }
  regions.push(region('inner-disc', circle(200, 200, 60), 2, polar(200, 200, 50, 22.5)));
  for (let i = 0; i < 8; i++) {
    const a = i * 45;
    regions.push(region(`inner-petal-${i + 1}`, petal(200, 200, a, 18, 58, 14), 1, polar(200, 200, 40, a)));
  }
  regions.push(region('center', circle(200, 200, 20), 5, [200, 201]));
  return {
    id: 'mandala-sun',
    title: 'Sun Mandala',
    category: 'mandala',
    difficulty: 'medium',
    palette: ['#FFD166', '#EF476F', '#06D6A0', '#118AB2', '#9B5DE5', '#FF9F1C'],
    regions,
  };
}

// ---------- Cartoon Characters ----------
const blobBuddy: ColoringImage = {
  id: 'cartoon-blob-buddy',
  title: 'Blob Buddy',
  category: 'cartoon',
  difficulty: 'easy',
  palette: ['#FFF3B0', '#8AC926', '#FFFFFF', '#1982C4', '#FF595E', '#2E2A3B', '#C5F27A'],
  regions: [
    region('bg', BG, 1, [36, 36]),
    region('ground', ellipse(200, 350, 150, 26), 7, [90, 352]),
    region('horn-left', poly([[150, 135], [135, 70], [180, 118]]), 5, [150, 108]),
    region('horn-right', poly([[250, 135], [265, 70], [220, 118]]), 5, [250, 108]),
    region('arm-left', ellipse(105, 235, 40, 18, -30), 2, [96, 240]),
    region('arm-right', ellipse(295, 235, 40, 18, 30), 2, [304, 240]),
    region('foot-left', ellipse(160, 335, 34, 18), 2, [150, 338]),
    region('foot-right', ellipse(240, 335, 34, 18), 2, [250, 338]),
    region('body', 'M200 110C285 110 315 190 310 255C305 320 260 340 200 340C140 340 95 320 90 255C85 190 115 110 200 110Z', 2, [128, 300]),
    region('belly', ellipse(200, 285, 62, 42), 7, [200, 300]),
    region('eye', circle(200, 185, 40), 3, [176, 168]),
    region('iris', circle(205, 190, 20), 4, [198, 182]),
    region('pupil', circle(208, 192, 8), 6, [208, 193]),
    region('mouth', 'M165 245Q200 285 235 245Q200 258 165 245Z', 5, [200, 262]),
    region('spot-1', circle(130, 200, 10), 7, [130, 201]),
    region('spot-2', circle(270, 190, 12), 7, [270, 191]),
    region('spot-3', circle(288, 270, 9), 7, [288, 271]),
  ],
};

// ---------- Nature & Flowers ----------
function sunflower(): ColoringImage {
  const regions = [
    region('sky', BG, 1, [30, 130]),
    region('ground', 'M0 330Q200 300 400 330L400 400L0 400Z', 4, [40, 375]),
    region('cloud', cloud(30, 75), 6, [78, 75]),
    region('stem', rect(192, 190, 16, 150, 6), 4, [200, 300]),
    region('leaf-left', 'M196 280Q140 230 110 260Q150 300 196 290Z', 4, [152, 273]),
    region('leaf-right', 'M204 250Q260 200 292 228Q252 270 204 262Z', 4, [250, 242]),
  ];
  for (let i = 0; i < 14; i++) {
    const a = (i * 360) / 14;
    regions.push(region(`petal-${i + 1}`, petal(200, 150, a, 40, 100, 26), i % 2 ? 7 : 2, polar(200, 150, 76, a)));
  }
  regions.push(region('seed-head', circle(200, 150, 46), 3, [200, 117]));
  regions.push(region('seed-center', circle(200, 150, 24), 8, [200, 151]));
  regions.push(region('pot', poly([[150, 320], [250, 320], [238, 390], [162, 390]]), 5, [200, 360]));
  regions.push(region('pot-rim', rect(140, 305, 120, 24, 8), 9, [200, 318]));
  return {
    id: 'nature-sunflower',
    title: 'Sunflower Pot',
    category: 'nature',
    difficulty: 'medium',
    palette: ['#BDE7FF', '#FFD60A', '#8B5E34', '#6BBF59', '#E76F51', '#FFFFFF', '#FFB703', '#5E3B1E', '#F4A261'],
    regions,
  };
}

// ---------- Food & Sweets ----------
function cupcake(): ColoringImage {
  const topX = [110, 146, 182, 218, 254, 290];
  const botX = [135, 161, 187, 213, 239, 265];
  const strips = topX.slice(0, 5).map((x, i) =>
    region(
      `wrapper-${i + 1}`,
      poly([[x, 230], [topX[i + 1], 230], [botX[i + 1], 345], [botX[i], 345]]),
      i % 2 ? 3 : 4,
      [(x + topX[i + 1] + botX[i] + botX[i + 1]) / 4, 300],
    ),
  );
  return {
    id: 'food-cupcake',
    title: 'Cherry Cupcake',
    category: 'food',
    difficulty: 'easy',
    palette: ['#FFE5EC', '#FF8FAB', '#FFFFFF', '#8ECAE6', '#E63946', '#6BBF59', '#FFB703'],
    regions: [
      region('bg', BG, 1, [36, 36]),
      region('plate', ellipse(200, 355, 130, 20), 4, [100, 358]),
      ...strips,
      region('frosting-bottom', 'M95 235Q90 200 130 195L270 195Q310 200 305 235Q200 255 95 235Z', 2, [118, 222]),
      region('frosting-middle', 'M120 200Q115 160 160 158L240 158Q285 160 280 200Q200 215 120 200Z', 3, [140, 185]),
      region('frosting-top', 'M150 162Q150 120 200 105Q250 120 250 162Q200 172 150 162Z', 2, [222, 145]),
      region('cherry', circle(200, 95, 20), 5, [200, 98]),
      region('cherry-stem', 'M200 77Q205 55 222 45L226 50Q210 60 205 77Z', 6, [214, 56]),
      region('sprinkle-1', ellipse(150, 225, 9, 4, 30), 7, [150, 225]),
      region('sprinkle-2', ellipse(255, 222, 9, 4, -30), 6, [255, 222]),
      region('sprinkle-3', ellipse(178, 186, 9, 4, -20), 4, [178, 186]),
      region('sprinkle-4', ellipse(232, 184, 9, 4, 25), 7, [232, 184]),
      region('sprinkle-5', ellipse(178, 140, 9, 4, 0), 4, [178, 140]),
      region('sprinkle-6', ellipse(205, 225, 9, 4, 10), 6, [205, 225]),
    ],
  };
}

// ---------- Vehicles ----------
const littleCar: ColoringImage = {
  id: 'vehicles-little-car',
  title: 'Little Car',
  category: 'vehicles',
  difficulty: 'easy',
  palette: ['#BDE7FF', '#EF476F', '#E8F7FF', '#2E2A3B', '#CCCCCC', '#FFD166', '#8D99AE', '#E63946'],
  regions: [
    region('sky', BG, 1, [40, 120]),
    region('sun', circle(330, 70, 34), 6, [330, 71]),
    region('road', rect(0, 300, 400, 100), 7, [30, 330]),
    region('dash-1', rect(30, 355, 50, 10, 4), 6, [55, 361]),
    region('dash-2', rect(130, 355, 50, 10, 4), 6, [155, 361]),
    region('dash-3', rect(230, 355, 50, 10, 4), 6, [255, 361]),
    region('dash-4', rect(330, 355, 50, 10, 4), 6, [355, 361]),
    region('cabin', 'M130 200L160 150L255 150L290 200Z', 2, [210, 156]),
    region('window-front', poly([[150, 195], [168, 162], [205, 162], [205, 195]]), 3, [185, 180]),
    region('window-back', poly([[215, 195], [215, 162], [250, 162], [275, 195]]), 3, [240, 180]),
    region('body', rect(70, 195, 260, 70, 22), 2, [200, 225]),
    region('headlight', ellipse(318, 220, 9, 13), 6, [318, 221]),
    region('taillight', rect(72, 210, 12, 22, 4), 8, [78, 221]),
    region('bumper', rect(60, 250, 280, 16, 8), 5, [200, 259]),
    region('wheel-back', circle(135, 270, 32), 4, [135, 248]),
    region('wheel-front', circle(270, 270, 32), 4, [270, 248]),
    region('hub-back', circle(135, 270, 13), 5, [135, 271]),
    region('hub-front', circle(270, 270, 13), 5, [270, 271]),
  ],
  details: ['M210 200L210 245', 'M222 215L234 215'],
};

// ---------- Fantasy ----------
const dreamCastle: ColoringImage = {
  id: 'fantasy-dream-castle',
  title: 'Dream Castle',
  category: 'fantasy',
  difficulty: 'hard',
  palette: ['#CDEFFF', '#B8B8D1', '#9B5DE5', '#F15BB5', '#6BBF59', '#8B5E34', '#FEE440', '#FFFFFF', '#E9C46A'],
  regions: [
    region('sky', BG, 1, [30, 160]),
    region('cloud-left', cloud(20, 70), 8, [68, 70]),
    region('cloud-right', cloud(290, 55), 8, [338, 55]),
    region('hills', 'M0 320Q100 270 200 310Q300 270 400 310L400 400L0 400Z', 5, [50, 360]),
    region('walkway', 'M175 350L225 350L250 400L150 400Z', 9, [200, 380]),
    region('wall', rect(110, 200, 180, 150), 2, [200, 320]),
    region('crenel-1', rect(132, 184, 16, 20), 2, [140, 194]),
    region('crenel-2', rect(152, 184, 16, 20), 2, [160, 194]),
    region('crenel-3', rect(232, 184, 16, 20), 2, [240, 194]),
    region('crenel-4', rect(252, 184, 16, 20), 2, [260, 194]),
    region('center-tower', rect(170, 120, 60, 90), 2, [200, 192]),
    region('center-roof', poly([[160, 122], [200, 40], [240, 122]]), 4, [200, 98]),
    region('center-flag', poly([[200, 12], [228, 20], [200, 28]]), 7, [208, 20]),
    region('tower-left', rect(70, 150, 60, 200), 2, [100, 300]),
    region('tower-right', rect(270, 150, 60, 200), 2, [300, 300]),
    region('roof-left', poly([[60, 152], [100, 70], [140, 152]]), 3, [100, 128]),
    region('roof-right', poly([[260, 152], [300, 70], [340, 152]]), 3, [300, 128]),
    region('flag-left', poly([[100, 42], [128, 50], [100, 58]]), 4, [108, 50]),
    region('flag-right', poly([[300, 42], [328, 50], [300, 58]]), 4, [308, 50]),
    region('door', 'M175 350L175 290Q200 255 225 290L225 350Z', 6, [200, 320]),
    region('window-tower-left', 'M92 230L92 205Q100 192 108 205L108 230Z', 7, [100, 216]),
    region('window-tower-right', 'M292 230L292 205Q300 192 308 205L308 230Z', 7, [300, 216]),
    region('window-center', circle(200, 160, 13), 7, [200, 161]),
    region('window-wall-left', 'M142 265L142 248Q150 236 158 248L158 265Z', 7, [150, 255]),
    region('window-wall-right', 'M242 265L242 248Q250 236 258 248L258 265Z', 7, [250, 255]),
  ],
  details: ['M100 70L100 42', 'M300 70L300 42', 'M200 40L200 12'],
};

// ---------- Space ----------
const rocketTrip: ColoringImage = {
  id: 'space-rocket-trip',
  title: 'Rocket Trip',
  category: 'space',
  difficulty: 'medium',
  palette: ['#1D1B4C', '#FFFFFF', '#EF476F', '#8ECAE6', '#FFD166', '#FF9F1C', '#9B5DE5', '#06D6A0'],
  regions: [
    region('space', BG, 1, [40, 200]),
    region('star-1', star(320, 60, 14, 6), 5, [320, 61]),
    region('star-2', star(60, 80, 11, 4.5), 5, [60, 81]),
    region('star-3', star(340, 250, 12, 5), 5, [340, 251]),
    region('star-4', star(150, 40, 9, 3.5), 5, [150, 41]),
    region('star-5', star(305, 345, 10, 4), 5, [305, 346]),
    region('planet', circle(85, 300, 50), 7, [70, 330]),
    region('crater-1', circle(72, 285, 11), 8, [72, 286]),
    region('crater-2', circle(104, 312, 8), 8, [104, 313]),
    region('flame-outer', 'M175 300Q200 395 225 300Z', 6, [200, 340]),
    region('flame-inner', 'M187 300Q200 360 213 300Z', 5, [200, 315]),
    region('fin-left', 'M160 230L120 300L165 285Z', 3, [150, 275]),
    region('fin-right', 'M240 230L280 300L235 285Z', 3, [250, 275]),
    region('body', 'M163 140L237 140C245 200 245 250 240 300L160 300C155 250 155 200 163 140Z', 2, [178, 240]),
    region('nose', 'M163 142C170 100 185 75 200 60C215 75 230 100 237 142Z', 3, [200, 115]),
    region('window-ring', circle(200, 185, 28), 7, [200, 163]),
    region('window', circle(200, 185, 18), 4, [200, 186]),
    region('center-fin', rect(194, 250, 12, 55, 6), 3, [200, 278]),
  ],
};

// ---------- Ocean ----------
const stripyFish: ColoringImage = {
  id: 'ocean-stripy-fish',
  title: 'Stripy Fish',
  category: 'ocean',
  difficulty: 'easy',
  palette: ['#8ECAE6', '#FF9F1C', '#FFFFFF', '#06D6A0', '#F4E285', '#2E2A3B', '#DDF3FF', '#FFB703'],
  regions: [
    region('water', BG, 1, [200, 40]),
    region('sand', 'M0 350Q100 335 200 350T400 345L400 400L0 400Z', 5, [200, 378]),
    region('seaweed-left', 'M50 360Q30 300 55 260Q75 220 55 180Q85 220 70 265Q55 305 75 360Z', 4, [60, 300]),
    region('seaweed-right', 'M340 355Q325 300 345 270Q360 240 348 210Q378 245 365 280Q352 310 365 355Z', 4, [350, 300]),
    region('tail', 'M265 200L335 145Q320 200 335 255Z', 2, [312, 200]),
    region('fin-top', 'M165 140Q210 90 255 145Z', 2, [210, 128]),
    region('fin-bottom', 'M190 255Q215 290 240 255Z', 2, [215, 266]),
    region('body', ellipse(200, 200, 90, 62), 2, [180, 160]),
    region('stripe-1', ellipse(215, 200, 12, 50), 3, [215, 180]),
    region('stripe-2', ellipse(250, 200, 10, 38), 3, [250, 190]),
    region('eye', circle(150, 185, 16), 3, [158, 176]),
    region('pupil', circle(146, 185, 7), 6, [146, 186]),
    region('side-fin', ellipse(185, 222, 18, 10, -25), 8, [185, 223]),
    region('bubble-1', circle(110, 120, 10), 7, [110, 121]),
    region('bubble-2', circle(90, 90, 7), 7, [90, 91]),
    region('bubble-3', circle(120, 62, 12), 7, [120, 63]),
    region('bubble-4', circle(300, 90, 8), 7, [300, 91]),
  ],
  details: ['M112 205Q120 212 128 206'],
};

// ---------- Patterns & Holidays ----------
const partyBalloons: ColoringImage = {
  id: 'patterns-party-balloons',
  title: 'Party Balloons',
  category: 'patterns',
  difficulty: 'easy',
  palette: ['#FFF1E6', '#EF476F', '#FFD166', '#06D6A0', '#118AB2', '#9B5DE5', '#FFFFFF'],
  regions: [
    region('bg', BG, 1, [200, 220]),
    region('confetti-star-1', star(60, 250, 13, 5.5), 6, [60, 251]),
    region('confetti-star-2', star(340, 250, 13, 5.5), 4, [340, 251]),
    region('confetti-dot-1', circle(70, 330, 9), 3, [70, 331]),
    region('confetti-dot-2', circle(330, 330, 9), 2, [330, 331]),
    region('confetti-diamond-1', poly([[40, 158], [50, 172], [40, 186], [30, 172]]), 5, [40, 173]),
    region('confetti-diamond-2', poly([[362, 176], [372, 190], [362, 204], [352, 190]]), 6, [362, 191]),
    region('balloon-left', ellipse(120, 120, 48, 58), 2, [130, 135]),
    region('balloon-right', ellipse(285, 125, 48, 58), 3, [295, 140]),
    region('balloon-middle', ellipse(200, 95, 50, 60), 4, [210, 110]),
    region('knot-left', poly([[120, 178], [128, 190], [112, 190]]), 2, [120, 186]),
    region('knot-right', poly([[285, 183], [293, 195], [277, 195]]), 3, [285, 191]),
    region('knot-middle', poly([[200, 155], [208, 167], [192, 167]]), 4, [200, 163]),
    region('shine-left', ellipse(102, 98, 8, 15, 20), 7, [102, 98]),
    region('shine-right', ellipse(267, 103, 8, 15, 20), 7, [267, 103]),
    region('shine-middle', ellipse(181, 72, 8, 15, 20), 7, [181, 72]),
    region('gift-box', rect(140, 290, 120, 90, 6), 5, [165, 340]),
    region('gift-lid', rect(130, 270, 140, 26, 6), 6, [160, 283]),
    region('ribbon', rect(190, 270, 20, 110), 3, [200, 340]),
    region('bow-left', ellipse(180, 258, 20, 11, -20), 2, [176, 258]),
    region('bow-right', ellipse(220, 258, 20, 11, 20), 2, [224, 258]),
    region('bow-knot', circle(200, 262, 8), 2, [200, 263]),
  ],
  details: [
    'M120 190Q130 235 185 270',
    'M200 167Q195 215 200 250',
    'M285 195Q275 235 215 270',
  ],
};

export const IMAGES: ColoringImage[] = [
  happyCat,
  sunMandala(),
  blobBuddy,
  sunflower(),
  cupcake(),
  littleCar,
  dreamCastle,
  rocketTrip,
  stripyFish,
  partyBalloons,
];

export const IMAGE_BY_ID: Record<string, ColoringImage> = Object.fromEntries(
  IMAGES.map((img) => [img.id, img]),
);

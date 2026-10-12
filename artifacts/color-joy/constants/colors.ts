/**
 * Semantic design tokens for Color Joy.
 * Bright, warm and playful: cream paper background, coral primary,
 * sunny yellow and teal accents, soft ink for text and outlines.
 */

const colors = {
  light: {
    text: '#2E2A3B',
    tint: '#FF5C8A',

    background: '#FFF7EC',
    foreground: '#2E2A3B',

    card: '#FFFFFF',
    cardForeground: '#2E2A3B',

    primary: '#FF5C8A',
    primaryForeground: '#FFFFFF',

    secondary: '#FFE8A3',
    secondaryForeground: '#5A4300',

    muted: '#F6ECDD',
    mutedForeground: '#8A8197',

    accent: '#2EC4B6',
    accentForeground: '#FFFFFF',

    destructive: '#FF4D4F',
    destructiveForeground: '#FFFFFF',

    border: '#EFE2CE',
    input: '#EFE2CE',

    // Playful extras
    sun: '#FFC93C',
    violet: '#7B61FF',
    sky: '#5BC0EB',
    leaf: '#4CC96B',
    ink: '#2E2A3B',
    paper: '#FFFFFF',
    shadow: '#C9A97A',
    gold: '#FFB800',
    locked: '#D8D0C4',
    /** Unfilled regions that match the selected number. */
    highlight: '#D9D2EA',
    /** Number labels on unfilled regions. */
    label: '#6E6880',
    /** Soft background for the mistakes badge once a mistake happened. */
    errorSoft: '#FFE3E3',
    /** Floating paint blobs on the title screen. */
    blobPink: '#FFD3E0',
    blobMint: '#CFF5EE',
    blobSun: '#FFEAB0',
    blobLilac: '#E1DBFF',
  },

  radius: 20,
};

export default colors;

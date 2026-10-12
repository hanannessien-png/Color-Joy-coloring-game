import type { Category } from '@/src/types';

export const CATEGORIES: Category[] = [
  { id: 'animals', label: 'Animals', icon: 'paw', color: '#FF9F43' },
  { id: 'mandala', label: 'Mandala', icon: 'flower-tulip-outline', color: '#A66CFF' },
  { id: 'cartoon', label: 'Characters', icon: 'emoticon-happy-outline', color: '#FF5C8A' },
  { id: 'nature', label: 'Nature', icon: 'flower', color: '#4CC96B' },
  { id: 'food', label: 'Sweets', icon: 'cupcake', color: '#FF7AB6' },
  { id: 'vehicles', label: 'Vehicles', icon: 'car-side', color: '#3FA7F5' },
  { id: 'fantasy', label: 'Fantasy', icon: 'castle', color: '#C86BFA' },
  { id: 'space', label: 'Space', icon: 'rocket-launch', color: '#5B6CFF' },
  { id: 'ocean', label: 'Ocean', icon: 'fish', color: '#22C1C3' },
  { id: 'patterns', label: 'Holidays', icon: 'gift-outline', color: '#FFB627' },
];

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<
  Category['id'],
  Category
>;

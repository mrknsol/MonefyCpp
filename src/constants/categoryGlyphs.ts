/** Emoji fallback for WPF-style icon names (no extra icon font dependency). */
const GLYPHS: Record<string, string> = {
  Dog: '🐕',
  Phone: '📱',
  Restaurant: '🍽️',
  Car: '🚕',
  ClothesHanger: '👔',
  Beverages: '🥤',
  Transportation: '🚌',
  Home: '🏠',
  OralHygiene: '🧴',
  YoutubeSports: '⚽',
  Gift: '🎁',
  HealthPotion: '💊',
  CarRepair: '🔧',
  Marketplace: '🛒',
  Custom: '✨',
};

export function categoryGlyph(iconName: string): string {
  return GLYPHS[iconName] ?? '📌';
}

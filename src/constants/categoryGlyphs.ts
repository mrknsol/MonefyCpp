import type { AppIconName } from '../components/AppIcon';

const ICONS: Record<string, AppIconName> = {
  Dog: 'pets',
  Phone: 'phone',
  Restaurant: 'restaurant',
  Car: 'taxi',
  ClothesHanger: 'clothes',
  Beverages: 'beverages',
  Transportation: 'transport',
  Home: 'home',
  OralHygiene: 'hygiene',
  YoutubeSports: 'sport',
  Gift: 'gift',
  HealthPotion: 'health',
  CarRepair: 'carRepair',
  Marketplace: 'market',
  Custom: 'custom',
  TopUp: 'topup',
  Transfer: 'transfer',
};

export function categoryIconName(iconName: string): AppIconName {
  return ICONS[iconName] ?? 'custom';
}

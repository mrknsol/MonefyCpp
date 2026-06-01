import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppMessage = {
  id: string;
  titleKey: string;
  bodyKey: string;
  date: string;
  read: boolean;
  type: 'info' | 'security' | 'promo';
};

const STORAGE_KEY = 'app_messages';

const DEFAULT_MESSAGES: Omit<AppMessage, 'read'>[] = [
  {
    id: 'welcome',
    titleKey: 'msgWelcomeTitle',
    bodyKey: 'msgWelcomeBody',
    date: '2026-05-01',
    type: 'info',
  },
  {
    id: 'security-pin',
    titleKey: 'msgPinTitle',
    bodyKey: 'msgPinBody',
    date: '2026-05-15',
    type: 'security',
  },
  {
    id: 'rates-update',
    titleKey: 'msgRatesTitle',
    bodyKey: 'msgRatesBody',
    date: '2026-05-28',
    type: 'info',
  },
];

export async function loadMessages(userId: string): Promise<AppMessage[]> {
  const key = `${STORAGE_KEY}_${userId}`;
  const raw = await AsyncStorage.getItem(key);
  if (raw) {
    return JSON.parse(raw) as AppMessage[];
  }
  const seeded = DEFAULT_MESSAGES.map(m => ({ ...m, read: false }));
  await AsyncStorage.setItem(key, JSON.stringify(seeded));
  return seeded;
}

export async function markMessageRead(userId: string, messageId: string): Promise<void> {
  const messages = await loadMessages(userId);
  const next = messages.map(m =>
    m.id === messageId ? { ...m, read: true } : m,
  );
  await AsyncStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(next));
}

export async function unreadCount(userId: string): Promise<number> {
  const messages = await loadMessages(userId);
  return messages.filter(m => !m.read).length;
}

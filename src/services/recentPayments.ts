import AsyncStorage from '@react-native-async-storage/async-storage';

import type { PaymentActionId } from '../utils/paymentActions';

const STORAGE_PREFIX = 'recent_payments';
const MAX_ITEMS = 5;

export type RecentPayment = {
  id: PaymentActionId;
  usedAt: string;
};

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}_${userId}`;
}

export async function recordRecentPayment(
  userId: string,
  id: PaymentActionId,
): Promise<void> {
  const key = storageKey(userId);
  const raw = await AsyncStorage.getItem(key);
  let list: RecentPayment[] = raw ? (JSON.parse(raw) as RecentPayment[]) : [];
  list = list.filter(item => item.id !== id);
  list.unshift({ id, usedAt: new Date().toISOString() });
  await AsyncStorage.setItem(key, JSON.stringify(list.slice(0, MAX_ITEMS)));
}

export async function getRecentPayments(userId: string): Promise<RecentPayment[]> {
  const raw = await AsyncStorage.getItem(storageKey(userId));
  return raw ? (JSON.parse(raw) as RecentPayment[]) : [];
}

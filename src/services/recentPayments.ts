import AsyncStorage from '@react-native-async-storage/async-storage';

import { isServicePaymentId, type ServicePaymentId } from '../constants/servicePayments';

const STORAGE_PREFIX = 'recent_payments';
const MAX_ITEMS = 5;

export type RecentPayment = {
  kind: 'service';
  id: ServicePaymentId;
  usedAt: string;
} | {
  kind: 'custom';
  id: string;
  usedAt: string;
};

export type RecentPaymentTarget =
  | { kind: 'service'; id: ServicePaymentId }
  | { kind: 'custom'; id: string };

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}_${userId}`;
}

export async function recordRecentPayment(
  userId: string,
  target: RecentPaymentTarget,
): Promise<void> {
  const key = storageKey(userId);
  const raw = await AsyncStorage.getItem(key);
  let list = raw ? normalizeRecentPayments(JSON.parse(raw) as unknown[]) : [];
  list = list.filter(item => item.kind !== target.kind || item.id !== target.id);
  list.unshift({ ...target, usedAt: new Date().toISOString() });
  await AsyncStorage.setItem(key, JSON.stringify(list.slice(0, MAX_ITEMS)));
}

export async function getRecentPayments(userId: string): Promise<RecentPayment[]> {
  const raw = await AsyncStorage.getItem(storageKey(userId));
  return raw ? normalizeRecentPayments(JSON.parse(raw) as unknown[]) : [];
}

function normalizeRecentPayments(rawList: unknown[]): RecentPayment[] {
  return rawList.flatMap<RecentPayment>(item => {
    if (!item || typeof item !== 'object') {
      return [];
    }
    const candidate = item as { kind?: unknown; id?: unknown; usedAt?: unknown };
    const usedAt = typeof candidate.usedAt === 'string' ? candidate.usedAt : new Date().toISOString();

    if (candidate.kind === 'custom' && typeof candidate.id === 'string') {
      return [{ kind: 'custom', id: candidate.id, usedAt }];
    }
    if (candidate.kind === 'service' && typeof candidate.id === 'string' && isServicePaymentId(candidate.id)) {
      return [{ kind: 'service', id: candidate.id, usedAt }];
    }
    if (typeof candidate.id === 'string' && isServicePaymentId(candidate.id)) {
      return [{ kind: 'service', id: candidate.id, usedAt }];
    }
    return [];
  });
}

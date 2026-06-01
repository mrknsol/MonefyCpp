import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@monefy/savedAccounts';

export type SavedAccount = {
  id: string;
  email: string;
  name: string;
  token: string;
  phone?: string;
  lastUsedAt: string;
};

export async function loadSavedAccounts(): Promise<SavedAccount[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const list = JSON.parse(raw) as SavedAccount[];
    return list.sort(
      (a, b) => new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime(),
    );
  } catch {
    return [];
  }
}

export async function upsertSavedAccount(
  account: Omit<SavedAccount, 'lastUsedAt'> & { lastUsedAt?: string },
): Promise<void> {
  const list = await loadSavedAccounts();
  const next: SavedAccount = {
    ...account,
    lastUsedAt: account.lastUsedAt ?? new Date().toISOString(),
  };
  const filtered = list.filter(item => item.id !== account.id);
  filtered.unshift(next);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, 8)));
}

export async function removeSavedAccount(id: string): Promise<void> {
  const list = await loadSavedAccounts();
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(list.filter(item => item.id !== id)),
  );
}

export async function getSavedAccount(id: string): Promise<SavedAccount | null> {
  const list = await loadSavedAccounts();
  return list.find(item => item.id === id) ?? null;
}

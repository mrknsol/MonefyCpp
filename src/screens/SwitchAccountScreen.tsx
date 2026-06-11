import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '../components/AnimatedPressable';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ScreenLoading } from '../components/ScreenLoading';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useAuth } from '../context/AuthContext';
import { loadSavedAccounts, type SavedAccount } from '../services/savedAccounts';
import { cardShadow, radii, space } from '../theme/tokens';

type Props = {
  onAnotherAccount: () => void;
};

export function SwitchAccountScreen({ onAnotherAccount }: Props) {
  const { colors, t } = useAppPreferences();
  const { loginWithSavedAccount } = useAuth();
  const insets = useSafeAreaInsets();
  const [accounts, setAccounts] = useState<SavedAccount[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(true);

  const reload = useCallback(async () => {
    setIsLoadingList(true);
    try {
      setAccounts(await loadSavedAccounts());
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const pickAccount = async (account: SavedAccount) => {
    setLoadingId(account.id);
    try {
      await loginWithSavedAccount(account.id);
    } catch (error) {
      Alert.alert(
        t('error'),
        error instanceof Error ? error.message : t('switchAccountFailed'),
      );
      await reload();
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top + space.lg },
      ]}>
      <Text style={[styles.title, { color: colors.text }]}>{t('switchAccountPick')}</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        {t('switchAccountSubtitle')}
      </Text>

      <ScrollView
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + space.xl },
        ]}
        showsVerticalScrollIndicator={false}>
        {isLoadingList ? (
          <ScreenLoading minHeight={120} />
        ) : accounts.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {t('switchAccountEmpty')}
            </Text>
          </View>
        ) : (
          accounts.map(account => (
            <AnimatedPressable
              key={account.id}
              variant="soft"
              disabled={loadingId !== null}
              onPress={() => pickAccount(account)}
              style={[
                styles.accountRow,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: loadingId && loadingId !== account.id ? 0.6 : 1,
                },
                cardShadow(false),
              ]}>
              <View style={[styles.avatar, { backgroundColor: colors.brandSoft }]}>
                <Text style={[styles.avatarText, { color: colors.brand }]}>
                  {account.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.accountMid}>
                <Text style={[styles.accountName, { color: colors.text }]} numberOfLines={1}>
                  {account.name}
                </Text>
                <Text style={[styles.accountEmail, { color: colors.textMuted }]} numberOfLines={1}>
                  {account.email}
                </Text>
              </View>
              {loadingId === account.id ? (
                <LoadingSpinner size="small" color={colors.brand} />
              ) : (
                <Text style={[styles.chev, { color: colors.textMuted }]}>›</Text>
              )}
            </AnimatedPressable>
          ))
        )}

        <AnimatedPressable
          variant="primary"
          style={[styles.anotherBtn, { backgroundColor: colors.brand }]}
          onPress={onAnotherAccount}>
          <Text style={[styles.anotherBtnText, { color: colors.inverseText }]}>
            {t('switchAccountAnother')}
          </Text>
        </AnimatedPressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: space.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: space.sm,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: space.lg,
    lineHeight: 20,
  },
  list: { gap: space.sm },
  emptyCard: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: space.lg,
    alignItems: 'center',
  },
  emptyText: { fontSize: 14, textAlign: 'center' },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: space.md,
    gap: space.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '800' },
  accountMid: { flex: 1 },
  accountName: { fontSize: 16, fontWeight: '700' },
  accountEmail: { fontSize: 13, marginTop: 2 },
  chev: { fontSize: 24, fontWeight: '300' },
  anotherBtn: {
    marginTop: space.md,
    borderRadius: radii.lg,
    paddingVertical: space.md,
    alignItems: 'center',
  },
  anotherBtnText: { fontSize: 16, fontWeight: '800' },
});

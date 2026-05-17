import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppPreferences } from '../context/AppPreferencesContext';
import { MonefyCore } from '../native/monefyCore';
import { cardShadow, radii, space } from '../theme/tokens';

export function StatisticsScreen() {
  const { colors, t } = useAppPreferences();
  const insets = useSafeAreaInsets();
  const [total, setTotal] = useState(0);

  useFocusEffect(
    useCallback(() => {
      MonefyCore.getTotalBalance()
        .then(setTotal)
        .catch(() => setTotal(0));
    }, []),
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top + space.lg },
      ]}>
      <Text style={[styles.title, { color: colors.text }]}>{t('statisticsTitle')}</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        {t('statisticsSubtitle')}
      </Text>

      <View
        style={[
          styles.statCard,
          { backgroundColor: colors.bankCardStart },
          cardShadow(true),
        ]}>
        <Text style={[styles.statLabel, { color: 'rgba(255,255,255,0.7)' }]}>
          {t('totalBalance').toUpperCase()}
        </Text>
        <Text style={[styles.statValue, { color: colors.onBankCard }]}>
          {total.toFixed(2)} ₽
        </Text>
      </View>

      <View
        style={[
          styles.comingSoon,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}>
        <Text style={[styles.comingTxt, { color: colors.textMuted }]}>
          📊 {t('statisticsSubtitle')}
        </Text>
      </View>
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
    fontWeight: '500',
    marginBottom: space.xl,
  },
  statCard: {
    borderRadius: radii.xl,
    padding: space.xl,
    marginBottom: space.lg,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: space.sm,
  },
  statValue: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  comingSoon: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: space.xl,
    alignItems: 'center',
  },
  comingTxt: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
});

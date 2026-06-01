import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '../components/AnimatedPressable';
import { SERVICE_PAYMENTS } from '../constants/servicePayments';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useAuth } from '../context/AuthContext';
import { recordRecentPayment } from '../services/recentPayments';
import { cardShadow, radii, space } from '../theme/tokens';
import {
  navigatePayment,
  PAYMENT_ACTION_META,
  type PaymentActionId,
} from '../utils/paymentActions';

const PAYMENT_ITEMS: PaymentActionId[] = ['transfer', 'topup', 'expense'];

export function PaymentsScreen() {
  const { colors, t } = useAppPreferences();
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions?.({ headerShown: false });
    }, [navigation]),
  );

  const openPayment = async (id: PaymentActionId) => {
    if (user?.id) {
      await recordRecentPayment(user.id, id);
    }
    navigatePayment(navigation, id);
  };

  const openServicePayment = (categoryId: string, descriptionKey: string) => {
    navigation.navigate('AddOperation', {
      type: 'expense',
      categoryId,
      description: t(descriptionKey),
    });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: insets.top + space.lg,
        paddingBottom: insets.bottom + space.xl,
        paddingHorizontal: space.lg,
      }}>
      <Text style={[styles.title, { color: colors.text }]}>{t('paymentsTitle')}</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        {t('paymentsSubtitle')}
      </Text>

      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
        {t('paymentsMainSection').toUpperCase()}
      </Text>
      <View style={styles.mainGrid}>
        {PAYMENT_ITEMS.map(id => {
          const meta = PAYMENT_ACTION_META[id];
          return (
            <AnimatedPressable
              key={id}
              variant="tile"
              onPress={() => openPayment(id)}
              style={[
                styles.mainTile,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
                cardShadow(false),
              ]}>
              <Text style={styles.mainIcon}>{meta.icon}</Text>
              <Text style={[styles.mainLabel, { color: colors.text }]}>{t(meta.labelKey)}</Text>
            </AnimatedPressable>
          );
        })}
      </View>

      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
        {t('paymentsServicesSection').toUpperCase()}
      </Text>
      <View style={styles.serviceGrid}>
        {SERVICE_PAYMENTS.map(item => (
          <AnimatedPressable
            key={item.id}
            variant="tile"
            onPress={() => openServicePayment(item.categoryId, item.descriptionKey)}
            style={[
              styles.serviceTile,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
              cardShadow(false),
            ]}>
            <Text style={styles.serviceIcon}>{item.icon}</Text>
            <Text style={[styles.serviceLabel, { color: colors.text }]} numberOfLines={2}>
              {t(item.labelKey)}
            </Text>
          </AnimatedPressable>
        ))}
      </View>

      <AnimatedPressable
        variant="tile"
        onPress={() => navigation.navigate('Loan')}
        style={[
          styles.loanTile,
          {
            backgroundColor: colors.bankCardStart,
            borderColor: colors.border,
          },
          cardShadow(true),
        ]}>
        <Text style={styles.loanIcon}>🏦</Text>
        <View style={styles.loanMid}>
          <Text style={[styles.loanLabel, { color: colors.onBankCard }]}>{t('loanTitle')}</Text>
          <Text style={[styles.loanHint, { color: 'rgba(255,255,255,0.75)' }]}>
            {t('loanTileHint')}
          </Text>
        </View>
        <Text style={[styles.loanChev, { color: colors.onBankCard }]}>›</Text>
      </AnimatedPressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: space.sm,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: space.lg,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: space.sm,
  },
  mainGrid: {
    flexDirection: 'row',
    gap: space.sm,
    marginBottom: space.xl,
  },
  mainTile: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingVertical: space.md,
    alignItems: 'center',
  },
  mainIcon: { fontSize: 28, marginBottom: space.xs },
  mainLabel: { fontSize: 12, fontWeight: '800', textAlign: 'center' },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginBottom: space.xl,
  },
  serviceTile: {
    width: '31%',
    minWidth: 100,
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingVertical: space.md,
    paddingHorizontal: space.xs,
    alignItems: 'center',
  },
  serviceIcon: { fontSize: 26, marginBottom: space.xs },
  serviceLabel: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 14,
  },
  loanTile: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: space.lg,
    gap: space.md,
  },
  loanIcon: { fontSize: 32 },
  loanMid: { flex: 1 },
  loanLabel: { fontSize: 18, fontWeight: '800' },
  loanHint: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  loanChev: { fontSize: 28, fontWeight: '300' },
});

import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '../components/AnimatedPressable';
import { AppIcon } from '../components/AppIcon';
import { EXPENSE_CATEGORIES } from '../constants/categories';
import { SERVICE_PAYMENTS, type ServicePayment } from '../constants/servicePayments';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useAuth } from '../context/AuthContext';
import { MonefyCore } from '../native/monefyCore';
import { recordRecentPayment } from '../services/recentPayments';
import { cardShadow, radii, space } from '../theme/tokens';
import type { CustomCategory } from '../types';
import { loadCustomCategories, mergeUiCategories } from '../utils/categories';

export function PaymentsScreen() {
  const { colors, t, locale } = useAppPreferences();
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);

  const reloadCustomCategories = useCallback(async () => {
    setCustomCategories(await loadCustomCategories());
  }, []);

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions?.({ headerShown: false });
      reloadCustomCategories();
    }, [navigation, reloadCustomCategories]),
  );

  const openServicePayment = async (item: ServicePayment) => {
    if (user?.id) {
      await recordRecentPayment(user.id, { kind: 'service', id: item.id });
    }
    navigation.navigate('AddOperation', {
      type: 'expense',
      categoryId: item.categoryId,
      description: t(item.descriptionKey),
    });
  };

  const openCustomCategoryPayment = async () => {
    const name = customCategoryName.trim();
    if (!name) {
      Alert.alert(t('error'), t('categoryName'));
      return;
    }

    setIsCreatingCustom(true);
    try {
      const customCategories = await loadCustomCategories();
      const allCategories = mergeUiCategories(customCategories, locale);
      const alreadyExists = allCategories.find(
        category => category.label.trim().toLowerCase() === name.toLowerCase(),
      );

      if (alreadyExists) {
        if (user?.id && alreadyExists.isCustom) {
          await recordRecentPayment(user.id, { kind: 'custom', id: alreadyExists.id });
        }
        setCustomCategoryName('');
        navigation.navigate('AddOperation', {
          type: 'expense',
          categoryId: alreadyExists.id,
          description: name,
        });
        return;
      }

      const slugBase = name
        .toLowerCase()
        .replace(/[^a-z0-9а-яё]+/gi, '_')
        .replace(/^_|_$/g, '')
        .slice(0, 24);
      const id = (slugBase || 'cat') + '_' + String(Date.now()).slice(-6);
      const builtinIds = new Set(EXPENSE_CATEGORIES.map(category => category.id));

      if (builtinIds.has(id)) {
        Alert.alert(t('error'), t('duplicateId'));
        return;
      }

      await MonefyCore.addCustomCategoryJson(
        JSON.stringify({
          id,
          label: name,
          iconName: 'Custom',
          iconColor: colors.brand,
        }),
      );

      setCustomCategories(prev => [
        ...prev,
        {
          id,
          label: name,
          iconName: 'Custom',
          iconColor: colors.brand,
        },
      ]);
      if (user?.id) {
        await recordRecentPayment(user.id, { kind: 'custom', id });
      }
      setCustomCategoryName('');
      navigation.navigate('AddOperation', {
        type: 'expense',
        categoryId: id,
        description: name,
      });
    } catch (e: unknown) {
      Alert.alert(t('error'), String(e));
    } finally {
      setIsCreatingCustom(false);
    }
  };

  const openSavedCustomCategory = async (item: CustomCategory) => {
    if (user?.id) {
      await recordRecentPayment(user.id, { kind: 'custom', id: item.id });
    }
    navigation.navigate('AddOperation', {
      type: 'expense',
      categoryId: item.id,
      description: item.label,
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
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>{t('paymentsSubtitle')}</Text>

      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
        {t('paymentsServicesSection').toUpperCase()}
      </Text>
      <View style={styles.serviceGrid}>
        {SERVICE_PAYMENTS.map(item => (
          <AnimatedPressable
            key={item.id}
            variant="tile"
            onPress={() => openServicePayment(item)}
            style={[
              styles.serviceTile,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
              cardShadow(false),
            ]}>
            <AppIcon
              name={item.iconName}
              color={colors.brand}
              backgroundColor={colors.chip}
              size={38}
              style={styles.serviceIcon}
            />
            <Text style={[styles.serviceLabel, { color: colors.text }]} numberOfLines={2}>
              {t(item.labelKey)}
            </Text>
          </AnimatedPressable>
        ))}
      </View>

      {customCategories.length > 0 ? (
        <>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            {t('customPaymentsSection').toUpperCase()}
          </Text>
          <View style={styles.serviceGrid}>
            {customCategories.map(item => (
              <AnimatedPressable
                key={item.id}
                variant="tile"
                onPress={() => openSavedCustomCategory(item)}
                style={[
                  styles.serviceTile,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                  cardShadow(false),
                ]}>
                <AppIcon
                  name="custom"
                  color={item.iconColor}
                  backgroundColor={colors.chip}
                  size={38}
                  style={styles.serviceIcon}
                />
                <Text style={[styles.serviceLabel, { color: colors.text }]} numberOfLines={2}>
                  {item.label}
                </Text>
              </AnimatedPressable>
            ))}
          </View>
        </>
      ) : null}

      <View
        style={[
          styles.customPaymentBox,
          { backgroundColor: colors.card, borderColor: colors.border },
          cardShadow(false),
        ]}>
        <View style={styles.customPaymentHeader}>
          <AppIcon
            name="custom"
            color={colors.brand}
            backgroundColor={colors.brandSoft}
            size={38}
          />
          <View style={styles.customPaymentText}>
            <Text style={[styles.customPaymentTitle, { color: colors.text }]}>
              {t('addCategoryBtn')}
            </Text>
            <Text style={[styles.customPaymentHint, { color: colors.textMuted }]}>
              {t('categoryName')}
            </Text>
          </View>
        </View>
        <View style={styles.customPaymentForm}>
          <TextInput
            style={[
              styles.customPaymentInput,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colors.background,
              },
            ]}
            value={customCategoryName}
            onChangeText={setCustomCategoryName}
            placeholder={t('categoryName')}
            placeholderTextColor={colors.textMuted}
            returnKeyType="done"
            onSubmitEditing={openCustomCategoryPayment}
          />
          <AnimatedPressable
            variant="primary"
            disabled={isCreatingCustom}
            style={[
              styles.customPaymentButton,
              { backgroundColor: isCreatingCustom ? colors.textMuted : colors.brand },
            ]}
            onPress={openCustomCategoryPayment}>
            <Text style={[styles.customPaymentButtonText, { color: colors.inverseText }]}>
              {isCreatingCustom ? t('saving') : t('save')}
            </Text>
          </AnimatedPressable>
        </View>
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
        <AppIcon name="loan" color={colors.gold} backgroundColor="rgba(255,255,255,0.14)" />
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
  serviceIcon: { marginBottom: space.xs },
  serviceLabel: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 14,
  },
  customPaymentBox: {
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: space.lg,
    marginBottom: space.xl,
  },
  customPaymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginBottom: space.md,
  },
  customPaymentText: { flex: 1 },
  customPaymentTitle: { fontSize: 16, fontWeight: '800' },
  customPaymentHint: { fontSize: 12, marginTop: 3, fontWeight: '600' },
  customPaymentForm: { gap: space.sm },
  customPaymentInput: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    fontSize: 15,
  },
  customPaymentButton: {
    borderRadius: radii.md,
    paddingVertical: space.sm,
    alignItems: 'center',
  },
  customPaymentButtonText: { fontSize: 14, fontWeight: '800' },
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

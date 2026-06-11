import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AnimatedPressable } from '../components/AnimatedPressable';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ScreenLoading } from '../components/ScreenLoading';
import { AppIcon } from '../components/AppIcon';
import { categoryIconName } from '../constants/categoryGlyphs';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useScreenTitle } from '../hooks/useScreenTitle';
import { resolveCategoryLabel } from '../i18n/translations';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { MonefyCore } from '../native/monefyCore';
import type { CustomCategory } from '../types';
import { loadCustomCategories } from '../utils/categories';

type Props = NativeStackScreenProps<RootStackParamList, 'Pay'>;

export function PayScreen({ navigation, route }: Props) {
  const { date, amount, description, category, iconName, iconColor } =
    route.params;
  const { colors, t, locale } = useAppPreferences();
  const [cards, setCards] = useState<{ number: string; balance: number }[]>(
    [],
  );
  const [customCats, setCustomCats] = useState<CustomCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [payingCard, setPayingCard] = useState<string | null>(null);

  useScreenTitle('navPay');

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const j = await MonefyCore.getCardsJson();
        setCards(JSON.parse(j) as { number: string; balance: number }[]);
      } catch {
        setCards([]);
      }
      setCustomCats(await loadCustomCategories());
      setIsLoading(false);
    })();
  }, []);

  const pay = async (cardNumber: string) => {
    setPayingCard(cardNumber);
    const payload = JSON.stringify({
      amount,
      description,
      category,
      iconName,
      iconColor,
      date,
      paymentCard: cardNumber,
    });
    try {
      await MonefyCore.addExpenseJson(payload);
      navigation.popToTop();
    } catch (e: unknown) {
      Alert.alert(t('error'), String(e));
    } finally {
      setPayingCard(null);
    }
  };

  const catTitle = resolveCategoryLabel(category, locale, customCats);
  const resolvedIconName = categoryIconName(iconName || 'Custom');

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.wrap}>
      <Text style={[styles.head, { color: colors.text }]}>{t('pickDebitCard')}</Text>
      <View style={styles.summaryRow}>
        <AppIcon
          name={resolvedIconName}
          color={iconColor}
          backgroundColor={colors.chip}
          size={34}
        />
        <Text style={[styles.sum, { color: colors.textSecondary }]}>
          {amount.toFixed(2)} · {catTitle}
        </Text>
      </View>
      {isLoading ? (
        <ScreenLoading minHeight={120} />
      ) : (
        cards.map(c => (
        <AnimatedPressable
          key={c.number}
          variant="tile"
          disabled={payingCard !== null}
          style={[
            styles.row,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={() => pay(c.number)}>
          <Text style={[styles.num, { color: colors.text }]}>{c.number}</Text>
          {payingCard === c.number ? (
            <LoadingSpinner size="small" color={colors.brand} />
          ) : (
            <Text style={[styles.bal, { color: colors.income }]}>
              {c.balance.toFixed(2)}
            </Text>
          )}
        </AnimatedPressable>
      )))}
      {!isLoading && cards.length === 0 ? (
        <Text style={[styles.warn, { color: colors.danger }]}>{t('noCardsWarn')}</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16 },
  head: { fontSize: 17, fontWeight: '600', marginBottom: 8 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  sum: { fontSize: 15, flex: 1 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  num: { fontWeight: '600', fontSize: 16 },
  bal: { fontWeight: '700' },
  warn: { marginTop: 8 },
});

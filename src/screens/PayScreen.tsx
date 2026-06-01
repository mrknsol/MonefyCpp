import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';

import { AnimatedPressable } from '../components/AnimatedPressable';
import { categoryGlyph } from '../constants/categoryGlyphs';
import { useAppPreferences } from '../context/AppPreferencesContext';
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

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('navPay') });
  }, [navigation, t]);

  useEffect(() => {
    (async () => {
      try {
        const j = await MonefyCore.getCardsJson();
        setCards(JSON.parse(j) as { number: string; balance: number }[]);
      } catch {
        setCards([]);
      }
      setCustomCats(await loadCustomCategories());
    })();
  }, []);

  const pay = async (cardNumber: string) => {
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
    }
  };

  const catTitle = resolveCategoryLabel(category, locale, customCats);
  const glyph = categoryGlyph(iconName || 'Custom');

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.wrap}>
      <Text style={[styles.head, { color: colors.text }]}>{t('pickDebitCard')}</Text>
      <Text style={[styles.sum, { color: colors.textSecondary }]}>
        {glyph} {amount.toFixed(2)} · {catTitle}
      </Text>
      {cards.map(c => (
        <AnimatedPressable
          key={c.number}
          variant="tile"
          style={[
            styles.row,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={() => pay(c.number)}>
          <Text style={[styles.num, { color: colors.text }]}>{c.number}</Text>
          <Text style={[styles.bal, { color: colors.income }]}>
            {c.balance.toFixed(2)}
          </Text>
        </AnimatedPressable>
      ))}
      {cards.length === 0 ? (
        <Text style={[styles.warn, { color: colors.danger }]}>{t('noCardsWarn')}</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16 },
  head: { fontSize: 17, fontWeight: '600', marginBottom: 8 },
  sum: { marginBottom: 16, fontSize: 15 },
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

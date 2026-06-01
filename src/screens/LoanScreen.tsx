import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AnimatedPressable } from '../components/AnimatedPressable';
import { TOP_UP_CATEGORY } from '../constants/banking';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useSecurity } from '../context/SecurityContext';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { MonefyCore, parseJson } from '../native/monefyCore';
import type { Card } from '../types';
import { cardShadow, radii, space } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Loan'>;

const TERMS = [6, 12, 24, 36] as const;

export function LoanScreen({ navigation }: Props) {
  const { colors, t } = useAppPreferences();
  const { requirePaymentAuth } = useSecurity();
  const [amount, setAmount] = useState('');
  const [term, setTerm] = useState<number>(12);
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(false);

  const rate = 14.9;
  const amt = parseFloat(amount.replace(',', '.'));
  const monthly =
    Number.isFinite(amt) && amt > 0
      ? (amt * (1 + rate / 100)) / term
      : 0;

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('loanTitle') });
  }, [navigation, t]);

  useEffect(() => {
    MonefyCore.getCardsJson()
      .then(json => {
        const data = parseJson<Card[]>(json);
        setCards(data);
        setSelectedCard(data[0] ?? null);
      })
      .catch(() => setCards([]));
  }, []);

  const apply = () => {
    if (!Number.isFinite(amt) || amt <= 0) {
      Alert.alert(t('error'), t('enterValidAmount'));
      return;
    }
    if (!selectedCard) {
      Alert.alert(t('error'), t('selectCard'));
      return;
    }

    requirePaymentAuth(async () => {
      setLoading(true);
      try {
        const payload = JSON.stringify({
          amount: Math.abs(amt),
          description: t('loanCreditDesc', { term: String(term) }),
          paymentCard: selectedCard.number,
          category: TOP_UP_CATEGORY.id,
          iconName: TOP_UP_CATEGORY.iconName,
          iconColor: TOP_UP_CATEGORY.iconColor,
          date: new Date().toISOString().split('T')[0],
        });
        await MonefyCore.addIncomeJson(payload);
        Alert.alert(t('loanApprovedTitle'), t('loanApprovedBody'), [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } catch (e: unknown) {
        Alert.alert(t('error'), String(e));
      } finally {
        setLoading(false);
      }
    });
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.wrap}>
      <Text style={[styles.hint, { color: colors.textMuted }]}>{t('loanHint')}</Text>

      <Text style={[styles.label, { color: colors.text }]}>{t('sumLabel')}</Text>
      <TextInput
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          { color: colors.text, borderColor: colors.border, backgroundColor: colors.chip },
        ]}
      />

      <Text style={[styles.label, { color: colors.text }]}>{t('loanTerm')}</Text>
      <View style={styles.termRow}>
        {TERMS.map(m => (
          <AnimatedPressable
            key={m}
            variant="soft"
            onPress={() => setTerm(m)}
            style={[
              styles.termChip,
              {
                backgroundColor: term === m ? colors.brand : colors.card,
                borderColor: term === m ? colors.brand : colors.border,
              },
            ]}>
            <Text
              style={[
                styles.termText,
                { color: term === m ? colors.inverseText : colors.text },
              ]}>
              {m} {t('loanMonths')}
            </Text>
          </AnimatedPressable>
        ))}
      </View>

      <View
        style={[
          styles.summary,
          { backgroundColor: colors.brandSoft, borderColor: colors.border },
        ]}>
        <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
          {t('loanRate', { rate: rate.toFixed(1) })}
        </Text>
        <Text style={[styles.summaryValue, { color: colors.brand }]}>
          {t('loanMonthly', { amount: monthly.toFixed(2) })}
        </Text>
      </View>

      <Text style={[styles.label, { color: colors.text }]}>{t('loanCreditTo')}</Text>
      {cards.map(card => (
        <AnimatedPressable
          key={card.number}
          variant="tile"
          onPress={() => setSelectedCard(card)}
          style={[
            styles.cardRow,
            {
              backgroundColor: colors.card,
              borderColor:
                selectedCard?.number === card.number ? colors.brand : colors.border,
            },
          ]}>
          <Text style={[styles.cardNum, { color: colors.text }]}>•••• {card.number.slice(-4)}</Text>
          <Text style={[styles.cardBal, { color: colors.textMuted }]}>
            {card.balance.toFixed(2)} ₽
          </Text>
        </AnimatedPressable>
      ))}

      <AnimatedPressable
        variant="primary"
        onPress={apply}
        disabled={loading}
        style={[styles.applyBtn, { backgroundColor: colors.brand, opacity: loading ? 0.7 : 1 }]}>
        <Text style={[styles.applyText, { color: colors.inverseText }]}>
          {loading ? t('saving') : t('loanApply')}
        </Text>
      </AnimatedPressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: space.lg, paddingBottom: space.xxl },
  hint: { fontSize: 14, lineHeight: 20, marginBottom: space.lg },
  label: { fontSize: 14, fontWeight: '700', marginBottom: space.sm },
  input: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: space.md,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: space.lg,
  },
  termRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.lg },
  termChip: {
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  termText: { fontSize: 13, fontWeight: '700' },
  summary: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: space.md,
    marginBottom: space.lg,
  },
  summaryLabel: { fontSize: 13, fontWeight: '600' },
  summaryValue: { fontSize: 18, fontWeight: '800', marginTop: 4 },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderRadius: radii.lg,
    padding: space.md,
    marginBottom: space.sm,
  },
  cardNum: { fontSize: 15, fontWeight: '700' },
  cardBal: { fontSize: 14, fontWeight: '600' },
  applyBtn: {
    borderRadius: radii.lg,
    paddingVertical: space.lg,
    alignItems: 'center',
    marginTop: space.md,
    ...cardShadow(true),
  },
  applyText: { fontSize: 16, fontWeight: '800' },
});

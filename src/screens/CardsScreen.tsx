import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Clipboard from '@react-native-clipboard/clipboard';
import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '../components/AnimatedPressable';
import { BankCardVisual } from '../components/BankCardVisual';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useSecurity } from '../context/SecurityContext';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { MonefyCore, parseJson } from '../native/monefyCore';
import type { Card } from '../types';
import { cardShadow, radii, space } from '../theme/tokens';
import { cardThemeForIndex } from '../utils/cardThemes';

type Props = NativeStackScreenProps<RootStackParamList, 'Cards'>;

export function CardsScreen({ navigation }: Props) {
  const { colors, t } = useAppPreferences();
  const { requirePaymentAuth } = useSecurity();
  const insets = useSafeAreaInsets();
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCardNumber, setFlippedCardNumber] = useState<string | null>(null);
  const [cvvVisibleCardNumber, setCvvVisibleCardNumber] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('navCards'), headerShown: false });
  }, [navigation, t]);

  const reload = useCallback(async () => {
    const j = await MonefyCore.getCardsJson();
    setCards(parseJson<Card[]>(j));
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const totalBalance = useMemo(
    () => cards.reduce((sum, c) => sum + c.balance, 0),
    [cards],
  );

  const remove = (number: string) => {
    Alert.alert(t('deleteCardQ'), number, [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('remove'),
        style: 'destructive',
        onPress: async () => {
          try {
            await MonefyCore.removeCard(number);
            reload();
          } catch (e: unknown) {
            Alert.alert(t('error'), String(e));
          }
        },
      },
    ]);
  };

  const copyCardNumber = (number: string) => {
    Clipboard.setString(number);
    Alert.alert(t('cardNumberCopied'));
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + space.md,
            paddingBottom: insets.bottom + 100,
          },
        ]}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <AnimatedPressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={() => navigation.goBack()}
              variant="icon"
              style={[
                styles.backBtn,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}>
              <Text style={[styles.backTxt, { color: colors.text }]}>‹</Text>
            </AnimatedPressable>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: colors.text }]}>{t('myCards')}</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                {cards.length} {t('cardsCount')} · {totalBalance.toFixed(2)} ₽
              </Text>
            </View>
          </View>
        </View>

        {cards.length === 0 ? (
          <View
            style={[
              styles.emptyBox,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}>
            <Text style={styles.emptyIcon}>💳</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('noCardsYet')}</Text>
            <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
              {t('addCardHint')}
            </Text>
          </View>
        ) : (
          cards.map((card, index) => (
            <View key={card.number} style={styles.cardBlock}>
              <AnimatedPressable
                variant="tile"
                onPress={() =>
                  setFlippedCardNumber(prev => (prev === card.number ? null : card.number))
                }>
                <BankCardVisual
                  card={card}
                  balance={card.balance}
                  colors={colors}
                  label={`${card.name} ${card.surname}`.trim()}
                  theme={cardThemeForIndex(index)}
                  flipped={flippedCardNumber === card.number}
                  showCvv={cvvVisibleCardNumber === card.number}
                  onCopyNumber={() => copyCardNumber(card.number)}
                  onToggleCvv={() =>
                    setCvvVisibleCardNumber(prev => (prev === card.number ? null : card.number))
                  }
                  copyLabel={t('copyCardNumber')}
                  showCvvLabel={t('showCvv')}
                  hideCvvLabel={t('hideCvv')}
                />
              </AnimatedPressable>
              <View style={styles.actions}>
                <AnimatedPressable
                  variant="primary"
                  style={[styles.actionBtn, { backgroundColor: colors.brandSoft }]}
                  onPress={() =>
                    requirePaymentAuth(() =>
                      navigation.navigate('EditCard', { card }),
                    )
                  }>
                  <Text style={[styles.actionTxt, { color: colors.brand }]}>{t('edit')}</Text>
                </AnimatedPressable>
                <AnimatedPressable
                  variant="primary"
                  style={[styles.actionBtn, { backgroundColor: colors.chip }]}
                  onPress={() => remove(card.number)}>
                  <Text style={[styles.actionTxt, { color: colors.expense }]}>{t('remove')}</Text>
                </AnimatedPressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + space.sm,
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
        ]}>
        <AnimatedPressable
          onPress={() => navigation.navigate('AddCard')}
          variant="primary"
          style={[
            styles.addBtn,
            { backgroundColor: colors.brand },
            cardShadow(true),
          ]}>
          <Text style={[styles.addBtnTxt, { color: colors.inverseText }]}>+ {t('addCard')}</Text>
        </AnimatedPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: space.lg },
  header: { marginBottom: space.lg },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  headerText: { flex: 1 },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backTxt: { fontSize: 34, fontWeight: '600', marginTop: -2 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, fontWeight: '600', marginTop: space.xs },
  emptyBox: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: space.xxl,
    alignItems: 'center',
  },
  emptyIcon: { fontSize: 48, marginBottom: space.md },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginBottom: space.sm },
  emptyHint: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  cardBlock: { marginBottom: space.xl },
  actions: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: space.sm,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: space.md,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  actionTxt: { fontSize: 14, fontWeight: '800' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  addBtn: {
    paddingVertical: space.lg,
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  addBtnTxt: { fontSize: 16, fontWeight: '800' },
});

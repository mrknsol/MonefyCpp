import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BankCardVisual } from '../components/BankCardVisual';
import { useAppPreferences } from '../context/AppPreferencesContext';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { MonefyCore, parseJson } from '../native/monefyCore';
import type { Card } from '../types';
import { cardShadow, radii, space } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Cards'>;

export function CardsScreen({ navigation }: Props) {
  const { colors, t } = useAppPreferences();
  const insets = useSafeAreaInsets();
  const [cards, setCards] = useState<Card[]>([]);

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
          <Text style={[styles.title, { color: colors.text }]}>{t('myCards')}</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {cards.length} {t('cardsCount')} · {totalBalance.toFixed(2)} ₽
          </Text>
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
          cards.map(card => (
            <View key={card.number} style={styles.cardBlock}>
              <BankCardVisual
                card={card}
                balance={card.balance}
                colors={colors}
                label={`${card.name} ${card.surname}`.trim()}
              />
              <View
                style={[
                  styles.metaRow,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  cardShadow(false),
                ]}>
                <View>
                  <Text style={[styles.metaLabel, { color: colors.textMuted }]}>
                    {t('cardNumber')}
                  </Text>
                  <Text style={[styles.metaValue, { color: colors.text }]}>{card.number}</Text>
                </View>
                <View style={styles.metaRight}>
                  <Text style={[styles.metaLabel, { color: colors.textMuted }]}>
                    {t('until')}
                  </Text>
                  <Text style={[styles.metaValue, { color: colors.text }]}>
                    {card.monthOfExpiry}/{card.yearOfExpiry}
                  </Text>
                </View>
              </View>
              <View style={styles.actions}>
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: colors.brandSoft }]}
                  onPress={() => navigation.navigate('EditCard', { card })}>
                  <Text style={[styles.actionTxt, { color: colors.brand }]}>{t('edit')}</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: colors.chip }]}
                  onPress={() => remove(card.number)}>
                  <Text style={[styles.actionTxt, { color: colors.expense }]}>{t('remove')}</Text>
                </Pressable>
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
        <Pressable
          onPress={() => navigation.navigate('AddCard')}
          style={({ pressed }) => [
            styles.addBtn,
            { backgroundColor: colors.brand, opacity: pressed ? 0.92 : 1 },
            cardShadow(true),
          ]}>
          <Text style={[styles.addBtnTxt, { color: colors.inverseText }]}>+ {t('addCard')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: space.lg },
  header: { marginBottom: space.lg },
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
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: space.md,
    marginTop: space.sm,
  },
  metaLabel: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
  metaValue: { fontSize: 14, fontWeight: '700' },
  metaRight: { alignItems: 'flex-end' },
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

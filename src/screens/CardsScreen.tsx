import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useLayoutEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAppPreferences } from '../context/AppPreferencesContext';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { MonefyCore, parseJson } from '../native/monefyCore';
import type { Card } from '../types';
import { cardShadow, radii, space, type as typo } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Cards'>;

export function CardsScreen({ navigation }: Props) {
  const { colors, t } = useAppPreferences();
  const [cards, setCards] = useState<Card[]>([]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('navCards') });
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
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.wrap}>
      <Pressable
        onPress={() => navigation.navigate('AddCard')}
        style={({ pressed }) => [
          styles.addFab,
          {
            backgroundColor: colors.brand,
            opacity: pressed ? 0.92 : 1,
          },
          cardShadow(true),
        ]}>
        <Text style={[styles.addFabTxt, { color: colors.inverseText }]}>{t('addCard')}</Text>
      </Pressable>

      {cards.map(card => (
        <View
          key={card.number}
          style={[
            styles.walletCard,
            { backgroundColor: colors.card, borderColor: colors.border },
            cardShadow(true),
          ]}>
          <View style={[styles.walletBand, { backgroundColor: colors.brand }]} />
          <View style={styles.walletTop}>
            <Text style={[styles.decorDots, { color: colors.textMuted }]}>● ● ● ●</Text>
            <Text style={[styles.balance, { color: colors.income }]}>
              {card.balance.toFixed(2)}
            </Text>
          </View>
          <Text style={[styles.pan, { color: colors.text }]}>{card.number}</Text>
          <View style={styles.walletBottom}>
            <View>
              <Text style={[styles.holderLabel, { color: colors.textMuted }, typo.micro]}>
                HOLDER
              </Text>
              <Text style={[styles.holder, { color: colors.text }]}>
                {card.name} {card.surname}
              </Text>
            </View>
            <View style={styles.expBlock}>
              <Text style={[styles.holderLabel, { color: colors.textMuted }, typo.micro]}>
                {t('until').toUpperCase()}
              </Text>
              <Text style={[styles.exp, { color: colors.text }]}>
                {card.monthOfExpiry}/{card.yearOfExpiry}
              </Text>
            </View>
          </View>
          <View style={[styles.actions, { borderTopColor: colors.borderSubtle }]}>
            <Pressable onPress={() => navigation.navigate('EditCard', { card })} hitSlop={8}>
              <Text style={[styles.actionTxt, { color: colors.brand }]}>{t('edit')}</Text>
            </Pressable>
            <Pressable onPress={() => remove(card.number)} hitSlop={8}>
              <Text style={[styles.actionTxt, { color: colors.danger }]}>{t('remove')}</Text>
            </Pressable>
          </View>
        </View>
      ))}

      {cards.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textSecondary }]}>{t('noCardsYet')}</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: space.lg, paddingBottom: space.xxl },
  addFab: {
    paddingVertical: space.lg,
    borderRadius: radii.lg,
    alignItems: 'center',
    marginBottom: space.lg,
  },
  addFabTxt: { fontWeight: '800', fontSize: 16 },
  walletCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    marginBottom: space.lg,
    overflow: 'hidden',
    padding: space.lg,
    paddingLeft: space.lg + 6,
  },
  walletBand: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
  },
  walletTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: space.xl,
  },
  decorDots: { fontSize: 8, letterSpacing: 4 },
  balance: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  pan: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 2,
    marginBottom: space.lg,
  },
  walletBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  expBlock: { alignItems: 'flex-end' },
  holderLabel: { marginBottom: 4 },
  holder: { fontWeight: '700', fontSize: 15 },
  exp: { fontWeight: '700', fontSize: 15 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: space.lg,
    marginTop: space.lg,
    paddingTop: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionTxt: { fontWeight: '800', fontSize: 14 },
  empty: { textAlign: 'center', marginTop: space.xxl, fontSize: 16 },
});

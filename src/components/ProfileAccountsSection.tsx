import React, { useCallback, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { AnimatedPressable } from '../components/AnimatedPressable';
import { BankCardVisual } from '../components/BankCardVisual';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useAuth } from '../context/AuthContext';
import { MonefyCore, parseJson } from '../native/monefyCore';
import type { Card } from '../types';
import { cardShadow, radii, space } from '../theme/tokens';
import { cardThemeForIndex } from '../utils/cardThemes';

export function ProfileAccountsSection() {
  const { colors, t } = useAppPreferences();
  const navigation = useNavigation<any>();
  const [cards, setCards] = useState<Card[]>([]);

  const reload = useCallback(async () => {
    try {
      const json = await MonefyCore.getCardsJson();
      setCards(parseJson<Card[]>(json));
    } catch {
      setCards([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const totalBalance = cards.reduce((sum, card) => sum + card.balance, 0);

  return (
    <View
      style={[
        styles.section,
        { backgroundColor: colors.card, borderColor: colors.border },
        cardShadow(false),
      ]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('myCards')}</Text>
          <Text style={[styles.sectionHint, { color: colors.textMuted }]}>
            {cards.length} {t('cardsCount')} · {totalBalance.toFixed(2)} ₽
          </Text>
        </View>
        <AnimatedPressable variant="soft" onPress={() => navigation.navigate('Cards')}>
          <Text style={[styles.link, { color: colors.brand }]}>{t('manageCards')}</Text>
        </AnimatedPressable>
      </View>

      {cards.length === 0 ? (
        <AnimatedPressable
          variant="tile"
          onPress={() => navigation.navigate('AddCard')}
          style={[styles.emptyBox, { borderColor: colors.border }]}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('addCardHint')}</Text>
        </AnimatedPressable>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {cards.map((card, index) => (
            <View key={card.number} style={styles.cardWrap}>
              <BankCardVisual
                card={card}
                balance={card.balance}
                colors={colors}
                label={card.name || card.number.slice(-4)}
                theme={cardThemeForIndex(index)}
              />
            </View>
          ))}
        </ScrollView>
      )}

      <AnimatedPressable
        variant="primary"
        onPress={() => navigation.navigate('AddCard')}
        style={[styles.addBtn, { backgroundColor: colors.brandSoft }]}>
        <Text style={[styles.addBtnText, { color: colors.brand }]}>+ {t('addCard')}</Text>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: space.lg,
    marginBottom: space.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: space.md,
    gap: space.md,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  sectionHint: { fontSize: 13, marginTop: 4, fontWeight: '600' },
  link: { fontSize: 14, fontWeight: '800' },
  emptyBox: {
    borderWidth: 1,
    borderRadius: radii.lg,
    borderStyle: 'dashed',
    padding: space.lg,
    marginBottom: space.md,
  },
  emptyText: { textAlign: 'center', fontSize: 14, lineHeight: 20 },
  cardWrap: { width: 260, marginRight: space.md },
  addBtn: {
    marginTop: space.md,
    borderRadius: radii.md,
    paddingVertical: space.md,
    alignItems: 'center',
  },
  addBtnText: { fontSize: 14, fontWeight: '800' },
});

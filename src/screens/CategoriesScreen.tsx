import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AnimatedPressable, animateNextLayout } from '../components/AnimatedPressable';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ScreenLoading } from '../components/ScreenLoading';
import { AppIcon } from '../components/AppIcon';
import { categoryIconName } from '../constants/categoryGlyphs';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useScreenTitle } from '../hooks/useScreenTitle';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { MonefyCore, parseJson } from '../native/monefyCore';
import type { Card, UiCategory } from '../types';
import { cardShadow, radii, space } from '../theme/tokens';
import { loadCustomCategories, mergeUiCategories } from '../utils/categories';

type Props = NativeStackScreenProps<RootStackParamList, 'Categories'>;

export function CategoriesScreen({ navigation, route }: Props) {
  const { date, amount, description, intent = 'expense' } = route.params;
  const { colors, t, locale } = useAppPreferences();
  const [mode, setMode] = useState<'expense' | 'income'>(() =>
    intent === 'topup' ? 'income' : 'expense',
  );
  const [cards, setCards] = useState<Card[]>([]);
  const [uiCats, setUiCats] = useState<UiCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingCard, setProcessingCard] = useState<string | null>(null);

  useScreenTitle('navCategories');

  const loadCards = useCallback(async () => {
    try {
      const j = await MonefyCore.getCardsJson();
      setCards(parseJson<Card[]>(j));
    } catch {
      setCards([]);
    }
  }, []);

  const loadCats = useCallback(async () => {
    const cc = await loadCustomCategories();
    setUiCats(mergeUiCategories(cc, locale));
  }, [locale]);

  useEffect(() => {
    let active = true;
    (async () => {
      setIsLoading(true);
      await Promise.all([loadCards(), loadCats()]);
      if (active) {
        setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [loadCards, loadCats]);

  const pickExpense = (cat: UiCategory) => {
    navigation.navigate('Pay', {
      date,
      amount,
      description,
      category: cat.id,
      iconName: cat.iconName,
      iconColor: cat.color,
    });
  };

  const incomeToCard = async (card: Card) => {
    setProcessingCard(card.number);
    try {
      await MonefyCore.addIncome(card.number, amount);
      navigation.popToTop();
    } catch (e: unknown) {
      Alert.alert(t('error'), String(e));
    } finally {
      setProcessingCard(null);
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.wrap}>
      <View style={styles.tabs}>
        <AnimatedPressable
          variant="soft"
          style={[
            styles.tab,
            {
              backgroundColor: mode === 'expense' ? colors.brand : colors.chip,
              borderColor: mode === 'expense' ? colors.brand : colors.border,
            },
            cardShadow(false),
          ]}
          onPress={() => {
            animateNextLayout();
            setMode('expense');
          }}>
          <Text
            style={[
              styles.tabTxt,
              { color: mode === 'expense' ? colors.inverseText : colors.text },
            ]}>
            {t('expensesTab')}
          </Text>
        </AnimatedPressable>
        <AnimatedPressable
          variant="soft"
          style={[
            styles.tab,
            {
              backgroundColor: mode === 'income' ? colors.topup : colors.chip,
              borderColor: mode === 'income' ? colors.topup : colors.border,
            },
            cardShadow(false),
          ]}
          onPress={() => {
            animateNextLayout();
            setMode('income');
          }}>
          <Text
            style={[
              styles.tabTxt,
              { color: mode === 'income' ? colors.inverseText : colors.text },
            ]}>
            {t('topUpTab')}
          </Text>
        </AnimatedPressable>
      </View>

      <Text style={[styles.sum, { color: colors.text }]}>
        {t('sumLabel')}: <Text style={[styles.sumVal, { color: colors.income }]}>{amount.toFixed(2)}</Text>
      </Text>

      {isLoading ? (
        <ScreenLoading minHeight={180} />
      ) : mode === 'expense' ? (
        <View style={styles.grid}>
          {uiCats.map(cat => (
            <AnimatedPressable
              key={cat.id}
              variant="tile"
              style={[
                styles.tile,
                { borderColor: cat.color, backgroundColor: colors.card },
                cardShadow(false),
              ]}
              onPress={() => pickExpense(cat)}>
              <AppIcon
                name={categoryIconName(cat.iconName)}
                color={cat.color}
                backgroundColor={colors.chip}
                size={44}
                style={styles.tileGlyph}
              />
              <Text style={[styles.tileTxt, { color: colors.text }]} numberOfLines={2}>
                {cat.label}
              </Text>
            </AnimatedPressable>
          ))}
        </View>
      ) : (
        <View style={styles.incomeList}>
          {cards.length === 0 ? (
            <Text style={[styles.hint, { color: colors.topup }]}>{t('noCardsForTopup')}</Text>
          ) : (
            cards.map(card => (
              <AnimatedPressable
                key={card.number}
                variant="tile"
                disabled={processingCard !== null}
                style={[
                  styles.cardRow,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  cardShadow(false),
                ]}
                onPress={() => incomeToCard(card)}>
                <Text style={[styles.cardNum, { color: colors.text }]}>{card.number}</Text>
                {processingCard === card.number ? (
                  <LoadingSpinner size="small" color={colors.income} />
                ) : (
                  <Text style={[styles.cardBal, { color: colors.income }]}>
                    {card.balance.toFixed(2)}
                  </Text>
                )}
              </AnimatedPressable>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: space.lg, paddingBottom: space.xxl },
  tabs: { flexDirection: 'row', marginBottom: space.lg, gap: space.sm },
  tab: {
    flex: 1,
    padding: space.md,
    borderRadius: radii.lg,
    alignItems: 'center',
    borderWidth: 1,
  },
  tabTxt: { fontWeight: '800', fontSize: 14 },
  sum: { marginBottom: space.md, fontSize: 17, fontWeight: '600' },
  sumVal: { fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  tile: {
    width: '47%',
    paddingVertical: space.lg,
    paddingHorizontal: space.sm,
    borderRadius: radii.xl,
    borderWidth: 2,
    alignItems: 'center',
  },
  tileGlyph: { marginBottom: space.sm },
  tileTxt: { textAlign: 'center', fontWeight: '700', fontSize: 13 },
  incomeList: { gap: space.md },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: space.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  cardNum: { fontWeight: '600' },
  cardBal: { fontWeight: '700' },
  hint: { fontSize: 14 },
});

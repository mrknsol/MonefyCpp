import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable, animateNextLayout } from '../components/AnimatedPressable';
import { CompactCardChip } from '../components/CompactCardChip';
import { CurrencyRatesPanel } from '../components/CurrencyRatesPanel';
import { DecorBackdrop } from '../components/DecorBackdrop';
import { categoryGlyph } from '../constants/categoryGlyphs';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useAuth } from '../context/AuthContext';
import { resolveCategoryLabel } from '../i18n/translations';
import { MonefyCore, parseJson } from '../native/monefyCore';
import { getRecentPayments, recordRecentPayment } from '../services/recentPayments';
import type { Card, CustomCategory, Transaction } from '../types';
import { cardShadow, radii, space } from '../theme/tokens';
import { loadCustomCategories } from '../utils/categories';
import { formatDayIso } from '../utils/date';
import {
  navigatePayment,
  PAYMENT_ACTION_META,
  type PaymentActionId,
} from '../utils/paymentActions';

const MAX_HOME_CARDS = 4;

type ActivityTab = 'expense' | 'income';

export function HomeScreenSimple() {
  const { colors, t, locale } = useAppPreferences();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const dayIso = formatDayIso(new Date());
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCardNumber, setSelectedCardNumber] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customCats, setCustomCats] = useState<CustomCategory[]>([]);
  const [activeTab, setActiveTab] = useState<ActivityTab>('expense');
  const [coreVer, setCoreVer] = useState('');
  const [recentPayments, setRecentPayments] = useState<PaymentActionId[]>([]);
  const [expandedCardNumber, setExpandedCardNumber] = useState<string | null>(null);

  const selectedCard = useMemo(
    () => cards.find(c => c.number === selectedCardNumber) ?? null,
    [cards, selectedCardNumber],
  );

  const visibleCards = cards.slice(0, MAX_HOME_CARDS);
  const hasMoreCards = cards.length > MAX_HOME_CARDS;

  const reload = useCallback(async () => {
    try {
      const [cJson, trJson, ver, cc] = await Promise.all([
        MonefyCore.getCardsJson(),
        MonefyCore.getTransactionsForDay(dayIso),
        MonefyCore.getCoreVersion(),
        loadCustomCategories(),
      ]);
      const cardsData = parseJson<Card[]>(cJson);
      const allTx = parseJson<Transaction[]>(trJson);

      setCards(cardsData);
      setTransactions(allTx);
      setCustomCats(cc);
      setCoreVer(ver);

      if (user?.id) {
        const recent = await getRecentPayments(user.id);
        setRecentPayments(recent.map(item => item.id));
      }

      setSelectedCardNumber(prev => {
        if (prev && cardsData.some(c => c.number === prev)) {
          return prev;
        }
        return cardsData[0]?.number ?? null;
      });
    } catch (e) {
      console.warn(e);
    }
  }, [dayIso, user?.id]);

  const openQuickPayment = async (id: PaymentActionId) => {
    if (user?.id) {
      await recordRecentPayment(user.id, id);
      const recent = await getRecentPayments(user.id);
      setRecentPayments(recent.map(item => item.id));
    }
    navigatePayment(navigation, id, {
      fromCardNumber: selectedCardNumber ?? undefined,
    });
  };

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const cardTransactions = useMemo(() => {
    if (!selectedCardNumber) {
      return [];
    }
    return transactions.filter(tx => tx.paymentCard === selectedCardNumber);
  }, [transactions, selectedCardNumber]);

  const expenses = useMemo(
    () => cardTransactions.filter(tx => tx.amount < 0),
    [cardTransactions],
  );

  const incomes = useMemo(
    () => cardTransactions.filter(tx => tx.amount > 0),
    [cardTransactions],
  );

  const visibleTransactions = activeTab === 'expense' ? expenses : incomes;

  const deleteTx = (id: number) => {
    Alert.alert(t('deleteOpQ'), undefined, [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('remove'),
        style: 'destructive',
        onPress: async () => {
          try {
            await MonefyCore.removeTransaction(id);
            await reload();
          } catch (err: unknown) {
            Alert.alert(t('error'), String(err));
          }
        },
      },
    ]);
  };

  const handleCardPress = (cardNumber: string) => {
    animateNextLayout();
    if (expandedCardNumber === cardNumber) {
      setExpandedCardNumber(null);
      return;
    }
    setExpandedCardNumber(cardNumber);
    setSelectedCardNumber(cardNumber);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <DecorBackdrop colors={colors} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + space.sm, paddingBottom: insets.bottom + space.xxl },
        ]}>
        <View style={[styles.topBar, { paddingHorizontal: space.lg }]}>
          <Text style={[styles.wordmark, { color: colors.text }]}>{t('appName')}</Text>
          <Text style={[styles.tagline, { color: colors.textMuted }]}>
            {t('welcomeBack')}, {user?.name?.split(' ')[0] ?? ''}
          </Text>
        </View>

        <View style={{ paddingHorizontal: space.lg }}>
          <Text style={[styles.cardsTitle, { color: colors.textSecondary }]}>
            {t('myCards').toUpperCase()}
          </Text>

          {cards.length === 0 ? (
            <AnimatedPressable
              variant="tile"
              onPress={() => navigation.navigate('AddCard')}
              style={[
                styles.emptyCards,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}>
              <Text style={[styles.emptyCardsText, { color: colors.textMuted }]}>
                {t('addCardHint')}
              </Text>
            </AnimatedPressable>
          ) : (
            <>
              <View>
                {visibleCards.map(card => (
                  <CompactCardChip
                    key={card.number}
                    card={card}
                    expanded={expandedCardNumber === card.number}
                    colors={colors}
                    untilLabel={t('until')}
                    onPress={() => handleCardPress(card.number)}
                  />
                ))}
              </View>
              {hasMoreCards ? (
                <AnimatedPressable
                  variant="soft"
                  onPress={() => navigation.navigate('Cards')}
                  style={[styles.showMoreBtn, { borderColor: colors.border }]}>
                  <Text style={[styles.showMoreText, { color: colors.brand }]}>
                    {t('showMoreCards', { count: cards.length - MAX_HOME_CARDS })}
                  </Text>
                </AnimatedPressable>
              ) : null}
            </>
          )}
        </View>

        <View style={[styles.quickRow, { paddingHorizontal: space.lg }]}>
          <Text style={[styles.quickTitle, { color: colors.textSecondary }]}>
            {t('quickActions').toUpperCase()}
          </Text>
          <View style={styles.quickGrid}>
            <AnimatedPressable
              variant="tile"
              style={[styles.quickBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => openQuickPayment('transfer')}>
              <Text style={styles.quickIcon}>↔️</Text>
              <Text style={[styles.quickLabel, { color: colors.text }]}>{t('transfer')}</Text>
            </AnimatedPressable>
            <AnimatedPressable
              variant="tile"
              style={[styles.quickBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => openQuickPayment('topup')}>
              <Text style={styles.quickIcon}>💰</Text>
              <Text style={[styles.quickLabel, { color: colors.text }]}>{t('topUpLabel')}</Text>
            </AnimatedPressable>
            <AnimatedPressable
              variant="tile"
              style={[styles.quickBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => openQuickPayment('expense')}>
              <Text style={styles.quickIcon}>💸</Text>
              <Text style={[styles.quickLabel, { color: colors.text }]}>{t('expense')}</Text>
            </AnimatedPressable>
          </View>

          {recentPayments.length > 0 ? (
            <View style={styles.recentBlock}>
              <Text style={[styles.recentTitle, { color: colors.textMuted }]}>
                {t('recentPayments').toUpperCase()}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {recentPayments.map(id => {
                  const meta = PAYMENT_ACTION_META[id];
                  return (
                    <AnimatedPressable
                      key={id}
                      variant="soft"
                      onPress={() => openQuickPayment(id)}
                      style={[
                        styles.recentChip,
                        { backgroundColor: colors.chip, borderColor: colors.border },
                      ]}>
                      <Text style={styles.recentIcon}>{meta.icon}</Text>
                      <Text style={[styles.recentLabel, { color: colors.text }]}>
                        {t(meta.labelKey)}
                      </Text>
                    </AnimatedPressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}
        </View>

        <View style={{ paddingHorizontal: space.lg }}>
          <View
            style={[
              styles.tabContainer,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}>
            <AnimatedPressable
              variant="soft"
              style={[
                styles.tab,
                { backgroundColor: activeTab === 'expense' ? colors.chip : 'transparent' },
              ]}
              onPress={() => {
                animateNextLayout();
                setActiveTab('expense');
              }}>
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'expense' ? colors.text : colors.textMuted },
                ]}>
                {t('expenseTab')}
              </Text>
            </AnimatedPressable>
            <AnimatedPressable
              variant="soft"
              style={[
                styles.tab,
                { backgroundColor: activeTab === 'income' ? colors.chip : 'transparent' },
              ]}
              onPress={() => {
                animateNextLayout();
                setActiveTab('income');
              }}>
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'income' ? colors.text : colors.textMuted },
                ]}>
                {t('incomeTab')}
              </Text>
            </AnimatedPressable>
          </View>

          {!selectedCard ? (
            <View
              style={[
                styles.emptyCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}>
              <Text style={[styles.emptyTxt, { color: colors.textSecondary }]}>
                {t('noCards')}
              </Text>
            </View>
          ) : visibleTransactions.length === 0 ? (
            <View
              style={[
                styles.emptyCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}>
              <Text style={[styles.emptyTxt, { color: colors.textSecondary }]}>
                {activeTab === 'expense' ? t('noExpensesDay') : t('noIncomeDay')}
              </Text>
            </View>
          ) : (
            visibleTransactions.map((item, idx) => {
              const catLabel = resolveCategoryLabel(item.category, locale, customCats);
              const glyph = categoryGlyph(item.iconName || 'Custom');
              const isExpense = item.amount < 0;
              const accentColor = isExpense ? colors.expense : colors.income;
              const last = idx === visibleTransactions.length - 1;

              return (
                <AnimatedPressable
                  key={item.id}
                  variant="soft"
                  onLongPress={() => deleteTx(item.id)}
                  style={[
                    styles.txCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      marginBottom: last ? 0 : space.sm,
                    },
                    cardShadow(false),
                  ]}>
                  <View style={[styles.txAccent, { backgroundColor: accentColor }]} />
                  <Text style={styles.txGlyph}>{glyph}</Text>
                  <View style={styles.txMid}>
                    <Text style={[styles.txCat, { color: colors.text }]}>{catLabel}</Text>
                    <Text
                      style={[styles.txDesc, { color: colors.textMuted }]}
                      numberOfLines={1}>
                      {item.description || '—'}
                    </Text>
                  </View>
                  <Text style={[styles.txAmt, { color: accentColor }]}>
                    {isExpense ? '−' : '+'}
                    {Math.abs(item.amount).toFixed(2)}
                  </Text>
                </AnimatedPressable>
              );
            })
          )}

          <CurrencyRatesPanel />
        </View>

        <Text style={[styles.footer, { color: colors.textMuted }]}>
          {t('coreFooter', { version: coreVer })}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {},
  topBar: {
    marginBottom: space.lg,
  },
  wordmark: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tagline: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  cardsTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: space.sm,
  },
  emptyCards: {
    borderWidth: 1,
    borderRadius: radii.lg,
    borderStyle: 'dashed',
    padding: space.lg,
    marginBottom: space.lg,
    alignItems: 'center',
  },
  emptyCardsText: { fontSize: 14, textAlign: 'center' },
  showMoreBtn: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: space.sm,
    alignItems: 'center',
    marginTop: space.sm,
    marginBottom: space.lg,
  },
  showMoreText: { fontSize: 13, fontWeight: '800' },
  quickRow: { marginBottom: space.lg },
  quickTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: space.sm,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: space.sm,
  },
  quickBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingVertical: space.md,
    alignItems: 'center',
    ...cardShadow(false),
  },
  quickIcon: { fontSize: 26, marginBottom: space.xs },
  quickLabel: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  recentBlock: { marginTop: space.md },
  recentTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: space.sm,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    marginRight: space.sm,
    gap: space.xs,
  },
  recentIcon: { fontSize: 16 },
  recentLabel: { fontSize: 13, fontWeight: '700' },
  emptyCard: {
    padding: space.xl,
    borderRadius: radii.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyTxt: { textAlign: 'center', fontSize: 15 },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  txAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: radii.lg,
    borderBottomLeftRadius: radii.lg,
  },
  txGlyph: { fontSize: 22, width: 40, textAlign: 'center' },
  txMid: { flex: 1, minWidth: 0, paddingHorizontal: space.sm },
  txCat: { fontWeight: '800', fontSize: 15 },
  txDesc: { fontSize: 12, marginTop: 4, fontWeight: '500' },
  txAmt: { fontWeight: '800', fontSize: 16 },
  footer: {
    marginTop: space.xxl,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: radii.lg,
    padding: space.xs,
    marginBottom: space.md,
    borderWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  tabText: {
    fontWeight: '700',
    fontSize: 14,
  },
});

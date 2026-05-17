import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BankCardVisual } from '../components/BankCardVisual';
import { DecorBackdrop } from '../components/DecorBackdrop';
import { categoryGlyph } from '../constants/categoryGlyphs';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useAuth } from '../context/AuthContext';
import { resolveCategoryLabel } from '../i18n/translations';
import { MonefyCore, parseJson } from '../native/monefyCore';
import type { Card, CustomCategory, Transaction } from '../types';
import { cardShadow, radii, space, type as typo } from '../theme/tokens';
import { loadCustomCategories } from '../utils/categories';
import {
  formatDayForPreferences,
  formatDayIso,
  isSameCalendarDay,
} from '../utils/date';

type ActivityTab = 'expense' | 'income';

export function HomeScreenSimple() {
  const { colors, t, locale, dateDisplayMode } = useAppPreferences();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [day, setDay] = useState(() => new Date());
  const dayIso = formatDayIso(day);
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCardNumber, setSelectedCardNumber] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customCats, setCustomCats] = useState<CustomCategory[]>([]);
  const [activeTab, setActiveTab] = useState<ActivityTab>('expense');
  const [coreVer, setCoreVer] = useState('');
  const [totalBalance, setTotalBalance] = useState(0);

  const selectedCard = useMemo(
    () => cards.find(c => c.number === selectedCardNumber) ?? null,
    [cards, selectedCardNumber],
  );

  const balance = selectedCard?.balance ?? 0;

  const reload = useCallback(async () => {
    try {
      const [cJson, trJson, ver, cc, total] = await Promise.all([
        MonefyCore.getCardsJson(),
        MonefyCore.getTransactionsForDay(dayIso),
        MonefyCore.getCoreVersion(),
        loadCustomCategories(),
        MonefyCore.getTotalBalance(),
      ]);
      const cardsData = parseJson<Card[]>(cJson);
      const allTx = parseJson<Transaction[]>(trJson);

      setCards(cardsData);
      setTransactions(allTx);
      setCustomCats(cc);
      setCoreVer(ver);
      setTotalBalance(total);

      setSelectedCardNumber(prev => {
        if (prev && cardsData.some(c => c.number === prev)) {
          return prev;
        }
        return cardsData[0]?.number ?? null;
      });
    } catch (e) {
      console.warn(e);
    }
  }, [dayIso]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  useEffect(() => {
    reload();
  }, [dayIso, reload]);

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

  const isToday = isSameCalendarDay(day, new Date());

  const dateTitle = useMemo(
    () => formatDayForPreferences(dayIso, locale, dateDisplayMode),
    [dayIso, locale, dateDisplayMode],
  );

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
          <View>
            <Text style={[styles.wordmark, { color: colors.text }]}>{t('appName')}</Text>
            <Text style={[styles.tagline, { color: colors.textMuted }]}>
              {t('welcomeBack')}, {user?.name?.split(' ')[0] ?? ''}
            </Text>
          </View>
          <View style={[styles.totalPill, { backgroundColor: colors.brandSoft }]}>
            <Text style={[styles.totalLabel, { color: colors.textMuted }]}>
              {t('totalBalance')}
            </Text>
            <Text style={[styles.totalValue, { color: colors.brand }]}>
              {totalBalance.toFixed(2)} ₽
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: space.lg }}>
          <View
            style={[
              styles.dateRail,
              { backgroundColor: colors.card, borderColor: colors.border },
              cardShadow(false),
            ]}>
            <Pressable
              accessibilityRole="button"
              style={[styles.railBtn, { backgroundColor: colors.chip }]}
              onPress={() =>
                setDay(d => {
                  const n = new Date(d);
                  n.setDate(n.getDate() - 1);
                  return n;
                })
              }>
              <Text style={[styles.railChev, { color: colors.text }]}>‹</Text>
            </Pressable>
            {!isToday ? (
              <Pressable
                style={[styles.todayPill, { backgroundColor: colors.brandSoft }]}
                onPress={() => setDay(new Date())}>
                <Text style={[styles.todayPillTxt, { color: colors.brand }]}>
                  {t('today')}
                </Text>
              </Pressable>
            ) : (
              <View style={styles.todaySpacer} />
            )}
            <Pressable
              accessibilityRole="button"
              style={[styles.railBtn, { backgroundColor: colors.chip }]}
              onPress={() =>
                setDay(d => {
                  const n = new Date(d);
                  n.setDate(n.getDate() + 1);
                  return n;
                })
              }>
              <Text style={[styles.railChev, { color: colors.text }]}>›</Text>
            </Pressable>
          </View>

          <BankCardVisual
            card={selectedCard}
            balance={balance}
            colors={colors}
            label={t('defaultCard')}
          />
          <Text style={[styles.dateUnderCard, { color: colors.textMuted }]}>
            {dateTitle}
          </Text>
        </View>

        <View style={[styles.quickRow, { paddingHorizontal: space.lg }]}>
          <Text style={[styles.quickTitle, { color: colors.textSecondary }]}>
            {t('quickActions').toUpperCase()}
          </Text>
          <View style={styles.quickGrid}>
            <Pressable
              style={[styles.quickBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() =>
                navigation.navigate('Transfer', {
                  fromCardNumber: selectedCardNumber ?? undefined,
                })
              }>
              <Text style={styles.quickIcon}>↔️</Text>
              <Text style={[styles.quickLabel, { color: colors.text }]}>{t('transfer')}</Text>
            </Pressable>
            <Pressable
              style={[styles.quickBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => navigation.navigate('AddOperation', { type: 'income' })}>
              <Text style={styles.quickIcon}>💰</Text>
              <Text style={[styles.quickLabel, { color: colors.text }]}>{t('topUpLabel')}</Text>
            </Pressable>
            <Pressable
              style={[styles.quickBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => navigation.navigate('AddOperation', { type: 'expense' })}>
              <Text style={styles.quickIcon}>💸</Text>
              <Text style={[styles.quickLabel, { color: colors.text }]}>{t('expense')}</Text>
            </Pressable>
          </View>
        </View>

        {cards.length > 1 && (
          <View style={[styles.section, { paddingHorizontal: space.lg }]}>
            <Text style={[styles.label, { color: colors.textMuted }, typo.micro]}>
              {t('currentCard')}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {cards.map(card => (
                <Pressable
                  key={card.number}
                  style={[
                    styles.cardOption,
                    {
                      backgroundColor:
                        selectedCardNumber === card.number ? colors.chip : colors.card,
                      borderColor:
                        selectedCardNumber === card.number ? colors.brand : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedCardNumber(card.number)}>
                  <Text
                    style={[
                      styles.cardName,
                      {
                        color:
                          selectedCardNumber === card.number ? colors.brand : colors.text,
                      },
                    ]}>
                    {card.name || card.number.slice(-4)}
                  </Text>
                  <Text
                    style={[
                      styles.cardBalance,
                      {
                        color:
                          selectedCardNumber === card.number
                            ? colors.brand
                            : colors.textMuted,
                      },
                    ]}>
                    {card.balance.toFixed(2)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={{ paddingHorizontal: space.lg }}>
          <View
            style={[
              styles.tabContainer,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}>
            <TouchableOpacity
              style={[
                styles.tab,
                { backgroundColor: activeTab === 'expense' ? colors.chip : 'transparent' },
              ]}
              onPress={() => setActiveTab('expense')}>
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'expense' ? colors.text : colors.textMuted },
                ]}>
                {t('expenseTab')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                { backgroundColor: activeTab === 'income' ? colors.chip : 'transparent' },
              ]}
              onPress={() => setActiveTab('income')}>
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'income' ? colors.text : colors.textMuted },
                ]}>
                {t('incomeTab')}
              </Text>
            </TouchableOpacity>
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
                <Pressable
                  key={item.id}
                  onLongPress={() => deleteTx(item.id)}
                  style={({ pressed }) => [
                    styles.txCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      marginBottom: last ? 0 : space.sm,
                      opacity: pressed ? 0.96 : 1,
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
                </Pressable>
              );
            })
          )}
        </View>

        <Text style={[styles.footer, { color: colors.textMuted }]}>
          {t('coreFooter', { version: coreVer })}
        </Text>
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.brand }]}
        onPress={() => {
          Alert.alert(t('addOperation'), t('selectOperationType'), [
            {
              text: t('expense'),
              onPress: () => navigation.navigate('AddOperation', { type: 'expense' }),
            },
            {
              text: t('income'),
              onPress: () => navigation.navigate('AddOperation', { type: 'income' }),
            },
            { text: t('cancel'), style: 'cancel' },
          ]);
        }}>
        <Text style={[styles.fabText, { color: 'white' }]}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {},
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.lg,
    gap: space.md,
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
  totalPill: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radii.lg,
    alignItems: 'flex-end',
  },
  totalLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  totalValue: { fontSize: 15, fontWeight: '800', marginTop: 2 },
  dateUnderCard: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    marginTop: space.sm,
    marginBottom: space.md,
  },
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
  dateRail: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: space.lg,
    gap: space.md,
  },
  railBtn: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  railChev: { fontSize: 26, fontWeight: '200', marginTop: -2 },
  todayPill: {
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radii.pill,
  },
  todayPillTxt: { fontWeight: '800', fontSize: 13 },
  todaySpacer: { flex: 1 },
  hero: {
    borderRadius: radii.xl,
    padding: space.xl,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: space.lg,
  },
  heroStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    borderTopLeftRadius: radii.xl,
    borderBottomLeftRadius: radii.xl,
  },
  heroLabel: { marginBottom: space.xs },
  heroAmount: { marginTop: 4 },
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
  section: {
    marginBottom: space.md,
  },
  label: {
    marginBottom: space.sm,
    fontWeight: '600',
    fontSize: 12,
  },
  cardOption: {
    borderWidth: 2,
    borderRadius: radii.lg,
    padding: space.md,
    marginRight: space.sm,
    minWidth: 120,
    alignItems: 'center',
    ...cardShadow(false),
  },
  cardName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: space.xs,
  },
  cardBalance: {
    fontSize: 12,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 24,
  },
});

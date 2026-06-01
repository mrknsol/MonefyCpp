import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable, animateNextLayout } from '../components/AnimatedPressable';
import { categoryGlyph } from '../constants/categoryGlyphs';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { resolveCategoryLabel } from '../i18n/translations';
import { MonefyCore, parseJson } from '../native/monefyCore';
import type { CustomCategory, Transaction } from '../types';
import { cardShadow, radii, space } from '../theme/tokens';
import { loadCustomCategories } from '../utils/categories';
import { formatDayForPreferences } from '../utils/date';
import {
  isDateInRange,
  statsPeriodRange,
  type StatsPeriod,
} from '../utils/statsPeriod';

type ActivityTab = 'expense' | 'income';

const PERIODS: StatsPeriod[] = ['week', 'month', 'quarter', 'year', 'all'];

export function StatisticsScreen() {
  const { colors, t, locale, dateDisplayMode } = useAppPreferences();
  const insets = useSafeAreaInsets();
  const [total, setTotal] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customCats, setCustomCats] = useState<CustomCategory[]>([]);
  const [period, setPeriod] = useState<StatsPeriod>('month');
  const [activeTab, setActiveTab] = useState<ActivityTab>('expense');

  const reload = useCallback(async () => {
    try {
      const [balance, txJson, cc] = await Promise.all([
        MonefyCore.getTotalBalance(),
        MonefyCore.getTransactionsJson(),
        loadCustomCategories(),
      ]);
      setTotal(balance);
      setTransactions(parseJson<Transaction[]>(txJson));
      setCustomCats(cc);
    } catch {
      setTotal(0);
      setTransactions([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const range = useMemo(() => statsPeriodRange(period), [period]);

  const filtered = useMemo(
    () => transactions.filter(tx => isDateInRange(tx.date, range.from, range.to)),
    [transactions, range.from, range.to],
  );

  const expenses = useMemo(
    () => filtered.filter(tx => tx.amount < 0).sort((a, b) => b.date.localeCompare(a.date)),
    [filtered],
  );

  const topUps = useMemo(
    () => filtered.filter(tx => tx.amount > 0).sort((a, b) => b.date.localeCompare(a.date)),
    [filtered],
  );

  const visible = activeTab === 'expense' ? expenses : topUps;
  const expenseTotal = expenses.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const topUpTotal = topUps.reduce((sum, tx) => sum + tx.amount, 0);

  const periodLabel = (p: StatsPeriod) => t(`statsPeriod_${p}`);

  const renderItem = ({ item }: { item: Transaction }) => {
    const isExpense = item.amount < 0;
    const accentColor = isExpense ? colors.expense : colors.income;
    const catLabel = resolveCategoryLabel(item.category, locale, customCats);
    const glyph = categoryGlyph(item.iconName || 'Custom');

    return (
      <AnimatedPressable
        variant="soft"
        style={[
          styles.txCard,
          { backgroundColor: colors.card, borderColor: colors.border },
          cardShadow(false),
        ]}>
        <View style={[styles.txAccent, { backgroundColor: accentColor }]} />
        <Text style={styles.txGlyph}>{glyph}</Text>
        <View style={styles.txMid}>
          <Text style={[styles.txCat, { color: colors.text }]}>{catLabel}</Text>
          <Text style={[styles.txDesc, { color: colors.textMuted }]} numberOfLines={1}>
            {item.description || '—'}
          </Text>
          <Text style={[styles.txDate, { color: colors.textMuted }]}>
            {formatDayForPreferences(item.date, locale, dateDisplayMode)}
          </Text>
        </View>
        <Text style={[styles.txAmt, { color: accentColor }]}>
          {isExpense ? '−' : '+'}
          {Math.abs(item.amount).toFixed(2)}
        </Text>
      </AnimatedPressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={visible}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={{
          paddingTop: insets.top + space.lg,
          paddingBottom: insets.bottom + space.xl,
          paddingHorizontal: space.lg,
        }}
        ListHeaderComponent={
          <>
            <Text style={[styles.title, { color: colors.text }]}>{t('statisticsTitle')}</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {t('statisticsSubtitle')}
            </Text>

            <View
              style={[
                styles.statCard,
                { backgroundColor: colors.bankCardStart },
                cardShadow(true),
              ]}>
              <Text style={[styles.statLabel, { color: 'rgba(255,255,255,0.7)' }]}>
                {t('totalBalance').toUpperCase()}
              </Text>
              <Text style={[styles.statValue, { color: colors.onBankCard }]}>
                {total.toFixed(2)} ₽
              </Text>
            </View>

            <Text style={[styles.periodTitle, { color: colors.textSecondary }]}>
              {t('statsPeriodTitle').toUpperCase()}
            </Text>
            <View style={styles.periodRow}>
              {PERIODS.map(p => (
                <AnimatedPressable
                  key={p}
                  variant="soft"
                  onPress={() => {
                    animateNextLayout();
                    setPeriod(p);
                  }}
                  style={[
                    styles.periodChip,
                    {
                      backgroundColor: period === p ? colors.brand : colors.chip,
                      borderColor: period === p ? colors.brand : colors.border,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.periodChipText,
                      { color: period === p ? colors.inverseText : colors.text },
                    ]}>
                    {periodLabel(p)}
                  </Text>
                </AnimatedPressable>
              ))}
            </View>

            <View style={styles.summaryRow}>
              <View
                style={[
                  styles.summaryCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
                  {t('expenseTab')}
                </Text>
                <Text style={[styles.summaryValue, { color: colors.expense }]}>
                  −{expenseTotal.toFixed(2)} ₽
                </Text>
              </View>
              <View
                style={[
                  styles.summaryCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
                  {t('incomeTab')}
                </Text>
                <Text style={[styles.summaryValue, { color: colors.income }]}>
                  +{topUpTotal.toFixed(2)} ₽
                </Text>
              </View>
            </View>

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
                  {t('expenseTab')} ({expenses.length})
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
                  {t('incomeTab')} ({topUps.length})
                </Text>
              </AnimatedPressable>
            </View>
          </>
        }
        ListEmptyComponent={
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}>
            <Text style={[styles.emptyTxt, { color: colors.textSecondary }]}>
              {activeTab === 'expense' ? t('noExpensesPeriod') : t('noIncomePeriod')}
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: space.sm }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: space.sm,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: space.xl,
  },
  statCard: {
    borderRadius: radii.xl,
    padding: space.xl,
    marginBottom: space.lg,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: space.sm,
  },
  statValue: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  periodTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: space.sm,
  },
  periodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginBottom: space.lg,
  },
  periodChip: {
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  periodChipText: { fontSize: 12, fontWeight: '700' },
  summaryRow: {
    flexDirection: 'row',
    gap: space.sm,
    marginBottom: space.lg,
  },
  summaryCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: space.md,
  },
  summaryLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: '800' },
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
  tabText: { fontWeight: '700', fontSize: 13 },
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
  txDate: { fontSize: 11, marginTop: 4, fontWeight: '600' },
  txAmt: { fontWeight: '800', fontSize: 16 },
});

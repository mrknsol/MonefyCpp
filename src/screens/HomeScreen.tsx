import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
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
import { DecorBackdrop } from '../components/DecorBackdrop';
import { categoryGlyph } from '../constants/categoryGlyphs';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { resolveCategoryLabel } from '../i18n/translations';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { MonefyCore, parseJson } from '../native/monefyCore';
import type { Card, CategoryTotal, CustomCategory, Transaction } from '../types';
import { cardShadow, radii, space, type as typo } from '../theme/tokens';
import { loadCustomCategories } from '../utils/categories';
import {
  formatDayForPreferences,
  formatDayIso,
  isSameCalendarDay,
} from '../utils/date';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { colors, t, locale, dateDisplayMode } = useAppPreferences();
  const insets = useSafeAreaInsets();
  const [day, setDay] = useState(() => new Date());
  const dayIso = formatDayIso(day);
  const [balance, setBalance] = useState(0);
  const [totals, setTotals] = useState<CategoryTotal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [coreVer, setCoreVer] = useState('');
  const [customCats, setCustomCats] = useState<CustomCategory[]>([]);
  const [activeTab, setActiveTab] = useState<'categories' | 'operations'>('categories');

  const reload = useCallback(async () => {
    try {
      const [b, tJson, trJson, cJson, ver, cc] = await Promise.all([
        MonefyCore.getTotalBalance(),
        MonefyCore.getCategoryTotalsForDay(dayIso),
        MonefyCore.getTransactionsForDay(dayIso),
        MonefyCore.getCardsJson(),
        MonefyCore.getCoreVersion(),
        loadCustomCategories(),
      ]);
      setBalance(b);
      setTotals(parseJson<CategoryTotal[]>(tJson));
      setTransactions(parseJson<Transaction[]>(trJson));
      setCards(parseJson<Card[]>(cJson));
      setCoreVer(ver);
      setCustomCats(cc);
    } catch (e) {
      console.warn(e);
    }
  }, [dayIso]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const maxSlice = Math.max(...totals.map(x => x.amount), 1);
  const hasCards = cards.length > 0;
  const isToday = isSameCalendarDay(day, new Date());

  const deleteTx = (id: number) => {
    Alert.alert(t('deleteOpQ'), undefined, [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('remove'),
        style: 'destructive',
        onPress: async () => {
          try {
            await MonefyCore.removeTransaction(id);
            reload();
          } catch (err: unknown) {
            Alert.alert(t('error'), String(err));
          }
        },
      },
    ]);
  };

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
            <Text style={[styles.wordmark, { color: colors.text }]}>{t('navHome')}</Text>
            <Text style={[styles.tagline, { color: colors.textMuted }]}>
              {dateTitle}
            </Text>
          </View>
          <AnimatedPressable
            variant="icon"
            onPress={() => navigation.navigate('Settings')}
            style={[styles.iconPill, { backgroundColor: colors.card, borderColor: colors.border }]}
            hitSlop={12}>
            <Text style={styles.gear}>⚙︎</Text>
          </AnimatedPressable>
        </View>

        <View style={{ paddingHorizontal: space.lg }}>
          <View
            style={[
              styles.dateRail,
              { backgroundColor: colors.card, borderColor: colors.border },
              cardShadow(false),
            ]}>
            <AnimatedPressable
              variant="icon"
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
            </AnimatedPressable>
            {!isToday ? (
              <AnimatedPressable
                variant="soft"
                style={[styles.todayPill, { backgroundColor: colors.brandSoft }]}
                onPress={() => setDay(new Date())}>
                <Text style={[styles.todayPillTxt, { color: colors.brand }]}>
                  {t('today')}
                </Text>
              </AnimatedPressable>
            ) : (
              <View style={styles.todaySpacer} />
            )}
            <AnimatedPressable
              variant="icon"
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
            </AnimatedPressable>
          </View>

          <View
            style={[
              styles.hero,
              { backgroundColor: colors.card, borderColor: colors.borderSubtle },
              cardShadow(true),
            ]}>
            <View style={[styles.heroStripe, { backgroundColor: colors.heroLine }]} />
            <Text style={[styles.heroLabel, { color: colors.textMuted }, typo.micro]}>
              {t('balanceAllCards').toUpperCase()}
            </Text>
            <Text style={[styles.heroAmount, { color: colors.text }, typo.heroAmount]}>
              {balance.toFixed(2)}
            </Text>
          </View>

          <View style={styles.ctaRow}>
            <AnimatedPressable
              variant="primary"
              disabled={!hasCards}
              onPress={() =>
                navigation.navigate('Calculator', { date: dayIso, intent: 'expense' })
              }
              style={[
                styles.ctaPrimary,
                {
                  backgroundColor: colors.brand,
                  opacity: !hasCards ? 0.45 : 1,
                },
                cardShadow(false),
              ]}>
              <Text style={[styles.ctaPrimaryTxt, { color: colors.inverseText }]}>
                {t('newExpense')}
              </Text>
            </AnimatedPressable>
            <AnimatedPressable
              variant="primary"
              disabled={!hasCards}
              onPress={() =>
                navigation.navigate('Calculator', { date: dayIso, intent: 'topup' })
              }
              style={[
                styles.ctaGhost,
                {
                  borderColor: colors.topup,
                  backgroundColor: colors.card,
                  opacity: !hasCards ? 0.45 : 1,
                },
              ]}>
              <Text style={[styles.ctaGhostTxt, { color: colors.topup }]}>
                {t('topUpCard')}
              </Text>
            </AnimatedPressable>
          </View>
          {!hasCards ? (
            <Text style={[styles.hint, { color: colors.topup }]}>{t('addCardHint')}</Text>
          ) : null}

          <AnimatedPressable
            variant="tile"
            onPress={() => navigation.navigate('AllCategories')}
            style={[
              styles.linkCard,
              {
                backgroundColor: colors.cardElevated,
                borderColor: colors.border,
              },
            ]}>
            <Text style={[styles.linkCardTitle, { color: colors.text }]}>
              {t('browseCategories')}
            </Text>
            <Text style={[styles.linkCardChev, { color: colors.textMuted }]}>→</Text>
          </AnimatedPressable>

          <AnimatedPressable
            variant="tile"
            onPress={() => navigation.navigate('Cards')}
            style={[
              styles.linkCard,
              {
                backgroundColor: colors.cardElevated,
                borderColor: colors.border,
                marginTop: space.sm,
              },
            ]}>
            <Text style={[styles.linkCardTitle, { color: colors.text }]}>
              {t('myCards')}
            </Text>
            <Text style={[styles.linkCardChev, { color: colors.textMuted }]}>→</Text>
          </AnimatedPressable>
        </View>

        <View style={[styles.sectionHead, { paddingHorizontal: space.lg }]}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }, typo.section]}>
            {t('financialActivity').toUpperCase()}
          </Text>
        </View>
        
        <View style={{ paddingHorizontal: space.lg }}>
          <View style={[styles.tabContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <AnimatedPressable
              variant="soft"
              style={[
                styles.tab,
                { backgroundColor: activeTab === 'categories' ? colors.chip : 'transparent' }
              ]}
              onPress={() => {
                animateNextLayout();
                setActiveTab('categories');
              }}>
              <Text style={[
                styles.tabText,
                { color: activeTab === 'categories' ? colors.text : colors.textMuted }
              ]}>
                {t('expensesByCategory')}
              </Text>
            </AnimatedPressable>
            <AnimatedPressable
              variant="soft"
              style={[
                styles.tab,
                { backgroundColor: activeTab === 'operations' ? colors.chip : 'transparent' }
              ]}
              onPress={() => {
                animateNextLayout();
                setActiveTab('operations');
              }}>
              <Text style={[
                styles.tabText,
                { color: activeTab === 'operations' ? colors.text : colors.textMuted }
              ]}>
                {t('operationsDay')}
              </Text>
            </AnimatedPressable>
          </View>

          {activeTab === 'categories' ? (
            totals.length === 0 ? (
              <View
                style={[
                  styles.emptyCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}>
                <Text style={[styles.emptyTxt, { color: colors.textSecondary }]}>
                  {t('noExpensesDay')}
                </Text>
              </View>
            ) : (
              totals.map(row => {
                const label = resolveCategoryLabel(row.category, locale, customCats);
                const glyph = categoryGlyph(row.iconName || 'Custom');
                const pct = Math.min(100, (row.amount / maxSlice) * 100);
                return (
                  <View
                    key={`${row.category}-${row.iconColor}`}
                    style={[
                      styles.catCard,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      cardShadow(false),
                    ]}>
                    <View
                      style={[
                        styles.catIconRing,
                        { borderColor: row.iconColor, backgroundColor: colors.cardElevated },
                      ]}>
                      <Text style={styles.catGlyph}>{glyph}</Text>
                    </View>
                    <View style={styles.catBody}>
                      <Text style={[styles.catName, { color: colors.text }]} numberOfLines={1}>
                        {label}
                      </Text>
                      <View style={[styles.catBarBg, { backgroundColor: colors.barTrack }]}>
                        <View
                          style={[
                            styles.catBarFill,
                            { width: `${pct}%`, backgroundColor: row.iconColor },
                          ]}
                        />
                      </View>
                    </View>
                    <Text style={[styles.catAmt, { color: colors.text }]}>{row.amount.toFixed(2)}</Text>
                  </View>
                );
              })
            )
          ) : (
            transactions.length === 0 ? (
              <View
                style={[
                  styles.emptyCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}>
                <Text style={[styles.emptyTxt, { color: colors.textSecondary }]}>
                  {t('noOperations')}
                </Text>
              </View>
            ) : (
              transactions.map((item, idx) => {
                const catLabel = resolveCategoryLabel(item.category, locale, customCats);
                const g = categoryGlyph(item.iconName || 'Custom');
                const last = idx === transactions.length - 1;
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
                    <View style={[styles.txAccent, { backgroundColor: colors.expense }]} />
                    <Text style={styles.txGlyph}>{g}</Text>
                    <View style={styles.txMid}>
                      <Text style={[styles.txCat, { color: colors.text }]}>{catLabel}</Text>
                      <Text
                        style={[styles.txDesc, { color: colors.textMuted }]}
                        numberOfLines={1}>
                        {item.description || '—'} · {item.paymentCard}
                      </Text>
                    </View>
                    <Text style={[styles.txAmt, { color: colors.expense }]}>
                      −{item.amount.toFixed(2)}
                    </Text>
                  </AnimatedPressable>
                );
              })
            )
          )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: space.lg,
  },
  wordmark: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  tagline: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  iconPill: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gear: { fontSize: 22 },
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
  ctaRow: { gap: space.sm, marginBottom: space.sm },
  ctaPrimary: {
    paddingVertical: space.lg,
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  ctaPrimaryTxt: { fontWeight: '800', fontSize: 16, letterSpacing: 0.2 },
  ctaGhost: {
    paddingVertical: space.md,
    borderRadius: radii.lg,
    alignItems: 'center',
    borderWidth: 2,
  },
  ctaGhostTxt: { fontWeight: '800', fontSize: 15 },
  hint: { textAlign: 'center', fontSize: 13, marginBottom: space.md, fontWeight: '600' },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.lg,
    paddingHorizontal: space.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  linkCardTitle: { fontWeight: '700', fontSize: 16 },
  linkCardChev: { fontSize: 18, fontWeight: '600' },
  sectionHead: { marginTop: space.xl, marginBottom: space.md },
  sectionLabel: {},
  emptyCard: {
    padding: space.xl,
    borderRadius: radii.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyTxt: { textAlign: 'center', fontSize: 15 },
  catCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: space.sm,
  },
  catIconRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space.md,
  },
  catGlyph: { fontSize: 24 },
  catBody: { flex: 1, minWidth: 0 },
  catName: { fontWeight: '700', fontSize: 15, marginBottom: space.sm },
  catBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  catBarFill: { height: '100%', borderRadius: 3 },
  catAmt: { fontWeight: '800', fontSize: 15, marginLeft: space.sm, minWidth: 72, textAlign: 'right' },
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

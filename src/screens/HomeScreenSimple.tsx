import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable, animateNextLayout } from '../components/AnimatedPressable';
import { ScreenLoading } from '../components/ScreenLoading';
import { AppIcon } from '../components/AppIcon';
import { CompactCardChip } from '../components/CompactCardChip';
import { CurrencyRatesPanel } from '../components/CurrencyRatesPanel';
import { DecorBackdrop } from '../components/DecorBackdrop';
import { categoryIconName } from '../constants/categoryGlyphs';
import { getServicePayment } from '../constants/servicePayments';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useAuth } from '../context/AuthContext';
import { resolveCategoryLabel } from '../i18n/translations';
import { MonefyCore, parseJson } from '../native/monefyCore';
import { getRecentPayments, recordRecentPayment, type RecentPayment } from '../services/recentPayments';
import type { Card, CustomCategory, Transaction } from '../types';
import type { ThemeColors } from '../theme/colors';
import { cardShadow, radii, space } from '../theme/tokens';
import { loadCustomCategories } from '../utils/categories';
import { formatDayIso } from '../utils/date';
import {
  navigatePayment,
  type PaymentActionId,
} from '../utils/paymentActions';

const MAX_HOME_CARDS = 4;

type ActivityTab = 'expense' | 'income';

type FinancialPulse = {
  status: 'healthy' | 'careful' | 'tight';
  score: number;
  safeDaily: number;
  runwayDays: number;
  monthExpense: number;
  monthIncome: number;
};

type CashflowDay = {
  iso: string;
  label: string;
  net: number;
};

type SpendingOrbitItem = {
  key: string;
  label: string;
  amount: number;
  color: string;
  iconName: string;
};

export function HomeScreenSimple() {
  const { colors, t, locale } = useAppPreferences();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const dayIso = formatDayIso(new Date());
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCardNumber, setSelectedCardNumber] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [customCats, setCustomCats] = useState<CustomCategory[]>([]);
  const [activeTab, setActiveTab] = useState<ActivityTab>('expense');
  const [coreVer, setCoreVer] = useState('');
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [expandedCardNumber, setExpandedCardNumber] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const selectedCard = useMemo(
    () => cards.find(c => c.number === selectedCardNumber) ?? null,
    [cards, selectedCardNumber],
  );

  const visibleCards = cards.slice(0, MAX_HOME_CARDS);
  const hasMoreCards = cards.length > MAX_HOME_CARDS;

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      const [cJson, trJson, allTrJson, ver, cc] = await Promise.all([
        MonefyCore.getCardsJson(),
        MonefyCore.getTransactionsForDay(dayIso),
        MonefyCore.getTransactionsJson(),
        MonefyCore.getCoreVersion(),
        loadCustomCategories(),
      ]);
      const cardsData = parseJson<Card[]>(cJson);
      const dayTx = parseJson<Transaction[]>(trJson);
      const allTx = parseJson<Transaction[]>(allTrJson);

      setCards(cardsData);
      setTransactions(dayTx);
      setAllTransactions(allTx);
      setCustomCats(cc);
      setCoreVer(ver);

      if (user?.id) {
        const recent = await getRecentPayments(user.id);
        setRecentPayments(recent);
      }

      setSelectedCardNumber(prev => {
        if (prev && cardsData.some(c => c.number === prev)) {
          return prev;
        }
        return cardsData[0]?.number ?? null;
      });
    } catch (e) {
      console.warn(e);
    } finally {
      setIsLoading(false);
    }
  }, [dayIso, user?.id]);

  const openQuickPayment = async (id: PaymentActionId) => {
    navigatePayment(navigation, id, {
      fromCardNumber: selectedCardNumber ?? undefined,
    });
  };

  const openRecentPayment = async (item: RecentPayment) => {
    if (user?.id) {
      if (item.kind === 'service') {
        await recordRecentPayment(user.id, { kind: 'service', id: item.id });
      } else {
        await recordRecentPayment(user.id, { kind: 'custom', id: item.id });
      }
      const recent = await getRecentPayments(user.id);
      setRecentPayments(recent);
    }
    if (item.kind === 'custom') {
      const custom = customCats.find(category => category.id === item.id);
      if (!custom) {
        return;
      }
      navigation.navigate('AddOperation', {
        type: 'expense',
        categoryId: custom.id,
        description: custom.label,
      });
      return;
    }
    const service = getServicePayment(item.id);
    if (!service) {
      return;
    }
    navigation.navigate('AddOperation', {
      type: 'expense',
      categoryId: service.categoryId,
      description: t(service.descriptionKey),
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

  const financialPulse = useMemo<FinancialPulse>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const elapsedDays = now.getDate();
    const remainingDays = Math.max(1, daysInMonth - elapsedDays + 1);
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    const monthTx = allTransactions.filter(tx => tx.date.startsWith(monthPrefix));
    const monthExpense = monthTx
      .filter(tx => tx.amount < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    const monthIncome = monthTx
      .filter(tx => tx.amount > 0)
      .reduce((sum, tx) => sum + tx.amount, 0);
    const totalBalance = cards.reduce((sum, card) => sum + card.balance, 0);
    const dailyBurn = monthExpense / Math.max(1, elapsedDays);
    const runwayDays = dailyBurn > 0 ? Math.floor(totalBalance / dailyBurn) : remainingDays;
    const safeDaily = Math.max(0, totalBalance / remainingDays);
    const flowRatio = monthIncome > 0 ? Math.min(1, monthExpense / monthIncome) : monthExpense > 0 ? 1 : 0;
    const runwayScore = Math.min(1, runwayDays / Math.max(remainingDays, 1));
    const score = Math.round(Math.max(0, Math.min(100, (1 - flowRatio) * 45 + runwayScore * 55)));
    const status = score >= 70 ? 'healthy' : score >= 40 ? 'careful' : 'tight';

    return {
      status,
      score,
      safeDaily,
      runwayDays,
      monthExpense,
      monthIncome,
    };
  }, [allTransactions, cards]);

  const cashflowWave = useMemo<CashflowDay[]>(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      const iso = formatDayIso(date);
      const net = allTransactions
        .filter(tx => tx.date === iso)
        .reduce((sum, tx) => sum + tx.amount, 0);
      return {
        iso,
        label: date.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2),
        net,
      };
    });
  }, [allTransactions]);

  const spendingOrbit = useMemo<SpendingOrbitItem[]>(() => {
    const now = new Date();
    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const grouped = new Map<
      string,
      { label: string; amount: number; color: string; iconName: string }
    >();

    allTransactions
      .filter(tx => tx.date.startsWith(monthPrefix) && tx.amount < 0)
      .forEach(tx => {
        const current = grouped.get(tx.category);
        if (current) {
          current.amount += Math.abs(tx.amount);
          return;
        }
        grouped.set(tx.category, {
          label: resolveCategoryLabel(tx.category, locale, customCats),
          amount: Math.abs(tx.amount),
          color: tx.iconColor,
          iconName: tx.iconName || 'Custom',
        });
      });

    return [...grouped.entries()]
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);
  }, [allTransactions, customCats, locale]);

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

          {isLoading && cards.length === 0 ? (
            <ScreenLoading minHeight={160} />
          ) : cards.length === 0 ? (
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
              <AppIcon
                name="transfer"
                color={colors.brand}
                backgroundColor={colors.brandSoft}
                style={styles.quickIcon}
              />
              <Text style={[styles.quickLabel, { color: colors.text }]}>{t('transfer')}</Text>
            </AnimatedPressable>
            <AnimatedPressable
              variant="tile"
              style={[styles.quickBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => openQuickPayment('topup')}>
              <AppIcon
                name="topup"
                color={colors.income}
                backgroundColor={colors.chip}
                style={styles.quickIcon}
              />
              <Text style={[styles.quickLabel, { color: colors.text }]}>{t('topUpLabel')}</Text>
            </AnimatedPressable>
            <AnimatedPressable
              variant="tile"
              style={[styles.quickBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => openQuickPayment('expense')}>
              <AppIcon
                name="expense"
                color={colors.expense}
                backgroundColor={colors.chip}
                style={styles.quickIcon}
              />
              <Text style={[styles.quickLabel, { color: colors.text }]}>{t('expense')}</Text>
            </AnimatedPressable>
          </View>

          {recentPayments.length > 0 ? (
            <View style={styles.recentBlock}>
              <Text style={[styles.recentTitle, { color: colors.textMuted }]}>
                {t('recentPayments').toUpperCase()}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {recentPayments.map(item => {
                  const service = item.kind === 'service' ? getServicePayment(item.id) : null;
                  const custom = item.kind === 'custom'
                    ? customCats.find(category => category.id === item.id)
                    : null;
                  if (!service && !custom) {
                    return null;
                  }
                  return (
                    <AnimatedPressable
                      key={`${item.kind}:${item.id}`}
                      variant="soft"
                      onPress={() => openRecentPayment(item)}
                      style={[
                        styles.recentChip,
                        { backgroundColor: colors.chip, borderColor: colors.border },
                      ]}>
                      <AppIcon
                        name={service ? service.iconName : categoryIconName(custom!.iconName)}
                        color={service ? colors.brand : custom!.iconColor}
                        backgroundColor={colors.card}
                        size={24}
                      />
                      <Text style={[styles.recentLabel, { color: colors.text }]}>
                        {service ? t(service.labelKey) : custom!.label}
                      </Text>
                    </AnimatedPressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}
        </View>

        <FinancialPulseCard pulse={financialPulse} colors={colors} t={t} />

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
              const iconName = categoryIconName(item.iconName || 'Custom');
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
                  <AppIcon
                    name={iconName}
                    color={accentColor}
                    backgroundColor={colors.chip}
                    size={34}
                  />
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

function FinancialPulseCard({
  pulse,
  colors,
  t,
}: {
  pulse: FinancialPulse;
  colors: ThemeColors;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [glow]);

  const accent =
    pulse.status === 'healthy'
      ? colors.income
      : pulse.status === 'careful'
        ? colors.gold
        : colors.expense;
  const insightKey =
    pulse.status === 'healthy'
      ? 'pulseInsightHealthy'
      : pulse.status === 'careful'
        ? 'pulseInsightCareful'
        : 'pulseInsightTight';
  const pulseScale = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.88, 1.08],
  });
  const pulseOpacity = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.24, 0.62],
  });
  const sweepRotate = glow.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.pulseOuter, { paddingHorizontal: space.lg }]}>
      <View
        style={[
          styles.pulseCard,
          { backgroundColor: colors.bankCardStart, borderColor: colors.border },
          cardShadow(true),
        ]}>
        <View style={[styles.pulseBlob, { backgroundColor: colors.bankCardEnd }]} />
        <View style={styles.pulseHeader}>
          <View>
            <Text style={[styles.pulseKicker, { color: 'rgba(255,255,255,0.65)' }]}>
              {t('pulseKicker').toUpperCase()}
            </Text>
            <Text style={[styles.pulseTitle, { color: colors.onBankCard }]}>
              {t('pulseTitle')}
            </Text>
          </View>
          <View style={[styles.pulseBadge, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
            <Text style={[styles.pulseBadgeText, { color: accent }]}>
              {t(`pulseStatus_${pulse.status}`)}
            </Text>
          </View>
        </View>

        <View style={styles.pulseBody}>
          <View style={styles.radarWrap}>
            <Animated.View
              style={[
                styles.radarGlow,
                {
                  borderColor: accent,
                  opacity: pulseOpacity,
                  transform: [{ scale: pulseScale }],
                },
              ]}
            />
            <View style={[styles.radarRing, { borderColor: 'rgba(255,255,255,0.18)' }]} />
            <View style={[styles.radarRingSmall, { borderColor: 'rgba(255,255,255,0.14)' }]} />
            <Animated.View
              style={[
                styles.radarSweep,
                { backgroundColor: accent, transform: [{ rotate: sweepRotate }] },
              ]}
            />
            <View style={[styles.radarCore, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
              <Text style={[styles.radarScore, { color: colors.onBankCard }]}>
                {pulse.score}
              </Text>
              <Text style={[styles.radarScoreLabel, { color: 'rgba(255,255,255,0.62)' }]}>
                pulse
              </Text>
            </View>
          </View>

          <View style={styles.pulseMetrics}>
            <View style={styles.pulseMetric}>
              <Text style={[styles.pulseMetricLabel, { color: 'rgba(255,255,255,0.62)' }]}>
                {t('pulseSafeDaily')}
              </Text>
              <Text style={[styles.pulseMetricValue, { color: colors.onBankCard }]}>
                {pulse.safeDaily.toFixed(0)} ₽
              </Text>
            </View>
            <View style={styles.pulseMetric}>
              <Text style={[styles.pulseMetricLabel, { color: 'rgba(255,255,255,0.62)' }]}>
                {t('pulseRunway')}
              </Text>
              <Text style={[styles.pulseMetricValue, { color: colors.onBankCard }]}>
                {pulse.runwayDays} {t('pulseDays')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.pulseFooter}>
          <Text style={[styles.pulseInsight, { color: 'rgba(255,255,255,0.78)' }]}>
            {t(insightKey)}
          </Text>
          <Text style={[styles.pulseFlow, { color: 'rgba(255,255,255,0.58)' }]}>
            {t('pulseMonthFlow', {
              spent: pulse.monthExpense.toFixed(0),
              earned: pulse.monthIncome.toFixed(0),
            })}
          </Text>
        </View>
      </View>
    </View>
  );
}

function CashflowWaveCard({
  days,
  colors,
  t,
}: {
  days: CashflowDay[];
  colors: ThemeColors;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const maxAbs = Math.max(1, ...days.map(day => Math.abs(day.net)));
  const weekNet = days.reduce((sum, day) => sum + day.net, 0);
  const bestDay = days.reduce(
    (best, day) => (day.net > best.net ? day : best),
    days[0] ?? { iso: '', label: '', net: 0 },
  );
  const worstDay = days.reduce(
    (worst, day) => (day.net < worst.net ? day : worst),
    days[0] ?? { iso: '', label: '', net: 0 },
  );

  useEffect(() => {
    progress.setValue(0);
    Animated.spring(progress, {
      toValue: 1,
      useNativeDriver: false,
      friction: 8,
      tension: 55,
    }).start();
  }, [days, progress]);

  const insight =
    weekNet >= 0
      ? t('waveInsightPositive', { amount: weekNet.toFixed(0) })
      : t('waveInsightNegative', { amount: Math.abs(weekNet).toFixed(0) });

  return (
    <View style={[styles.waveOuter, { paddingHorizontal: space.lg }]}>
      <View
        style={[
          styles.waveCard,
          { backgroundColor: colors.card, borderColor: colors.border },
          cardShadow(false),
        ]}>
        <View style={styles.waveHeader}>
          <View>
            <Text style={[styles.waveKicker, { color: colors.textMuted }]}>
              {t('waveKicker').toUpperCase()}
            </Text>
            <Text style={[styles.waveTitle, { color: colors.text }]}>{t('waveTitle')}</Text>
          </View>
          <Text
            style={[
              styles.waveTotal,
              { color: weekNet >= 0 ? colors.income : colors.expense },
            ]}>
            {weekNet >= 0 ? '+' : '−'}
            {Math.abs(weekNet).toFixed(0)} ₽
          </Text>
        </View>

        <View style={[styles.waveChart, { borderColor: colors.borderSubtle }]}>
          <View style={[styles.waveBaseline, { backgroundColor: colors.border }]} />
          {days.map((day, index) => {
            const isPositive = day.net >= 0;
            const height = 10 + (Math.abs(day.net) / maxAbs) * 52;
            const animatedHeight = progress.interpolate({
              inputRange: [0, 1],
              outputRange: [2, height],
            });
            const delayScale = progress.interpolate({
              inputRange: [0, Math.min(1, 0.2 + index * 0.08), 1],
              outputRange: [0.75, 1, 1],
            });

            return (
              <View key={day.iso} style={styles.waveDay}>
                <View style={styles.waveBarColumn}>
                  <Animated.View
                    style={[
                      styles.waveBar,
                      {
                        height: animatedHeight,
                        backgroundColor: isPositive ? colors.income : colors.expense,
                        opacity: day.net === 0 ? 0.28 : 0.9,
                        transform: [{ scaleX: delayScale }],
                        top: isPositive ? undefined : '50%',
                        bottom: isPositive ? '50%' : undefined,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.waveDot,
                      {
                        backgroundColor: isPositive ? colors.income : colors.expense,
                        opacity: day.net === 0 ? 0.35 : 1,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.waveDayLabel, { color: colors.textMuted }]}>
                  {day.label}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.waveFooter}>
          <Text style={[styles.waveInsight, { color: colors.text }]}>{insight}</Text>
          <Text style={[styles.waveMeta, { color: colors.textMuted }]}>
            {t('waveBestWorst', {
              best: bestDay.label || '-',
              worst: worstDay.label || '-',
            })}
          </Text>
        </View>
      </View>
    </View>
  );
}

function SpendingOrbitCard({
  items,
  colors,
  t,
}: {
  items: SpendingOrbitItem[];
  colors: ThemeColors;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const orbit = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0)).current;
  const topItem = items[0];
  const total = items.reduce((sum, item) => sum + item.amount, 0);

  useEffect(() => {
    const orbitLoop = Animated.loop(
      Animated.timing(orbit, {
        toValue: 1,
        duration: 13000,
        useNativeDriver: true,
      }),
    );
    const breatheLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: 1700,
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: 1700,
          useNativeDriver: true,
        }),
      ]),
    );
    orbitLoop.start();
    breatheLoop.start();
    return () => {
      orbitLoop.stop();
      breatheLoop.stop();
    };
  }, [breathe, orbit]);

  const rotate = orbit.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const reverseRotate = orbit.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });
  const coreScale = breathe.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1.04],
  });
  const haloOpacity = breathe.interpolate({
    inputRange: [0, 1],
    outputRange: [0.16, 0.45],
  });

  return (
    <View style={[styles.orbitOuter, { paddingHorizontal: space.lg }]}>
      <View
        style={[
          styles.orbitCard,
          { backgroundColor: colors.card, borderColor: colors.border },
          cardShadow(false),
        ]}>
        <View style={styles.orbitHeader}>
          <View>
            <Text style={[styles.orbitKicker, { color: colors.textMuted }]}>
              {t('orbitKicker').toUpperCase()}
            </Text>
            <Text style={[styles.orbitTitle, { color: colors.text }]}>{t('orbitTitle')}</Text>
          </View>
          <Text style={[styles.orbitTotal, { color: colors.expense }]}>
            −{total.toFixed(0)} ₽
          </Text>
        </View>

        <View style={styles.orbitBody}>
          <View style={styles.orbitSystem}>
            <Animated.View
              style={[
                styles.orbitHalo,
                {
                  borderColor: topItem?.color ?? colors.brand,
                  opacity: haloOpacity,
                  transform: [{ scale: coreScale }],
                },
              ]}
            />
            <View style={[styles.orbitRingLarge, { borderColor: colors.border }]} />
            <View style={[styles.orbitRingSmall, { borderColor: colors.borderSubtle }]} />
            <Animated.View style={[styles.orbitRotator, { transform: [{ rotate }] }]}>
              {items.map((item, index) => {
                const distance = index % 2 === 0 ? 64 : 45;
                const size = 30 + Math.max(0, 8 - index * 2);
                const startAngle = `${index * 82}deg`;
                return (
                  <View
                    key={item.key}
                    style={[
                      styles.orbitPlanetAnchor,
                      { transform: [{ rotate: startAngle }, { translateX: distance }] },
                    ]}>
                    <Animated.View
                      style={[
                        styles.orbitPlanet,
                        {
                          width: size,
                          height: size,
                          borderRadius: size / 2,
                          backgroundColor: colors.chip,
                          borderColor: item.color,
                          transform: [{ rotate: reverseRotate }],
                        },
                      ]}>
                      <AppIcon
                        name={categoryIconName(item.iconName)}
                        color={item.color}
                        backgroundColor="transparent"
                        size={size - 6}
                      />
                    </Animated.View>
                  </View>
                );
              })}
            </Animated.View>
            <Animated.View
              style={[
                styles.orbitCore,
                {
                  backgroundColor: colors.bankCardStart,
                  transform: [{ scale: coreScale }],
                },
              ]}>
              <Text style={[styles.orbitCoreValue, { color: colors.onBankCard }]}>
                {topItem ? Math.round((topItem.amount / Math.max(1, total)) * 100) : 0}%
              </Text>
              <Text style={[styles.orbitCoreLabel, { color: 'rgba(255,255,255,0.65)' }]}>
                {t('orbitTop')}
              </Text>
            </Animated.View>
          </View>

          <View style={styles.orbitLegend}>
            {items.length === 0 ? (
              <Text style={[styles.orbitEmpty, { color: colors.textMuted }]}>
                {t('orbitEmpty')}
              </Text>
            ) : (
              items.map(item => (
                <View key={item.key} style={styles.orbitLegendRow}>
                  <View style={[styles.orbitLegendDot, { backgroundColor: item.color }]} />
                  <Text style={[styles.orbitLegendLabel, { color: colors.text }]} numberOfLines={1}>
                    {item.label}
                  </Text>
                  <Text style={[styles.orbitLegendValue, { color: colors.textMuted }]}>
                    {item.amount.toFixed(0)} ₽
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>

        <Text style={[styles.orbitInsight, { color: colors.textMuted }]}>
          {topItem
            ? t('orbitInsight', { category: topItem.label })
            : t('orbitInsightEmpty')}
        </Text>
      </View>
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
  pulseOuter: { marginBottom: space.lg },
  pulseCard: {
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: space.lg,
    overflow: 'hidden',
  },
  pulseBlob: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    right: -48,
    top: -64,
    opacity: 0.42,
  },
  pulseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: space.md,
    marginBottom: space.lg,
  },
  pulseKicker: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  pulseTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  pulseBadge: {
    borderRadius: radii.pill,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
  },
  pulseBadgeText: { fontSize: 11, fontWeight: '900' },
  pulseBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
  },
  radarWrap: {
    width: 124,
    height: 124,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarGlow: {
    position: 'absolute',
    width: 122,
    height: 122,
    borderRadius: 61,
    borderWidth: 2,
  },
  radarRing: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 1,
  },
  radarRingSmall: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
  },
  radarSweep: {
    position: 'absolute',
    width: 3,
    height: 54,
    borderRadius: 3,
    top: 8,
    opacity: 0.75,
    transformOrigin: '50% 54px',
  },
  radarCore: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarScore: { fontSize: 24, fontWeight: '900', letterSpacing: -0.8 },
  radarScoreLabel: { fontSize: 10, fontWeight: '800', marginTop: -2 },
  pulseMetrics: { flex: 1, gap: space.sm },
  pulseMetric: {
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: space.md,
  },
  pulseMetricLabel: { fontSize: 11, fontWeight: '800', marginBottom: 4 },
  pulseMetricValue: { fontSize: 18, fontWeight: '900' },
  pulseFooter: {
    marginTop: space.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
    paddingTop: space.md,
  },
  pulseInsight: { fontSize: 13, fontWeight: '800', lineHeight: 18 },
  pulseFlow: { fontSize: 11, fontWeight: '700', marginTop: 5 },
  waveOuter: { marginBottom: space.lg },
  waveCard: {
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: space.lg,
  },
  waveHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: space.md,
    marginBottom: space.md,
  },
  waveKicker: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  waveTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.4 },
  waveTotal: { fontSize: 18, fontWeight: '900' },
  waveChart: {
    position: 'relative',
    height: 132,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: space.md,
    paddingTop: space.sm,
    paddingBottom: space.xs,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  waveBaseline: {
    position: 'absolute',
    left: space.md,
    right: space.md,
    top: 64,
    height: 1,
  },
  waveDay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  waveBarColumn: {
    position: 'relative',
    height: 104,
    width: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveBar: {
    position: 'absolute',
    width: 10,
    borderRadius: 8,
  },
  waveDot: {
    position: 'absolute',
    top: 48,
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  waveDayLabel: { fontSize: 10, fontWeight: '800', marginTop: 2 },
  waveFooter: { marginTop: space.md },
  waveInsight: { fontSize: 13, fontWeight: '800', lineHeight: 18 },
  waveMeta: { fontSize: 11, fontWeight: '700', marginTop: 4 },
  orbitOuter: { marginBottom: space.lg },
  orbitCard: {
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: space.lg,
    overflow: 'hidden',
  },
  orbitHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: space.md,
    marginBottom: space.md,
  },
  orbitKicker: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  orbitTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.4 },
  orbitTotal: { fontSize: 18, fontWeight: '900' },
  orbitBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
  },
  orbitSystem: {
    width: 164,
    height: 164,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitHalo: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
  },
  orbitRingLarge: {
    position: 'absolute',
    width: 144,
    height: 144,
    borderRadius: 72,
    borderWidth: 1,
    opacity: 0.8,
  },
  orbitRingSmall: {
    position: 'absolute',
    width: 94,
    height: 94,
    borderRadius: 47,
    borderWidth: 1,
  },
  orbitRotator: {
    position: 'absolute',
    width: 1,
    height: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitPlanetAnchor: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitPlanet: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitCore: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitCoreValue: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  orbitCoreLabel: { fontSize: 10, fontWeight: '800', marginTop: -2 },
  orbitLegend: { flex: 1, gap: space.sm },
  orbitLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  orbitLegendDot: { width: 10, height: 10, borderRadius: 5 },
  orbitLegendLabel: { flex: 1, fontSize: 12, fontWeight: '800' },
  orbitLegendValue: { fontSize: 11, fontWeight: '800' },
  orbitInsight: { fontSize: 12, fontWeight: '700', marginTop: space.md, lineHeight: 17 },
  orbitEmpty: { fontSize: 13, fontWeight: '700', lineHeight: 18 },
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
  quickIcon: { marginBottom: space.xs },
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

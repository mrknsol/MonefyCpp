import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  FlatList,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable, animateNextLayout } from '../components/AnimatedPressable';
import { ScreenLoading } from '../components/ScreenLoading';
import { AppIcon } from '../components/AppIcon';
import { CashflowWaveCard, type CashflowDay } from '../components/FinancialVisualCards';
import { categoryIconName } from '../constants/categoryGlyphs';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { resolveCategoryLabel } from '../i18n/translations';
import { MonefyCore, parseJson } from '../native/monefyCore';
import type { CustomCategory, Transaction } from '../types';
import { cardShadow, radii, space } from '../theme/tokens';
import { loadCustomCategories } from '../utils/categories';
import { formatDayForPreferences, formatDayIso } from '../utils/date';
import {
  isDateInRange,
  statsPeriodRange,
  type StatsPeriod,
} from '../utils/statsPeriod';

type ActivityTab = 'expense' | 'income';

const PERIODS: StatsPeriod[] = ['week', 'month', 'quarter', 'year', 'all'];
const CHART_SEGMENTS = 72;
const CHART_SIZE = 206;
const CHART_SEGMENT_COLORS = [
  '#4F8CFF',
  '#22C55E',
  '#F59E0B',
  '#F43F5E',
  '#A855F7',
  '#06B6D4',
  '#EC4899',
  '#84CC16',
  '#F97316',
  '#14B8A6',
];
const WAVE_STEPS = 36;
const WAVE_INPUT_RANGE = Array.from({ length: WAVE_STEPS + 1 }, (_, index) => index / WAVE_STEPS);
const WAVE_WIDTH = 0.06;

function waveOutputRange(segmentIndex: number) {
  const segmentPosition = segmentIndex / CHART_SEGMENTS;
  return WAVE_INPUT_RANGE.map(position => {
    const directDistance = Math.abs(position - segmentPosition);
    const circularDistance = Math.min(directDistance, 1 - directDistance);
    if (circularDistance > WAVE_WIDTH) {
      return 0.94;
    }
    return 0.94 + (1 - circularDistance / WAVE_WIDTH) * 0.32;
  });
}

type ChartSlice = {
  key: string;
  label: string;
  amount: number;
  color: string;
};

export function StatisticsScreen() {
  const { colors, t, locale, dateDisplayMode } = useAppPreferences();
  const insets = useSafeAreaInsets();
  const [total, setTotal] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customCats, setCustomCats] = useState<CustomCategory[]>([]);
  const [period, setPeriod] = useState<StatsPeriod>('month');
  const [activeTab, setActiveTab] = useState<ActivityTab>('expense');
  const [chartTab, setChartTab] = useState<ActivityTab>('expense');
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
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
  const chartVisible = chartTab === 'expense' ? expenses : topUps;
  const chartTotal = chartTab === 'expense' ? expenseTotal : topUpTotal;

  const cashflowWave = useMemo<CashflowDay[]>(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      const iso = formatDayIso(date);
      const net = transactions
        .filter(tx => tx.date === iso)
        .reduce((sum, tx) => sum + tx.amount, 0);
      return {
        iso,
        label: date.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2),
        net,
      };
    });
  }, [transactions]);

  const chartSlices = useMemo<ChartSlice[]>(() => {
    const grouped = new Map<
      string,
      { label: string; iconColor: string; amount: number }
    >();

    chartVisible.forEach(tx => {
      const amount = Math.abs(tx.amount);
      if (amount <= 0) {
        return;
      }
      const current = grouped.get(tx.category);
      if (current) {
        current.amount += amount;
        return;
      }
      grouped.set(tx.category, {
        label: resolveCategoryLabel(tx.category, locale, customCats),
        iconColor: tx.iconColor,
        amount,
      });
    });

    return [...grouped.entries()]
      .map(([key, value], index) => ({
        key,
        label: value.label,
        amount: value.amount,
        color: CHART_SEGMENT_COLORS[index % CHART_SEGMENT_COLORS.length] || value.iconColor,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [chartVisible, locale, customCats]);

  const periodLabel = (p: StatsPeriod) => t(`statsPeriod_${p}`);

  const renderItem = ({ item }: { item: Transaction }) => {
    const isExpense = item.amount < 0;
    const accentColor = isExpense ? colors.expense : colors.income;
    const catLabel = resolveCategoryLabel(item.category, locale, customCats);
    const iconName = categoryIconName(item.iconName || 'Custom');

    return (
      <AnimatedPressable
        variant="soft"
        style={[
          styles.txCard,
          { backgroundColor: colors.card, borderColor: colors.border },
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

  if (isLoading && transactions.length === 0) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, paddingTop: insets.top + space.lg },
        ]}>
        <ScreenLoading minHeight={320} />
      </View>
    );
  }

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

            <StatsPieChart
              slices={chartSlices}
              total={chartTotal}
              title={t('statsChartTitle')}
              emptyText={chartTab === 'expense' ? t('noExpensesPeriod') : t('noIncomePeriod')}
              totalLabel={chartTab === 'expense' ? t('expenseTab') : t('incomeTab')}
              swipeHint={t('chartSwipeHint')}
              onModeChange={setChartTab}
              colors={{
                card: colors.card,
                border: colors.border,
                chip: colors.chip,
                text: colors.text,
                textMuted: colors.textMuted,
                brand: colors.brand,
              }}
            />

            <CashflowWaveCard days={cashflowWave} colors={colors} t={t} padded={false} />

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

function StatsPieChart({
  slices,
  total,
  title,
  emptyText,
  totalLabel,
  swipeHint,
  onModeChange,
  colors,
}: {
  slices: ChartSlice[];
  total: number;
  title: string;
  emptyText: string;
  totalLabel: string;
  swipeHint: string;
  onModeChange: (mode: ActivityTab) => void;
  colors: {
    card: string;
    border: string;
    chip: string;
    text: string;
    textMuted: string;
    brand: string;
  };
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0)).current;
  const waveClock = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.setValue(0);
    Animated.spring(progress, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 60,
    }).start();
  }, [progress, slices, total]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: 1900,
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: 1900,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breathe]);

  useEffect(() => {
    waveClock.setValue(0);
    const loop = Animated.loop(
      Animated.timing(waveClock, {
        toValue: 1,
        duration: 4800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [waveClock]);

  const chartSegments = useMemo(() => {
    if (total <= 0 || slices.length === 0) {
      return [];
    }

    const ranges: Array<{ until: number; color: string }> = [];
    let cursor = 0;
    slices.forEach(slice => {
      cursor += slice.amount / total;
      ranges.push({ until: cursor, color: slice.color });
    });

    return Array.from({ length: CHART_SEGMENTS }, (_, index) => {
      const ratio = (index + 0.5) / CHART_SEGMENTS;
      const range = ranges.find(item => ratio <= item.until);
      return range?.color ?? colors.brand;
    });
  }, [colors.brand, slices, total]);

  const topLegend = slices.slice(0, 4);
  const radius = CHART_SIZE / 2 - 18;
  const segmentHeight = 42;
  const segmentWidth = 8;
  const chartRotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['-24deg', '0deg'],
  });
  const chartScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1],
  });
  const glowScale = breathe.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1.08],
  });
  const glowOpacity = breathe.interpolate({
    inputRange: [0, 1],
    outputRange: [0.12, 0.32],
  });
  const haloScale = breathe.interpolate({
    inputRange: [0, 1],
    outputRange: [0.98, 1.04],
  });
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 18 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx < -36) {
            onModeChange('income');
          }
          if (gesture.dx > 36) {
            onModeChange('expense');
          }
        },
      }),
    [onModeChange],
  );

  return (
    <View
      style={[
        styles.chartCard,
        { backgroundColor: colors.card, borderColor: colors.border },
        cardShadow(false),
      ]}
      {...panResponder.panHandlers}>
      <View style={styles.chartHeader}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>{title}</Text>
        <View style={styles.chartHeaderRight}>
          <Text style={[styles.chartSubtitle, { color: colors.textMuted }]}>{totalLabel}</Text>
          <Text style={[styles.chartSwipeHint, { color: colors.textMuted }]}>{swipeHint}</Text>
        </View>
      </View>

      <View style={styles.chartBody}>
        <View
          style={[
            styles.chartWrap,
            {
              width: CHART_SIZE,
              height: CHART_SIZE,
            },
          ]}>
          <Animated.View
            style={[
              styles.chartRingLayer,
              {
                transform: [{ rotate: chartRotate }, { scale: chartScale }],
              },
            ]}>
            <Animated.View
              style={[
                styles.chartGlow,
                {
                  backgroundColor: chartSegments[0] ?? colors.brand,
                  opacity: chartSegments.length ? glowOpacity : 0.05,
                  transform: [{ scale: glowScale }],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.chartOuterHalo,
                {
                  borderColor: chartSegments[0] ?? colors.border,
                  transform: [{ scale: haloScale }],
                },
              ]}
            />
            {Array.from({ length: CHART_SEGMENTS }, (_, index) => {
              const rotate = `${(360 / CHART_SEGMENTS) * index}deg`;
              return (
                <View
                  key={`track-${index}`}
                  style={[
                    styles.chartSegment,
                    {
                      left: CHART_SIZE / 2 - segmentWidth / 2,
                      top: CHART_SIZE / 2 - segmentHeight / 2,
                      width: segmentWidth,
                      height: segmentHeight,
                      borderRadius: segmentWidth,
                      backgroundColor: colors.chip,
                      transform: [{ rotate }, { translateY: -radius }],
                    },
                  ]}
                />
              );
            })}

            {chartSegments.map((color, index) => {
              const rotate = `${(360 / CHART_SEGMENTS) * index}deg`;
              const delay = index / CHART_SEGMENTS;
              const waveScale = waveClock.interpolate({
                inputRange: WAVE_INPUT_RANGE,
                outputRange: waveOutputRange(index),
              });
              const opacity = progress.interpolate({
                inputRange: [0, Math.min(1, delay + 0.12), 1],
                outputRange: [0, 1, 1],
              });
              const scaleY = progress.interpolate({
                inputRange: [0, Math.min(1, delay + 0.18), 1],
                outputRange: [0.35, 1, 1],
              });
            const combinedScale = Animated.multiply(scaleY, waveScale);
            const anchoredTranslateY = Animated.add(
              new Animated.Value(-radius),
              Animated.multiply(Animated.subtract(combinedScale, 1), -segmentHeight / 2),
            );

              return (
                <Animated.View
                  key={`slice-${index}`}
                  style={[
                    styles.chartSegment,
                    {
                      left: CHART_SIZE / 2 - segmentWidth / 2,
                      top: CHART_SIZE / 2 - segmentHeight / 2,
                      width: segmentWidth,
                      height: segmentHeight,
                      borderRadius: segmentWidth,
                      backgroundColor: color,
                      opacity,
                      transform: [
                        { rotate },
                      { translateY: anchoredTranslateY },
                      { scaleY: combinedScale },
                      ],
                    },
                  ]}
                />
              );
            })}
          </Animated.View>

          <View
            style={[
              styles.chartCenter,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                shadowColor: chartSegments[0] ?? colors.brand,
              },
            ]}>
            <Text style={[styles.chartCenterValue, { color: colors.text }]}>
              {total.toFixed(0)} ₽
            </Text>
            <Text style={[styles.chartCenterLabel, { color: colors.textMuted }]}>
              {totalLabel}
            </Text>
          </View>
        </View>

        <View style={styles.chartLegend}>
          {topLegend.length === 0 ? (
            <Text style={[styles.chartEmpty, { color: colors.textMuted }]}>{emptyText}</Text>
          ) : (
            topLegend.map(slice => (
              <View
                key={slice.key}
                style={[
                  styles.legendRow,
                  { backgroundColor: colors.chip, borderColor: colors.border },
                ]}>
                <View style={[styles.legendDot, { backgroundColor: slice.color }]} />
                <View style={styles.legendTextWrap}>
                  <Text style={[styles.legendLabel, { color: colors.text }]} numberOfLines={1}>
                    {slice.label}
                  </Text>
                  <Text style={[styles.legendAmount, { color: colors.textMuted }]}>
                    {slice.amount.toFixed(0)} ₽
                  </Text>
                </View>
                <Text style={[styles.legendPercent, { color: slice.color }]}>
                  {Math.round((slice.amount / total) * 100)}%
                </Text>
              </View>
            ))
          )}
        </View>
      </View>
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
  chartCard: {
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: space.lg,
    marginBottom: space.lg,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.md,
  },
  chartTitle: { fontSize: 17, fontWeight: '800' },
  chartHeaderRight: { alignItems: 'flex-end' },
  chartSubtitle: { fontSize: 12, fontWeight: '700' },
  chartSwipeHint: { fontSize: 10, fontWeight: '800', marginTop: 2, opacity: 0.75 },
  chartBody: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: space.md,
  },
  chartWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartRingLayer: {
    position: 'absolute',
    width: CHART_SIZE,
    height: CHART_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartGlow: {
    position: 'absolute',
    width: 178,
    height: 178,
    borderRadius: 89,
  },
  chartOuterHalo: {
    position: 'absolute',
    width: 196,
    height: 196,
    borderRadius: 98,
    borderWidth: 1,
    opacity: 0.22,
  },
  chartSegment: {
    position: 'absolute',
  },
  chartCenter: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.sm,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 6,
  },
  chartCenterValue: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  chartCenterLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  chartLegend: { width: '100%', gap: space.sm },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendTextWrap: { flex: 1, minWidth: 0 },
  legendLabel: { fontSize: 13, fontWeight: '800' },
  legendAmount: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  legendPercent: { fontSize: 13, fontWeight: '900' },
  chartEmpty: { fontSize: 13, lineHeight: 18 },
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

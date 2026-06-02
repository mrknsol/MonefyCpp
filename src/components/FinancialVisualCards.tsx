import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from './AppIcon';
import { categoryIconName } from '../constants/categoryGlyphs';
import type { ThemeColors } from '../theme/colors';
import { cardShadow, radii, space } from '../theme/tokens';

export type CashflowDay = {
  iso: string;
  label: string;
  net: number;
};

export type SpendingOrbitItem = {
  key: string;
  label: string;
  amount: number;
  color: string;
  iconName: string;
};

type Translate = (key: string, vars?: Record<string, string | number>) => string;

export function CashflowWaveCard({
  days,
  colors,
  t,
  padded = true,
}: {
  days: CashflowDay[];
  colors: ThemeColors;
  t: Translate;
  padded?: boolean;
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
    <View style={[styles.waveOuter, padded ? { paddingHorizontal: space.lg } : null]}>
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
            {weekNet >= 0 ? '+' : '-'}
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

export function SpendingOrbitCard({
  items,
  colors,
  t,
  padded = true,
}: {
  items: SpendingOrbitItem[];
  colors: ThemeColors;
  t: Translate;
  padded?: boolean;
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
    <View style={[styles.orbitOuter, padded ? { paddingHorizontal: space.lg } : null]}>
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
            -{total.toFixed(0)} ₽
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
  waveDay: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  waveBarColumn: {
    position: 'relative',
    height: 104,
    width: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveBar: { position: 'absolute', width: 10, borderRadius: 8 },
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
  orbitBody: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
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
  orbitLegendRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  orbitLegendDot: { width: 10, height: 10, borderRadius: 5 },
  orbitLegendLabel: { flex: 1, fontSize: 12, fontWeight: '800' },
  orbitLegendValue: { fontSize: 11, fontWeight: '800' },
  orbitInsight: { fontSize: 12, fontWeight: '700', marginTop: space.md, lineHeight: 17 },
  orbitEmpty: { fontSize: 13, fontWeight: '700', lineHeight: 18 },
});

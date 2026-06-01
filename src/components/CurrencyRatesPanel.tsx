import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useAppPreferences } from '../context/AppPreferencesContext';
import { fetchCurrencyRates, type CurrencyRate } from '../services/currencyRates';
import { cardShadow, radii, space } from '../theme/tokens';

function TrendArrow({ trend, colors }: { trend: CurrencyRate['trend']; colors: { expense: string; income: string; textMuted: string } }) {
  if (trend === 'up') {
    return <Text style={[styles.trend, { color: colors.expense }]}>▲</Text>;
  }
  if (trend === 'down') {
    return <Text style={[styles.trend, { color: colors.income }]}>▼</Text>;
  }
  return <Text style={[styles.trend, { color: colors.textMuted }]}>—</Text>;
}

export function CurrencyRatesPanel() {
  const { colors, t } = useAppPreferences();
  const [rates, setRates] = useState<CurrencyRate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchCurrencyRates()
      .then(data => {
        if (active) {
          setRates(data);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: colors.card, borderColor: colors.border },
        cardShadow(false),
      ]}>
      <Text style={[styles.title, { color: colors.textSecondary }]}>
        {t('currencyRatesTitle').toUpperCase()}
      </Text>
      {loading ? (
        <ActivityIndicator color={colors.brand} style={styles.loader} />
      ) : (
        rates.map(rate => (
          <View key={rate.code} style={styles.row}>
            <View>
              <Text style={[styles.code, { color: colors.text }]}>{rate.code}</Text>
              <Text style={[styles.name, { color: colors.textMuted }]}>
                {t(rate.nameKey)}
              </Text>
            </View>
            <View style={styles.valueWrap}>
              <TrendArrow trend={rate.trend} colors={colors} />
              <Text style={[styles.value, { color: colors.brand }]}>
                {rate.rubPerUnit.toFixed(2)} ₽
              </Text>
            </View>
          </View>
        ))
      )}
      <Text style={[styles.hint, { color: colors.textMuted }]}>{t('currencyRatesHint')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: space.md,
    marginTop: space.lg,
    marginBottom: space.sm,
  },
  title: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: space.md,
  },
  loader: { marginVertical: space.md },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: space.sm,
  },
  code: { fontSize: 15, fontWeight: '800' },
  name: { fontSize: 11, marginTop: 2, fontWeight: '600' },
  valueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trend: { fontSize: 12, fontWeight: '800' },
  value: { fontSize: 15, fontWeight: '800' },
  hint: { fontSize: 10, marginTop: space.sm, fontWeight: '600' },
});

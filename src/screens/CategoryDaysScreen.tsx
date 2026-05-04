import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useLayoutEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAppPreferences } from '../context/AppPreferencesContext';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { MonefyCore, parseJson } from '../native/monefyCore';
import type { CategoryDayActivity } from '../types';
import { formatDayForPreferences } from '../utils/date';

type Props = NativeStackScreenProps<RootStackParamList, 'CategoryDays'>;

export function CategoryDaysScreen({ navigation, route }: Props) {
  const { categoryId, title } = route.params;
  const { colors, t, locale, dateDisplayMode } = useAppPreferences();
  const [rows, setRows] = useState<CategoryDayActivity[]>([]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: title || t('categoryDaysTitle') });
  }, [navigation, title, t]);

  const load = useCallback(async () => {
    try {
      const j = await MonefyCore.getCategoryDatesJson(categoryId);
      setRows(parseJson<CategoryDayActivity[]>(j));
    } catch {
      setRows([]);
    }
  }, [categoryId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <ScrollView
      contentContainerStyle={[styles.wrap, { backgroundColor: colors.background }]}>
      {rows.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textSecondary }]}>
          {t('noActivity')}
        </Text>
      ) : (
        rows.map(row => (
          <View
            key={row.date}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View>
              <Text style={[styles.date, { color: colors.text }]}>
                {formatDayForPreferences(row.date, locale, dateDisplayMode)}
              </Text>
              <Text style={[styles.meta, { color: colors.textSecondary }]}>
                {t('txCount', { n: row.count })}
              </Text>
            </View>
            <Text style={[styles.sum, { color: colors.expense }]}>
              {row.total.toFixed(2)}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, paddingBottom: 40 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 16 },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  date: { fontSize: 16, fontWeight: '600' },
  meta: { fontSize: 13, marginTop: 4 },
  sum: { fontSize: 18, fontWeight: '700' },
});

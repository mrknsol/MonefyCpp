import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useLayoutEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AnimatedPressable } from '../components/AnimatedPressable';
import { AppIcon } from '../components/AppIcon';
import { categoryIconName } from '../constants/categoryGlyphs';
import { useAppPreferences } from '../context/AppPreferencesContext';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { ThemeColors } from '../theme/colors';
import type { UiCategory } from '../types';
import { cardShadow, radii, space } from '../theme/tokens';
import { loadCustomCategories, mergeUiCategories } from '../utils/categories';

type Props = NativeStackScreenProps<RootStackParamList, 'AllCategories'>;

function CategoryListRow({
  item,
  colors,
  t,
  onOpen,
}: {
  item: UiCategory;
  colors: ThemeColors;
  t: (key: string) => string;
  onOpen: (id: string, title: string) => void;
}) {
  return (
    <AnimatedPressable
      variant="soft"
      style={[
        styles.row,
        { backgroundColor: colors.card, borderColor: colors.border },
        cardShadow(false),
      ]}
      onPress={() => onOpen(item.id, item.label)}>
      <AppIcon
        name={categoryIconName(item.iconName)}
        color={item.color}
        backgroundColor={colors.chip}
        size={40}
        style={styles.glyph}
      />
      <View style={styles.rowText}>
        <Text style={[styles.name, { color: colors.text }]}>{item.label}</Text>
        {item.isCustom ? (
          <Text style={[styles.badge, { color: colors.textSecondary }]}>
            {t('customSection')}
          </Text>
        ) : null}
      </View>
      <Text style={[styles.chev, { color: colors.textSecondary }]}>›</Text>
    </AnimatedPressable>
  );
}

export function AllCategoriesScreen({ navigation }: Props) {
  const { colors, t, locale } = useAppPreferences();

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('navAllCategories') });
  }, [navigation, t]);
  const [builtIn, setBuiltIn] = useState<UiCategory[]>([]);
  const [custom, setCustom] = useState<UiCategory[]>([]);

  const reload = useCallback(async () => {
    const cc = await loadCustomCategories();
    const merged = mergeUiCategories(cc, locale);
    setBuiltIn(merged.filter(x => !x.isCustom));
    setCustom(merged.filter(x => x.isCustom));
  }, [locale]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const onOpen = useCallback(
    (categoryId: string, title: string) => {
      navigation.navigate('CategoryDays', { categoryId, title });
    },
    [navigation],
  );

  return (
    <ScrollView
      contentContainerStyle={[styles.wrap, { backgroundColor: colors.background }]}>
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        {t('allCategoriesHint')}
      </Text>

      <Text style={[styles.head, { color: colors.text }]}>{t('builtin')}</Text>
      {builtIn.map(item => (
        <CategoryListRow
          key={item.id}
          item={item}
          colors={colors}
          t={t}
          onOpen={onOpen}
        />
      ))}

      {custom.length > 0 ? (
        <>
          <Text style={[styles.head, styles.headSpaced, { color: colors.text }]}>
            {t('customSection')}
          </Text>
          {custom.map(item => (
            <CategoryListRow
              key={item.id}
              item={item}
              colors={colors}
              t={t}
              onOpen={onOpen}
            />
          ))}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: space.lg, paddingBottom: space.xxl },
  hint: { fontSize: 14, marginBottom: space.lg, lineHeight: 20 },
  head: { fontSize: 13, fontWeight: '800', marginBottom: space.md, letterSpacing: 0.8 },
  headSpaced: { marginTop: space.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space.md,
    borderRadius: radii.lg,
    marginBottom: space.sm,
    borderWidth: 1,
  },
  glyph: { marginRight: space.md },
  rowText: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700' },
  badge: { fontSize: 12, marginTop: 4, fontWeight: '600' },
  chev: { fontSize: 20, fontWeight: '400' },
});

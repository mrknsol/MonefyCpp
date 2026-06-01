import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useLayoutEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AnimatedPressable } from '../components/AnimatedPressable';
import { LanguagePicker } from '../components/LanguagePicker';
import { useAppPreferences } from '../context/AppPreferencesContext';
import type { ThemeColors } from '../theme/colors';
import type { DateDisplayMode, ThemeMode } from '../i18n/translations';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { cardShadow, radii, space, type as typo } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

function SettingSegment({
  active,
  label,
  onPress,
  layout,
  colors,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  layout: 'inline' | 'block';
  colors: ThemeColors;
}) {
  return (
    <AnimatedPressable
      variant="soft"
      onPress={onPress}
      style={[
        styles.seg,
        layout === 'inline' ? styles.segInline : styles.segBlock,
        {
          backgroundColor: active ? colors.brand : colors.chip,
          borderColor: active ? colors.brand : colors.border,
        },
        cardShadow(false),
      ]}>
      <Text
        style={[
          styles.segTxt,
          { color: active ? colors.inverseText : colors.text },
        ]}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

export function SettingsScreen({ navigation }: Props) {
  const {
    colors,
    t,
    locale,
    setLocale,
    themeMode,
    setThemeMode,
    dateDisplayMode,
    setDateDisplayMode,
  } = useAppPreferences();

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('settingsTitle') });
  }, [navigation, t]);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.wrap, { paddingBottom: space.xxl }]}>
      <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.groupTitle, { color: colors.textMuted }, typo.section]}>
          {t('languageLabel').toUpperCase()}
        </Text>
        <LanguagePicker
          colors={colors}
          locale={locale}
          onLocaleChange={setLocale}
          label={t('languageLabel')}
          selectTitle={t('selectLanguage')}
        />
      </View>

      <View
        style={[
          styles.group,
          { backgroundColor: colors.card, borderColor: colors.border, marginTop: space.lg },
        ]}>
        <Text style={[styles.groupTitle, { color: colors.textMuted }, typo.section]}>
          {t('theme').toUpperCase()}
        </Text>
        <View style={styles.stack}>
          {(
            [
              ['system', t('themeSystem')],
              ['light', t('themeLight')],
              ['dark', t('themeDark')],
            ] as [ThemeMode, string][]
          ).map(([mode, label]) => (
            <SettingSegment
              key={mode}
              active={themeMode === mode}
              label={label}
              onPress={() => setThemeMode(mode)}
              layout="block"
              colors={colors}
            />
          ))}
        </View>
      </View>

      <View
        style={[
          styles.group,
          { backgroundColor: colors.card, borderColor: colors.border, marginTop: space.lg },
        ]}>
        <Text style={[styles.groupTitle, { color: colors.textMuted }, typo.section]}>
          {t('dateFormat').toUpperCase()}
        </Text>
        <View style={styles.stack}>
          {(
            [
              ['long', t('dateLong')],
              ['short', t('dateShort')],
              ['iso', t('dateIso')],
            ] as [DateDisplayMode, string][]
          ).map(([mode, label]) => (
            <SettingSegment
              key={mode}
              active={dateDisplayMode === mode}
              label={label}
              onPress={() => setDateDisplayMode(mode)}
              layout="block"
              colors={colors}
            />
          ))}
        </View>
      </View>

      <AnimatedPressable
        variant="primary"
        onPress={() => navigation.navigate('AddCustomCategory')}
        style={[
          styles.cta,
          {
            backgroundColor: colors.brand,
            marginTop: space.xl,
          },
          cardShadow(true),
        ]}>
        <Text style={[styles.ctaTxt, { color: colors.inverseText }]}>{t('addCategoryBtn')}</Text>
      </AnimatedPressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: space.lg },
  group: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: space.lg,
  },
  groupTitle: { marginBottom: space.md },
  segRow: { flexDirection: 'row', gap: space.sm },
  stack: { gap: space.sm },
  seg: {
    paddingVertical: space.md,
    paddingHorizontal: space.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  segInline: { flex: 1 },
  segBlock: { alignSelf: 'stretch' },
  segTxt: { fontWeight: '700', fontSize: 14 },
  cta: {
    paddingVertical: space.lg,
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  ctaTxt: { fontWeight: '800', fontSize: 16 },
});

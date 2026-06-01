import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AnimatedPressable } from './AnimatedPressable';
import { APP_LANGUAGES, languageNativeName } from '../constants/languages';
import type { AppLocale } from '../i18n/translations';
import type { ThemeColors } from '../theme/colors';
import { radii, space } from '../theme/tokens';

type Props = {
  colors: ThemeColors;
  locale: AppLocale;
  onLocaleChange: (locale: AppLocale) => void;
  label: string;
  selectTitle: string;
};

export function LanguagePicker({
  colors,
  locale,
  onLocaleChange,
  label,
  selectTitle,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <AnimatedPressable variant="soft" style={styles.row} onPress={() => setOpen(true)}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        <View style={styles.right}>
          <Text style={[styles.value, { color: colors.brand }]}>
            {languageNativeName(locale)}
          </Text>
          <Text style={[styles.chevron, { color: colors.brand }]}>▾</Text>
        </View>
      </AnimatedPressable>

      <Modal visible={open} transparent animationType="fade">
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View
            style={[
              styles.sheet,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>{selectTitle}</Text>
            <ScrollView style={styles.list}>
              {APP_LANGUAGES.map(lang => {
                const selected = lang.code === locale;
                return (
                  <AnimatedPressable
                    key={lang.code}
                    variant="soft"
                    onPress={() => {
                      onLocaleChange(lang.code);
                      setOpen(false);
                    }}
                    style={[
                      styles.option,
                      {
                        backgroundColor: selected ? colors.brandSoft : 'transparent',
                        borderColor: selected ? colors.brand : 'transparent',
                      },
                    ]}>
                    <Text style={[styles.optionName, { color: colors.text }]}>
                      {lang.nativeName}
                    </Text>
                    {selected ? (
                      <Text style={[styles.check, { color: colors.brand }]}>✓</Text>
                    ) : null}
                  </AnimatedPressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  label: { fontSize: 16, fontWeight: '600' },
  right: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  value: { fontSize: 13, fontWeight: '700' },
  chevron: { fontSize: 12, fontWeight: '800' },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderWidth: 1,
    maxHeight: '55%',
    padding: space.lg,
  },
  sheetTitle: { fontSize: 17, fontWeight: '800', marginBottom: space.md },
  list: { maxHeight: 360 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: space.xs,
  },
  optionName: { fontSize: 16, fontWeight: '600' },
  check: { fontSize: 18, fontWeight: '800' },
});

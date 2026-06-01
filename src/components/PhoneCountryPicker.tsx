import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  PHONE_COUNTRIES,
  type PhoneCountry,
} from '../constants/phoneCountries';
import { AnimatedPressable } from './AnimatedPressable';
import type { ThemeColors } from '../theme/colors';
import { radii, space } from '../theme/tokens';

type Props = {
  colors: ThemeColors;
  country: PhoneCountry;
  localNumber: string;
  onCountryChange: (country: PhoneCountry) => void;
  onLocalNumberChange: (value: string) => void;
  placeholder: string;
  selectCountryLabel: string;
  t: (key: string) => string;
};

export function PhoneCountryPicker({
  colors,
  country,
  localNumber,
  onCountryChange,
  onLocalNumberChange,
  placeholder,
  selectCountryLabel,
  t,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <>
      <View style={styles.row}>
        <AnimatedPressable
          variant="soft"
          onPress={() => setPickerOpen(true)}
          style={[
            styles.countryBtn,
            { backgroundColor: colors.chip, borderColor: colors.border },
          ]}>
          <Text style={styles.flag}>{country.flag}</Text>
          <Text style={[styles.dial, { color: colors.text }]}>{country.dial}</Text>
          <Text style={[styles.chev, { color: colors.brand }]}>▾</Text>
        </AnimatedPressable>
        <TextInput
          value={localNumber}
          onChangeText={onLocalNumberChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType="phone-pad"
          style={[
            styles.input,
            {
              color: colors.text,
              borderColor: colors.border,
              backgroundColor: colors.chip,
            },
          ]}
        />
      </View>

      <Modal visible={pickerOpen} transparent animationType="fade">
        <Pressable style={styles.backdrop} onPress={() => setPickerOpen(false)}>
          <View
            style={[
              styles.sheet,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>
              {selectCountryLabel}
            </Text>
            <ScrollView style={styles.list}>
              {PHONE_COUNTRIES.map(item => (
                <AnimatedPressable
                  key={item.code}
                  variant="soft"
                  onPress={() => {
                    onCountryChange(item);
                    setPickerOpen(false);
                  }}
                  style={[
                    styles.countryRow,
                    {
                      backgroundColor:
                        item.code === country.code ? colors.brandSoft : 'transparent',
                    },
                  ]}>
                  <Text style={styles.rowFlag}>{item.flag}</Text>
                  <Text style={[styles.rowName, { color: colors.text }]}>
                    {t(item.nameKey)}
                  </Text>
                  <Text style={[styles.rowDial, { color: colors.textMuted }]}>
                    {item.dial}
                  </Text>
                </AnimatedPressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm, marginBottom: space.md },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: space.sm,
    paddingVertical: space.md,
    gap: 4,
  },
  flag: { fontSize: 20 },
  dial: { fontSize: 15, fontWeight: '700' },
  chev: { fontSize: 12, fontWeight: '800' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    fontSize: 16,
    fontWeight: '600',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderWidth: 1,
    maxHeight: '60%',
    padding: space.lg,
  },
  sheetTitle: { fontSize: 17, fontWeight: '800', marginBottom: space.md },
  list: { maxHeight: 320 },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.md,
    paddingHorizontal: space.sm,
    borderRadius: radii.md,
    gap: space.sm,
  },
  rowFlag: { fontSize: 22, width: 32 },
  rowName: { flex: 1, fontSize: 16, fontWeight: '600' },
  rowDial: { fontSize: 14, fontWeight: '700' },
});

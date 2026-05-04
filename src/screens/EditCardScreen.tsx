import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useLayoutEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAppPreferences } from '../context/AppPreferencesContext';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { MonefyCore } from '../native/monefyCore';
import type { ThemeColors } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'EditCard'>;

export function EditCardScreen({ navigation, route }: Props) {
  const { card: initial } = route.params;
  const { colors, t } = useAppPreferences();
  const oldNumber = initial.number;

  const [name, setName] = useState(initial.name);
  const [surname, setSurname] = useState(initial.surname);
  const [number, setNumber] = useState(initial.number);
  const [month, setMonth] = useState(initial.monthOfExpiry);
  const [year, setYear] = useState(initial.yearOfExpiry);
  const [cvv, setCvv] = useState(initial.cvv);
  const [balance, setBalance] = useState(String(initial.balance));

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('navEditCard') });
  }, [navigation, t]);

  const save = async () => {
    if (!number.trim()) {
      Alert.alert(t('error'), t('cardNumberRequired'));
      return;
    }
    const bal = parseFloat(balance.replace(',', '.'));
    const payload = JSON.stringify({
      name: name.trim(),
      surname: surname.trim(),
      number: number.trim(),
      monthOfExpiry: month.trim(),
      yearOfExpiry: year.trim(),
      cvv: cvv.trim(),
      balance: Number.isFinite(bal) ? bal : initial.balance,
    });
    try {
      await MonefyCore.updateCardJson(oldNumber, payload);
      navigation.goBack();
    } catch (e: unknown) {
      Alert.alert(t('error'), String(e));
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.wrap, { backgroundColor: colors.background }]}>
      <Field
        label={t('firstName')}
        value={name}
        onChangeText={setName}
        colors={colors}
      />
      <Field
        label={t('lastName')}
        value={surname}
        onChangeText={setSurname}
        colors={colors}
      />
      <Field
        label={t('cardNumber')}
        value={number}
        onChangeText={setNumber}
        keyboardType="number-pad"
        colors={colors}
      />
      <View style={styles.row}>
        <View style={styles.half}>
          <Field
            label={t('monthShort')}
            value={month}
            onChangeText={setMonth}
            colors={colors}
          />
        </View>
        <View style={styles.half}>
          <Field
            label={t('yearShort')}
            value={year}
            onChangeText={setYear}
            colors={colors}
          />
        </View>
      </View>
      <Field
        label={t('cvv')}
        value={cvv}
        onChangeText={setCvv}
        keyboardType="number-pad"
        colors={colors}
      />
      <Field
        label={t('balance')}
        value={balance}
        onChangeText={setBalance}
        keyboardType="decimal-pad"
        colors={colors}
      />
      <Pressable
        style={[styles.save, { backgroundColor: colors.accentMuted }]}
        onPress={save}>
        <Text style={styles.saveTxt}>{t('save')}</Text>
      </Pressable>
    </ScrollView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
  colors,
}: {
  label: string;
  value: string;
  onChangeText: (s: string) => void;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad';
  colors: ThemeColors;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.lab, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          {
            color: colors.text,
            borderColor: colors.border,
            backgroundColor: colors.card,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? 'default'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, paddingBottom: 40 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  field: { marginBottom: 12 },
  lab: { marginBottom: 4, fontSize: 13 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  save: {
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveTxt: { color: '#fff', fontWeight: '700', fontSize: 17 },
});

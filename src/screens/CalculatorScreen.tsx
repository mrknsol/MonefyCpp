import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useLayoutEffect, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AnimatedPressable } from '../components/AnimatedPressable';
import { useAppPreferences } from '../context/AppPreferencesContext';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { cardShadow, radii, space } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Calculator'>;

const KEYS = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  ['.', '0', '⌫'],
];

export function CalculatorScreen({ navigation, route }: Props) {
  const { date, intent = 'expense' } = route.params;
  const { colors, t } = useAppPreferences();
  const [display, setDisplay] = useState('0');
  const [description, setDescription] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('navCalculator') });
  }, [navigation, t]);

  const append = (ch: string) => {
    setDisplay(prev => {
      if (ch === '⌫') {
        if (prev.length <= 1) {
          return '0';
        }
        return prev.slice(0, -1);
      }
      if (ch === '.' && prev.includes('.')) {
        return prev;
      }
      if (prev === '0' && ch !== '.') {
        return ch;
      }
      return prev + ch;
    });
  };

  const next = () => {
    const amount = parseFloat(display);
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert(t('amountTitle'), t('enterPositive'));
      return;
    }
    navigation.navigate('Categories', {
      date,
      amount,
      description: description.trim(),
      intent,
    });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.displayCard,
          { backgroundColor: colors.card, borderColor: colors.border },
          cardShadow(true),
        ]}>
        <Text style={[styles.display, { color: colors.text }]}>{display}</Text>
        <TextInput
          style={[
            styles.desc,
            {
              color: colors.text,
              borderColor: colors.borderSubtle,
              backgroundColor: colors.cardElevated,
            },
          ]}
          placeholder={t('commentPh')}
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
        />
      </View>

      <View style={styles.pad}>
        {KEYS.map((row, ri) => (
          <View style={styles.row} key={ri}>
            {row.map(k => (
              <AnimatedPressable
                key={k}
                variant="icon"
                onPress={() => append(k)}
                style={[
                  styles.key,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                  cardShadow(false),
                ]}>
                <Text style={[styles.keyTxt, { color: colors.text }]}>{k}</Text>
              </AnimatedPressable>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.bottomRow}>
        <AnimatedPressable variant="soft" onPress={() => setDisplay('0')} hitSlop={12}>
          <Text style={[styles.clear, { color: colors.textMuted }]}>{t('reset')}</Text>
        </AnimatedPressable>
      </View>

      <AnimatedPressable
        variant="primary"
        onPress={next}
        style={[
          styles.next,
          { backgroundColor: colors.brand },
          cardShadow(true),
        ]}>
        <Text style={[styles.nextTxt, { color: colors.inverseText }]}>{t('nextCategory')}</Text>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: space.lg },
  displayCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: space.lg,
    marginBottom: space.lg,
  },
  display: {
    fontSize: 52,
    fontWeight: '200',
    textAlign: 'right',
    letterSpacing: -1,
  },
  desc: {
    marginTop: space.md,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: space.md,
    fontSize: 16,
  },
  pad: { flex: 1, justifyContent: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: space.md },
  key: {
    width: '30%',
    aspectRatio: 1.15,
    borderRadius: radii.lg,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyTxt: { fontSize: 26, fontWeight: '600' },
  bottomRow: { alignItems: 'center', marginBottom: space.md },
  clear: { fontWeight: '700', fontSize: 15 },
  next: {
    paddingVertical: space.lg,
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  nextTxt: { fontWeight: '800', fontSize: 17 },
});

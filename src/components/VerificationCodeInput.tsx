import React, { useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { ThemeColors } from '../theme/colors';
import { radii, space } from '../theme/tokens';

type Props = {
  value: string;
  onChange: (code: string) => void;
  length?: number;
  colors: ThemeColors;
  label: string;
  hint?: string;
};

export function VerificationCodeInput({
  value,
  onChange,
  length = 6,
  colors,
  label,
  hint,
}: Props) {
  const inputRef = useRef<TextInput>(null);
  const digits = value.replace(/\D/g, '').slice(0, length);

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      {hint ? (
        <Text style={[styles.hint, { color: colors.textMuted }]}>{hint}</Text>
      ) : null}
      <TextInput
        ref={inputRef}
        style={[
          styles.input,
          {
            backgroundColor: colors.chip,
            color: colors.text,
            borderColor: colors.border,
            letterSpacing: digits.length > 0 ? 10 : 0,
          },
        ]}
        value={digits}
        onChangeText={text => onChange(text.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        maxLength={length}
        placeholder={'•'.repeat(length)}
        placeholderTextColor={colors.textMuted}
        autoFocus
        textAlign="center"
      />
      <Pressable style={styles.cells} onPress={() => inputRef.current?.focus()}>
        {Array.from({ length }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.cell,
              {
                borderColor: i < digits.length ? colors.brand : colors.border,
                backgroundColor: i < digits.length ? colors.brandSoft : colors.card,
              },
            ]}>
            <Text style={[styles.cellText, { color: colors.text }]}>
              {digits[i] ?? ''}
            </Text>
          </View>
        ))}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: space.lg },
  label: { fontSize: 14, fontWeight: '600', marginBottom: space.xs },
  hint: { fontSize: 13, lineHeight: 18, marginBottom: space.md },
  input: {
    height: 0,
    width: 0,
    opacity: 0,
    position: 'absolute',
  },
  cells: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: space.sm,
  },
  cell: {
    width: 44,
    height: 52,
    borderRadius: radii.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: { fontSize: 22, fontWeight: '700' },
});

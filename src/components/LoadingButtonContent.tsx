import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { LoadingSpinner, type LoadingSpinnerSize } from './LoadingSpinner';

type Props = {
  label: string;
  textColor: string;
  spinnerColor?: string;
  size?: LoadingSpinnerSize;
};

export function LoadingButtonContent({
  label,
  textColor,
  spinnerColor,
  size = 'small',
}: Props) {
  return (
    <View style={styles.row}>
      <LoadingSpinner size={size} color={spinnerColor ?? textColor} />
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  label: {
    fontSize: 17,
    fontWeight: '800',
  },
});

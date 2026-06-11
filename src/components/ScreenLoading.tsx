import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useAppPreferences } from '../context/AppPreferencesContext';
import { space } from '../theme/tokens';
import { LoadingSpinner } from './LoadingSpinner';

type Props = {
  label?: string;
  minHeight?: number;
  style?: StyleProp<ViewStyle>;
};

export function ScreenLoading({ label, minHeight = 140, style }: Props) {
  const { colors } = useAppPreferences();

  return (
    <View style={[styles.wrap, { minHeight }, style]}>
      <LoadingSpinner size="medium" color={colors.brand} />
      {label ? (
        <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.xl,
    gap: space.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
});

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppPreferences } from '../context/AppPreferencesContext';
import { space } from '../theme/tokens';

export function AccountsScreen() {
  const { colors, t } = useAppPreferences();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>{t('accountsTitle')}</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>{t('accountsSubtitle')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: space.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: space.sm,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
});

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Card } from '../types';
import type { ThemeColors } from '../theme/colors';
import { radii, space } from '../theme/tokens';

type Props = {
  card: Card | null;
  balance: number;
  colors: ThemeColors;
  label?: string;
};

export function BankCardVisual({ card, balance, colors, label }: Props) {
  const displayName = card?.name || label || 'Monefy Bank';
  const last4 = card?.number?.slice(-4) ?? '••••';

  return (
    <View style={[styles.wrap, { backgroundColor: colors.bankCardStart }]}>
      <View style={[styles.glow, { backgroundColor: colors.bankCardEnd }]} />
      <View style={styles.topRow}>
        <Text style={[styles.bankName, { color: colors.onBankCard }]}>MONEFY BANK</Text>
        <View style={[styles.chip, { backgroundColor: colors.gold }]} />
      </View>
      <Text style={[styles.balance, { color: colors.onBankCard }]}>
        {balance.toFixed(2)} ₽
      </Text>
      <View style={styles.bottomRow}>
        <View>
          <Text style={[styles.metaLabel, { color: 'rgba(255,255,255,0.55)' }]}>
            CARD HOLDER
          </Text>
          <Text style={[styles.holder, { color: colors.onBankCard }]} numberOfLines={1}>
            {displayName.toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.last4, { color: colors.onBankCard }]}>•••• {last4}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radii.xl,
    padding: space.xl,
    overflow: 'hidden',
    minHeight: 168,
    justifyContent: 'space-between',
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -60,
    right: -40,
    opacity: 0.45,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankName: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
  },
  chip: {
    width: 40,
    height: 28,
    borderRadius: 6,
    opacity: 0.9,
  },
  balance: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
    marginVertical: space.md,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  holder: {
    fontSize: 14,
    fontWeight: '700',
    maxWidth: 180,
  },
  last4: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
  },
});

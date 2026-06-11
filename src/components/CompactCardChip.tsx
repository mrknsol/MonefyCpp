import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AnimatedPressable, animateNextLayout } from './AnimatedPressable';
import type { Card } from '../types';
import type { ThemeColors } from '../theme/colors';
import { cardThemeForNumber, type CardTheme } from '../utils/cardThemes';
import { radii, space } from '../theme/tokens';

type Props = {
  card: Card;
  expanded: boolean;
  colors: ThemeColors;
  untilLabel: string;
  onPress: () => void;
};

export function CompactCardChip({
  card,
  expanded,
  colors,
  untilLabel,
  onPress,
}: Props) {
  const theme = cardThemeForNumber(card.number);
  const last4 = card.number.slice(-4);
  const holder = `${card.name} ${card.surname}`.trim() || 'Card';

  useEffect(() => {
    animateNextLayout();
  }, [expanded]);

  return (
    <AnimatedPressable
      onPress={onPress}
      variant="tile"
      style={[
        styles.wrap,
        expanded ? styles.wrapExpanded : styles.wrapCompact,
        {
          backgroundColor: expanded ? theme.start : colors.card,
          borderColor: expanded ? theme.accent : colors.border,
        },
      ]}>
      <View style={[styles.glow, { backgroundColor: theme.end }]} />
      <View style={[styles.chip, { backgroundColor: theme.accent }]} />

      {expanded ? (
        <ExpandedContent
          theme={theme}
          holder={holder}
          last4={last4}
          balance={card.balance}
          untilLabel={untilLabel}
          expiry={`${card.monthOfExpiry}/${card.yearOfExpiry}`}
        />
      ) : (
        <CompactContent theme={theme} holder={holder} last4={last4} colors={colors} />
      )}
    </AnimatedPressable>
  );
}

function CompactContent({
  theme,
  holder,
  last4,
  colors,
}: {
  theme: CardTheme;
  holder: string;
  last4: string;
  colors: ThemeColors;
}) {
  return (
    <View style={styles.compactRow}>
      <View style={[styles.colorStripe, { backgroundColor: theme.start }]} />
      <View style={styles.compactMid}>
        <Text style={[styles.last4, { color: colors.text }]} numberOfLines={1}>
          •••• {last4}
        </Text>
        <Text style={[styles.holder, { color: colors.textMuted }]} numberOfLines={1}>
          {holder}
        </Text>
      </View>
      <Text style={[styles.expandHint, { color: colors.textMuted }]}>›</Text>
    </View>
  );
}

function ExpandedContent({
  theme,
  holder,
  last4,
  balance,
  untilLabel,
  expiry,
}: {
  theme: CardTheme;
  holder: string;
  last4: string;
  balance: number;
  untilLabel: string;
  expiry: string;
}) {
  const muted = 'rgba(255,255,255,0.75)';
  return (
    <>
      <Text style={[styles.bankLabel, { color: muted }]}>MONEFY</Text>
      <Text style={[styles.balance, { color: theme.text }]}>{balance.toFixed(2)} ₽</Text>
      <Text style={[styles.holderExpanded, { color: theme.text }]} numberOfLines={1}>
        {holder.toUpperCase()}
      </Text>
      <View style={styles.metaRow}>
        <Text style={[styles.meta, { color: muted }]}>•••• {last4}</Text>
        <Text style={[styles.meta, { color: muted }]}>
          {untilLabel} {expiry}
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radii.lg,
    borderWidth: 2,
    padding: space.md,
    marginBottom: space.sm,
    overflow: 'hidden',
    width: '100%',
  },
  wrapCompact: {
    minHeight: 64,
    justifyContent: 'center',
  },
  wrapExpanded: {
    minHeight: 120,
    justifyContent: 'flex-start',
    gap: 4,
  },
  glow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    top: -40,
    right: -20,
    opacity: 0.35,
  },
  chip: {
    position: 'absolute',
    top: space.md,
    right: space.md,
    width: 28,
    height: 18,
    borderRadius: 4,
    opacity: 0.95,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  colorStripe: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  compactMid: { flex: 1 },
  expandHint: { fontSize: 22, fontWeight: '300' },
  last4: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  holder: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  bankLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    paddingRight: 40,
  },
  balance: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginVertical: 4,
  },
  holderExpanded: {
    fontSize: 12,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: space.xs,
    gap: space.sm,
  },
  meta: {
    fontSize: 11,
    fontWeight: '600',
  },
});

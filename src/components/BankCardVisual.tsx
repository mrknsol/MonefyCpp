import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { AnimatedPressable } from './AnimatedPressable';
import type { Card } from '../types';
import type { ThemeColors } from '../theme/colors';
import type { CardTheme } from '../utils/cardThemes';
import { radii, space } from '../theme/tokens';
import { formatCardNumber } from '../utils/cardNumber';

type Props = {
  card: Card | null;
  balance: number;
  colors: ThemeColors;
  label?: string;
  theme?: CardTheme;
  flipped?: boolean;
  showCvv?: boolean;
  onCopyNumber?: () => void;
  onToggleCvv?: () => void;
  copyLabel?: string;
  showCvvLabel?: string;
  hideCvvLabel?: string;
};

export function BankCardVisual({
  card,
  balance,
  colors,
  label,
  theme,
  flipped = false,
  showCvv = false,
  onCopyNumber,
  onToggleCvv,
  copyLabel = 'Copy',
  showCvvLabel = 'Show CVV',
  hideCvvLabel = 'Hide CVV',
}: Props) {
  const displayName = card?.name || label || 'Monefy';
  const last4 = card?.number?.slice(-4) ?? '••••';
  const cardNumber = card?.number ? formatCardNumber(card.number) : '•••• •••• •••• ••••';
  const expiry = card ? `${card.monthOfExpiry}/${card.yearOfExpiry}` : '••/••';
  const bg = theme?.start ?? colors.bankCardStart;
  const glow = theme?.end ?? colors.bankCardEnd;
  const accent = theme?.accent ?? colors.gold;
  const text = theme?.text ?? colors.onBankCard;
  const progress = useRef(new Animated.Value(flipped ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: flipped ? 1 : 0,
      friction: 9,
      tension: 85,
      useNativeDriver: true,
    }).start();
  }, [flipped, progress]);

  const frontRotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const backRotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  return (
    <View style={[styles.wrap, { backgroundColor: bg }]}>
      <Animated.View
        style={[
          styles.face,
          {
            transform: [{ perspective: 900 }, { rotateY: frontRotate }],
          },
        ]}>
        <View style={[styles.glow, { backgroundColor: glow }]} />
        <View style={styles.topRow}>
          <Text style={[styles.bankName, { color: text }]}>MONEFY</Text>
          <View style={[styles.chip, { backgroundColor: accent }]} />
        </View>
        <Text style={[styles.balance, { color: text }]}>{balance.toFixed(2)} ₽</Text>
        <View style={styles.bottomRow}>
          <View>
            <Text style={[styles.metaLabel, { color: 'rgba(255,255,255,0.55)' }]}>
              CARD HOLDER
            </Text>
            <Text style={[styles.holder, { color: text }]} numberOfLines={1}>
              {displayName.toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.last4, { color: text }]}>•••• {last4}</Text>
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.face,
          styles.backFace,
          {
            transform: [{ perspective: 900 }, { rotateY: backRotate }],
          },
        ]}>
        <View style={[styles.glow, { backgroundColor: glow }]} />
        <View style={styles.magneticStripe} />
        <AnimatedPressable
          variant="soft"
          disabled={!onCopyNumber}
          onPress={event => {
            event.stopPropagation();
            onCopyNumber?.();
          }}
          style={styles.numberTap}>
          <Text style={[styles.fullNumber, { color: text }]}>{cardNumber}</Text>
          <Text style={[styles.copyHint, { color: 'rgba(255,255,255,0.62)' }]}>
            {copyLabel}
          </Text>
        </AnimatedPressable>
        <View style={styles.backBottomRow}>
          <View>
            <Text style={[styles.metaLabel, { color: 'rgba(255,255,255,0.55)' }]}>
              VALID THRU
            </Text>
            <Text style={[styles.backValue, { color: text }]}>{expiry}</Text>
          </View>
          <AnimatedPressable
            variant="soft"
            disabled={!onToggleCvv}
            onPress={event => {
              event.stopPropagation();
              onToggleCvv?.();
            }}
            style={[styles.cvvBox, { backgroundColor: 'rgba(255,255,255,0.22)' }]}>
            <Text style={[styles.cvvText, { color: text }]}>
              CVV {showCvv ? card?.cvv || '•••' : '•••'}
            </Text>
            <Text style={[styles.cvvHint, { color: 'rgba(255,255,255,0.68)' }]}>
              {showCvv ? hideCvvLabel : showCvvLabel}
            </Text>
          </AnimatedPressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    minHeight: 168,
  },
  face: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    padding: space.xl,
    justifyContent: 'space-between',
    backfaceVisibility: 'hidden',
  },
  backFace: {
    justifyContent: 'center',
    gap: space.lg,
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
  magneticStripe: {
    height: 38,
    marginHorizontal: -space.xl,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  fullNumber: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 2,
  },
  numberTap: {
    alignSelf: 'flex-start',
  },
  copyHint: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  backBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  backValue: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cvvBox: {
    borderRadius: 8,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    alignItems: 'flex-end',
  },
  cvvText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cvvHint: {
    marginTop: 3,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
});

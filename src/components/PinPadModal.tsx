import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from './AnimatedPressable';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { cardShadow, radii, space } from '../theme/tokens';
import { AppIcon } from './AppIcon';

type Props = {
  visible: boolean;
  mode: 'verify' | 'unlock' | 'setup' | 'setup-confirm';
  pinLength: number;
  /** When false, hide cancel (e.g. app unlock) */
  dismissible?: boolean;
  onClose: () => void;
  /** Return false to show error shake and clear digits */
  onComplete: (pin: string) => boolean | void;
};

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'] as const;

function PinDot({
  filled,
  active,
  error,
  colors,
}: {
  filled: boolean;
  active: boolean;
  error: boolean;
  colors: { brand: string; gold: string; expense: string; border: string };
}) {
  const scale = useRef(new Animated.Value(filled ? 1 : 0.85)).current;
  const fill = useRef(new Animated.Value(filled ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: filled ? 1.08 : active ? 1 : 0.85,
        friction: 6,
        tension: 140,
        useNativeDriver: true,
      }),
      Animated.timing(fill, {
        toValue: filled ? 1 : 0,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start(() => {
      if (filled) {
        Animated.spring(scale, {
          toValue: 1,
          friction: 7,
          tension: 120,
          useNativeDriver: true,
        }).start();
      }
    });
  }, [filled, active, fill, scale]);

  const borderColor = error
    ? colors.expense
    : filled
      ? colors.gold
      : active
        ? colors.brand
        : colors.border;

  const backgroundColor = fill.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', error ? colors.expense : colors.gold],
  });

  return (
    <Animated.View
      style={[
        styles.dotOuter,
        {
          borderColor,
          transform: [{ scale }],
        },
      ]}>
      <Animated.View style={[styles.dotInner, { backgroundColor }]} />
    </Animated.View>
  );
}

function PinKey({
  label,
  onPress,
  disabled,
  colors,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  colors: { text: string; card: string; border: string };
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.spring(scale, {
      toValue: 0.9,
      friction: 8,
      tension: 200,
      useNativeDriver: true,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 6,
      tension: 160,
      useNativeDriver: true,
    }).start();
  };

  if (!label) {
    return <View style={styles.keySlot} />;
  }

  const isDelete = label === '⌫';

  return (
    <View style={styles.keySlot}>
      <AnimatedPressable
        variant="none"
        disabled={disabled}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={[
          styles.key,
          {
            backgroundColor: isDelete ? 'transparent' : colors.card,
            borderColor: isDelete ? 'transparent' : colors.border,
          },
          cardShadow(false),
        ]}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Text
            style={[
              styles.keyText,
              {
                color: colors.text,
                fontSize: isDelete ? 22 : 28,
                fontWeight: isDelete ? '600' : '500',
              },
            ]}>
            {label}
          </Text>
        </Animated.View>
      </AnimatedPressable>
    </View>
  );
}

export function PinPadModal({
  visible,
  mode,
  pinLength,
  dismissible = true,
  onClose,
  onComplete,
}: Props) {
  const { colors, t } = useAppPreferences();
  const insets = useSafeAreaInsets();
  const [digits, setDigits] = useState('');
  const [error, setError] = useState(false);

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslate = useRef(new Animated.Value(48)).current;
  const shakeX = useRef(new Animated.Value(0)).current;
  const iconPulse = useRef(new Animated.Value(1)).current;

  const resetAnimations = useCallback(() => {
    overlayOpacity.setValue(0);
    sheetTranslate.setValue(48);
    shakeX.setValue(0);
  }, [overlayOpacity, sheetTranslate, shakeX]);

  const runEnter = useCallback(() => {
    resetAnimations();
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(sheetTranslate, {
        toValue: 0,
        friction: 9,
        tension: 72,
        useNativeDriver: true,
      }),
    ]).start();
  }, [overlayOpacity, resetAnimations, sheetTranslate]);

  const runShake = useCallback(() => {
    shakeX.setValue(0);
    Animated.sequence([
      Animated.timing(shakeX, { toValue: 14, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -14, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 10, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -10, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 0, duration: 45, useNativeDriver: true }),
    ]).start();
  }, [shakeX]);

  useEffect(() => {
    if (visible) {
      setDigits('');
      setError(false);
      runEnter();
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(iconPulse, {
            toValue: 1.06,
            duration: 1200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(iconPulse, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
    resetAnimations();
  }, [visible, mode, runEnter, resetAnimations, iconPulse]);

  useEffect(() => {
    if (digits.length !== pinLength) {
      return;
    }
    const result = onComplete(digits);
    if (result === false) {
      setError(true);
      runShake();
      const timer = setTimeout(() => {
        setDigits('');
        setError(false);
      }, 420);
      return () => clearTimeout(timer);
    }
    setDigits('');
    setError(false);
  }, [digits, pinLength, onComplete, runShake]);

  const title =
    mode === 'unlock'
      ? t('unlockApp')
      : mode === 'verify'
        ? t('enterPaymentPin')
        : mode === 'setup'
          ? t('createPaymentPin')
          : t('confirmPaymentPin');

  const stepLabel =
    mode === 'setup'
      ? t('pinSetupStep', { step: 1, total: 2 })
      : mode === 'setup-confirm'
        ? t('pinSetupStep', { step: 2, total: 2 })
        : null;

  const pressKey = (key: string) => {
    if (!key) {
      return;
    }
    if (key === '⌫') {
      setDigits(d => d.slice(0, -1));
      setError(false);
      return;
    }
    if (digits.length < pinLength) {
      setDigits(d => d + key);
      setError(false);
    }
  };

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: overlayOpacity,
            backgroundColor: colors.backgroundDeep + 'F0',
          },
        ]}>
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.cardElevated,
              paddingBottom: insets.bottom + space.xl,
              transform: [{ translateY: sheetTranslate }],
            },
            cardShadow(true),
          ]}>
          <View style={styles.handle} />

          <View style={styles.topRow}>
            {dismissible ? (
              <AnimatedPressable variant="soft" onPress={onClose} hitSlop={14}>
                <Text style={[styles.close, { color: colors.textMuted }]}>{t('cancel')}</Text>
              </AnimatedPressable>
            ) : (
              <View style={styles.stepPlaceholder} />
            )}
            {stepLabel ? (
              <View style={[styles.stepBadge, { backgroundColor: colors.brandSoft }]}>
                <Text style={[styles.stepText, { color: colors.brand }]}>{stepLabel}</Text>
              </View>
            ) : (
              <View style={styles.stepPlaceholder} />
            )}
          </View>

          <Animated.View
            style={[styles.iconWrap, { transform: [{ scale: iconPulse }] }]}>
            <AppIcon
              name="security"
              color={colors.brand}
              backgroundColor={colors.brandSoft}
              size={56}
            />
          </Animated.View>

          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>
            {pinLength} {t('pinDigits')}
          </Text>

          <Animated.View
            style={[styles.dotsRow, { transform: [{ translateX: shakeX }] }]}>
            {Array.from({ length: pinLength }).map((_, i) => (
              <PinDot
                key={i}
                filled={i < digits.length}
                active={i === digits.length && !error}
                error={error}
                colors={colors}
              />
            ))}
          </Animated.View>

          <View style={styles.errorSlot}>
            {error ? (
              <Animated.Text style={[styles.error, { color: colors.expense }]}>
                {mode === 'setup-confirm' ? t('pinMismatch') : t('wrongPin')}
              </Animated.Text>
            ) : null}
          </View>

          <View style={styles.pad}>
            {KEYS.map((key, idx) => (
              <PinKey
                key={`${key}-${idx}`}
                label={key}
                colors={colors}
                onPress={() => pressKey(key)}
                disabled={!key}
              />
            ))}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const DOT = 18;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingTop: space.sm,
    paddingHorizontal: space.lg,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(128,128,128,0.35)',
    marginBottom: space.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.lg,
  },
  close: { fontSize: 16, fontWeight: '600' },
  stepBadge: {
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radii.pill,
  },
  stepText: { fontSize: 13, fontWeight: '700' },
  stepPlaceholder: { width: 48 },
  iconWrap: {
    alignSelf: 'center',
    marginBottom: space.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: space.xs,
    letterSpacing: -0.3,
  },
  sub: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: space.xl,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: space.lg,
    marginBottom: space.md,
    minHeight: DOT + 8,
  },
  dotOuter: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotInner: {
    width: DOT - 6,
    height: DOT - 6,
    borderRadius: (DOT - 6) / 2,
  },
  errorSlot: {
    minHeight: 28,
    justifyContent: 'center',
    marginBottom: space.md,
  },
  error: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  pad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 320,
    alignSelf: 'center',
    gap: space.sm,
  },
  keySlot: {
    width: '30%',
    aspectRatio: 1,
    maxWidth: 88,
    maxHeight: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  key: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  keyText: {
    textAlign: 'center',
  },
});

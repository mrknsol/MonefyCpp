import React, { useEffect, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from './AnimatedPressable';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { radii, space } from '../theme/tokens';

type Props = {
  visible: boolean;
  mode: 'verify' | 'setup' | 'setup-confirm';
  pinLength: number;
  onClose: () => void;
  onComplete: (pin: string) => void;
};

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

export function PinPadModal({ visible, mode, pinLength, onClose, onComplete }: Props) {
  const { colors, t } = useAppPreferences();
  const insets = useSafeAreaInsets();
  const [digits, setDigits] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (visible) {
      setDigits('');
      setError(false);
    }
  }, [visible, mode]);

  useEffect(() => {
    if (digits.length === pinLength) {
      onComplete(digits);
      setDigits('');
    }
  }, [digits, pinLength, onComplete]);

  const title =
    mode === 'verify'
      ? t('enterPaymentPin')
      : mode === 'setup'
        ? t('createPaymentPin')
        : t('confirmPaymentPin');

  const pressKey = (key: string) => {
    if (key === '') {
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
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: 'rgba(6, 13, 24, 0.92)' }]}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + space.lg }]}>
          <View style={styles.handleRow}>
            <AnimatedPressable variant="soft" onPress={onClose} hitSlop={12}>
              <Text style={[styles.close, { color: colors.textMuted }]}>{t('cancel')}</Text>
            </AnimatedPressable>
          </View>

          <Text style={[styles.title, { color: colors.inverseText }]}>{title}</Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>
            {pinLength} {t('pinDigits')}
          </Text>

          <View style={styles.dotsRow}>
            {Array.from({ length: pinLength }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      i < digits.length ? colors.gold : 'transparent',
                    borderColor: colors.gold,
                  },
                ]}
              />
            ))}
          </View>

          {error ? (
            <Text style={[styles.error, { color: colors.expense }]}>{t('wrongPin')}</Text>
          ) : (
            <View style={styles.errorSpacer} />
          )}

          <View style={styles.pad}>
            {KEYS.map((key, idx) => (
              <AnimatedPressable
                key={`${key}-${idx}`}
                variant="icon"
                style={[
                  styles.key,
                  !key && styles.keyEmpty,
                  key && { backgroundColor: 'rgba(255,255,255,0.08)' },
                ]}
                onPress={() => pressKey(key)}
                disabled={!key}>
                <Text style={[styles.keyText, { color: colors.inverseText }]}>
                  {key}
                </Text>
              </AnimatedPressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingTop: space.md,
    paddingHorizontal: space.lg,
  },
  handleRow: {
    alignItems: 'flex-end',
    marginBottom: space.lg,
  },
  close: { fontSize: 16, fontWeight: '600' },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: space.xs,
  },
  sub: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: space.xl,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: space.md,
    marginBottom: space.sm,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  error: {
    textAlign: 'center',
    marginBottom: space.md,
    fontWeight: '600',
  },
  errorSpacer: { height: 24 },
  pad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: space.sm,
  },
  key: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyEmpty: { backgroundColor: 'transparent' },
  keyText: { fontSize: 28, fontWeight: '600' },
});

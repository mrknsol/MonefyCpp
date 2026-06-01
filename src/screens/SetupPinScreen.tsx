import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '../components/AnimatedPressable';
import { PinPadModal } from '../components/PinPadModal';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useSecurity } from '../context/SecurityContext';
import type { PinLength } from '../context/SecurityContext.types';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { authenticateWithBiometrics } from '../services/biometrics';
import { radii, space } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'SetupPin'>;

export function SetupPinScreen({ navigation }: Props) {
  const { colors, t } = useAppPreferences();
  const { setupPin, setFaceIdEnabled, biometricKind, hasPin } = useSecurity();
  const insets = useSafeAreaInsets();
  const [length, setLength] = useState<PinLength>(4);
  const [step, setStep] = useState<'choose' | 'enter' | 'confirm'>('choose');
  const [firstPin, setFirstPin] = useState('');
  const [showPad, setShowPad] = useState(false);

  const startSetup = () => {
    setFirstPin('');
    setStep('enter');
    setShowPad(true);
  };

  const onPinEntered = async (pin: string) => {
    if (step === 'enter') {
      setFirstPin(pin);
      setStep('confirm');
      return;
    }
    if (pin !== firstPin) {
      Alert.alert(t('error'), t('pinMismatch'));
      setStep('enter');
      setFirstPin('');
      return;
    }
    await setupPin(pin, length);
    setShowPad(false);
    Alert.alert(t('pinSaved'), t('pinSavedHint'), [
      {
        text: t('enableFaceId'),
        onPress: async () => {
          if (biometricKind !== 'none') {
            const ok = await authenticateWithBiometrics(t('biometricPrompt'));
            if (ok) {
              await setFaceIdEnabled(true);
            }
          }
          navigation.goBack();
        },
      },
      { text: t('later'), onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: colors.background, paddingTop: insets.top + space.lg },
      ]}>
      <Text style={[styles.title, { color: colors.text }]}>{t('paymentSecurity')}</Text>
      <Text style={[styles.sub, { color: colors.textMuted }]}>{t('paymentSecurityHint')}</Text>

      {step === 'choose' && (
        <>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t('pinLength')}</Text>
          <View style={styles.row}>
            {([4, 6] as PinLength[]).map(n => (
              <AnimatedPressable
                key={n}
                variant="soft"
                style={[
                  styles.lenBtn,
                  {
                    backgroundColor: length === n ? colors.brand : colors.card,
                    borderColor: length === n ? colors.brand : colors.border,
                  },
                ]}
                onPress={() => setLength(n)}>
                <Text
                  style={[
                    styles.lenTxt,
                    { color: length === n ? colors.inverseText : colors.text },
                  ]}>
                  {n} {t('pinDigits')}
                </Text>
              </AnimatedPressable>
            ))}
          </View>

          <AnimatedPressable
            variant="primary"
            style={[styles.primary, { backgroundColor: colors.brand }]}
            onPress={startSetup}>
            <Text style={[styles.primaryTxt, { color: colors.inverseText }]}>
              {hasPin ? t('changePin') : t('createPaymentPin')}
            </Text>
          </AnimatedPressable>
        </>
      )}

      <PinPadModal
        visible={showPad}
        mode={step === 'enter' ? 'setup' : 'setup-confirm'}
        pinLength={length}
        onClose={() => {
          setShowPad(false);
          setStep('choose');
        }}
        onComplete={onPinEntered}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: space.lg },
  title: { fontSize: 28, fontWeight: '800', marginBottom: space.sm },
  sub: { fontSize: 15, lineHeight: 22, marginBottom: space.xl },
  label: { fontSize: 14, fontWeight: '600', marginBottom: space.md },
  row: { flexDirection: 'row', gap: space.md, marginBottom: space.xl },
  lenBtn: {
    flex: 1,
    padding: space.lg,
    borderRadius: radii.lg,
    borderWidth: 2,
    alignItems: 'center',
  },
  lenTxt: { fontSize: 16, fontWeight: '700' },
  primary: {
    borderRadius: radii.lg,
    padding: space.lg,
    alignItems: 'center',
    marginTop: space.lg,
  },
  primaryTxt: { fontSize: 16, fontWeight: '700' },
});

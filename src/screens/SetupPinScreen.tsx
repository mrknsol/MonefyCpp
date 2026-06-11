import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '../components/AppIcon';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { PinPadModal } from '../components/PinPadModal';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useScreenTitle } from '../hooks/useScreenTitle';
import { useSecurity } from '../context/SecurityContext';
import type { PinLength } from '../context/SecurityContext.types';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { authenticateWithBiometrics } from '../services/biometrics';
import { cardShadow, radii, space } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'SetupPin'>;

type SetupStep = 'auth' | 'choose' | 'enter' | 'confirm';

export function SetupPinScreen({ navigation }: Props) {
  const { colors, t } = useAppPreferences();
  useScreenTitle('navSetupPin');
  const {
    setupPin,
    setFaceIdEnabled,
    biometricKind,
    hasPin,
    pinLength,
    faceIdEnabled,
    requirePaymentAuth,
  } = useSecurity();
  const insets = useSafeAreaInsets();
  const [length, setLength] = useState<PinLength>(pinLength);
  const [step, setStep] = useState<SetupStep>(hasPin ? 'auth' : 'choose');
  const [firstPin, setFirstPin] = useState('');
  const [showPad, setShowPad] = useState(false);
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    setLength(pinLength);
    setStep(hasPin ? 'auth' : 'choose');
  }, [hasPin, pinLength]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroOpacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(heroY, {
        toValue: 0,
        friction: 8,
        tension: 70,
        useNativeDriver: true,
      }),
    ]).start();
  }, [heroOpacity, heroY]);

  const proceedAfterAuth = () => {
    setStep('choose');
  };

  const tryFaceId = async () => {
    if (!faceIdEnabled || biometricKind === 'none') {
      return;
    }
    const ok = await authenticateWithBiometrics(t('biometricPrompt'));
    if (ok) {
      proceedAfterAuth();
    }
  };

  const tryCurrentPin = () => {
    requirePaymentAuth(proceedAfterAuth);
  };

  const startSetup = () => {
    setFirstPin('');
    setStep('enter');
    setShowPad(true);
  };

  const beginChange = () => {
    if (hasPin) {
      setStep('auth');
      return;
    }
    startSetup();
  };

  const finalizePin = async (pin: string) => {
    await setupPin(pin, length);
    setShowPad(false);
    setStep('choose');
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

  const handlePinComplete = (pin: string): boolean => {
    if (step === 'enter') {
      setFirstPin(pin);
      setStep('confirm');
      return true;
    }
    if (pin !== firstPin) {
      return false;
    }
    void finalizePin(pin);
    return true;
  };

  const showFaceIdOption = faceIdEnabled && biometricKind !== 'none';

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: colors.background, paddingTop: insets.top + space.lg },
      ]}>
      <Animated.View
        style={{
          opacity: heroOpacity,
          transform: [{ translateY: heroY }],
        }}>
        <View style={styles.heroIcon}>
          <AppIcon
            name="security"
            color={colors.brand}
            backgroundColor={colors.brandSoft}
            size={64}
          />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>{t('paymentSecurity')}</Text>
        <Text style={[styles.sub, { color: colors.textMuted }]}>
          {step === 'auth' ? t('confirmIdentityToChangePinHint') : t('paymentSecurityHint')}
        </Text>
      </Animated.View>

      {step === 'auth' && (
        <View style={[styles.authCard, { backgroundColor: colors.card, borderColor: colors.border }, cardShadow(false)]}>
          <Text style={[styles.authTitle, { color: colors.text }]}>{t('confirmIdentityToChangePin')}</Text>
          {showFaceIdOption ? (
            <AnimatedPressable
              variant="primary"
              style={[styles.authBtn, { backgroundColor: colors.brand }]}
              onPress={() => void tryFaceId()}>
              <Text style={[styles.authBtnText, { color: colors.inverseText }]}>
                {t('useFaceIdToChangePin')}
              </Text>
            </AnimatedPressable>
          ) : null}
          <AnimatedPressable
            variant="soft"
            style={[
              styles.authBtn,
              {
                backgroundColor: colors.chip,
                borderColor: colors.border,
                borderWidth: 1,
                marginTop: showFaceIdOption ? space.md : 0,
              },
            ]}
            onPress={tryCurrentPin}>
            <Text style={[styles.authBtnText, { color: colors.text }]}>{t('enterCurrentPinToChangePin')}</Text>
          </AnimatedPressable>
        </View>
      )}

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
                  cardShadow(length === n),
                ]}
                onPress={() => setLength(n)}>
                <Text
                  style={[
                    styles.lenNum,
                    { color: length === n ? colors.inverseText : colors.text },
                  ]}>
                  {n}
                </Text>
                <Text
                  style={[
                    styles.lenTxt,
                    { color: length === n ? colors.inverseText : colors.textMuted },
                  ]}>
                  {t('pinDigits')}
                </Text>
              </AnimatedPressable>
            ))}
          </View>

          <AnimatedPressable
            variant="primary"
            style={[styles.primary, { backgroundColor: colors.brand }]}
            onPress={hasPin ? startSetup : beginChange}>
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
          setStep(hasPin ? 'choose' : 'choose');
          setFirstPin('');
        }}
        onComplete={handlePinComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: space.lg },
  heroIcon: { alignSelf: 'center', marginBottom: space.lg },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: space.sm,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  sub: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: space.xl,
    textAlign: 'center',
  },
  authCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: space.lg,
    marginBottom: space.xl,
  },
  authTitle: { fontSize: 17, fontWeight: '700', marginBottom: space.lg, textAlign: 'center' },
  authBtn: {
    borderRadius: radii.lg,
    padding: space.lg,
    alignItems: 'center',
  },
  authBtnText: { fontSize: 16, fontWeight: '700' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: space.md },
  row: { flexDirection: 'row', gap: space.md, marginBottom: space.xl },
  lenBtn: {
    flex: 1,
    paddingVertical: space.lg,
    paddingHorizontal: space.md,
    borderRadius: radii.lg,
    borderWidth: 2,
    alignItems: 'center',
  },
  lenNum: { fontSize: 32, fontWeight: '800', marginBottom: space.xs },
  lenTxt: { fontSize: 13, fontWeight: '600' },
  primary: {
    borderRadius: radii.lg,
    padding: space.lg,
    alignItems: 'center',
    marginTop: space.lg,
  },
  primaryTxt: { fontSize: 16, fontWeight: '700' },
});

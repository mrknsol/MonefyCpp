import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  apiForgotPasswordReset,
  apiForgotPasswordSendCode,
} from '../api/accountSecurity';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { LoadingButtonContent } from '../components/LoadingButtonContent';
import { VerificationCodeInput } from '../components/VerificationCodeInput';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useAuth } from '../context/AuthContext';
import type { AuthStackParamList } from '../navigation/AuthNavigator';
import type { ForgotPasswordParams } from '../navigation/forgotPasswordParams';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { cardShadow, radii, space } from '../theme/tokens';

type Props = NativeStackScreenProps<
  AuthStackParamList & RootStackParamList,
  'ForgotPassword'
>;

type Step = 'email' | 'reset';

export function ForgotPasswordScreen({ navigation, route }: Props) {
  const { colors, t } = useAppPreferences();
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();
  const fromLoggedIn = route.params?.fromLoggedIn ?? false;
  const lockedEmail = fromLoggedIn ? route.params?.email?.trim().toLowerCase() : undefined;
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState(lockedEmail ?? route.params?.email ?? '');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (lockedEmail) {
      setEmail(lockedEmail);
    }
  }, [lockedEmail]);

  const sendCode = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      Alert.alert(t('error'), t('emailRequired'));
      return;
    }
    setIsLoading(true);
    try {
      const res = await apiForgotPasswordSendCode(trimmed);
      setStep('reset');
      if (res.devCode) {
        Alert.alert(t('devCodeTitle'), t('devCodeBody', { code: res.devCode }));
      } else {
        Alert.alert(t('codeSentTitle'), t('codeSentBody'));
      }
    } catch (e: unknown) {
      Alert.alert(t('error'), e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert(t('error'), t('passwordMinLength'));
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t('error'), t('pinMismatch'));
      return;
    }
    if (code.length < 6) {
      Alert.alert(t('error'), t('codeRequired'));
      return;
    }
    setIsLoading(true);
    try {
      await apiForgotPasswordReset(email.trim().toLowerCase(), code, newPassword);
      Alert.alert(t('passwordChangedTitle'), t('passwordChangedBody'), [
        {
          text: t('ok'),
          onPress: () => {
            if (fromLoggedIn) {
              logout();
              navigation.goBack();
            } else {
              navigation.navigate('Login');
            }
          },
        },
      ]);
    } catch (e: unknown) {
      Alert.alert(t('error'), e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.xl },
        ]}
        keyboardShouldPersistTaps="handled">
        <AnimatedPressable variant="soft" onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={[styles.back, { color: colors.brand }]}>← {t('back')}</Text>
        </AnimatedPressable>

        <Text style={[styles.title, { color: colors.text }]}>{t('forgotPasswordTitle')}</Text>
        <Text style={[styles.sub, { color: colors.textMuted }]}>
          {step === 'email' ? t('forgotPasswordHint') : t('forgotPasswordCodeHint')}
        </Text>

        <View style={[styles.card, { backgroundColor: colors.card }, cardShadow(false)]}>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.chip, color: colors.text, borderColor: colors.border },
            ]}
            placeholder={t('emailPlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={step === 'email' && !isLoading && !lockedEmail}
          />

          {step === 'reset' ? (
            <>
              <VerificationCodeInput
                value={code}
                onChange={setCode}
                colors={colors}
                label={t('verificationCode')}
                hint={t('verificationCodeHint', { email })}
              />
              <View style={styles.secondaryRow}>
                <AnimatedPressable variant="soft" onPress={sendCode} disabled={isLoading}>
                  <Text style={[styles.secondaryLink, { color: colors.brand }]}>
                    {t('resendCode')}
                  </Text>
                </AnimatedPressable>
              </View>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.chip, color: colors.text, borderColor: colors.border },
                ]}
                placeholder={t('newPassword')}
                placeholderTextColor={colors.textMuted}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.chip, color: colors.text, borderColor: colors.border },
                ]}
                placeholder={t('confirmPassword')}
                placeholderTextColor={colors.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </>
          ) : null}

          <AnimatedPressable
            variant="primary"
            disabled={isLoading}
            style={[
              styles.btn,
              { backgroundColor: colors.brand, opacity: isLoading ? 0.7 : 1 },
            ]}
            onPress={step === 'email' ? sendCode : resetPassword}>
            {isLoading ? (
              <LoadingButtonContent
                label={step === 'email' ? t('sendCode') : t('resetPassword')}
                textColor={colors.inverseText}
              />
            ) : (
              <Text style={[styles.btnText, { color: colors.inverseText }]}>
                {step === 'email' ? t('sendCode') : t('resetPassword')}
              </Text>
            )}
          </AnimatedPressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: space.lg },
  back: { fontSize: 16, fontWeight: '600', marginBottom: space.lg },
  title: { fontSize: 26, fontWeight: '800', marginBottom: space.sm },
  sub: { fontSize: 15, lineHeight: 22, marginBottom: space.xl },
  card: {
    borderRadius: radii.xl,
    padding: space.lg,
  },
  input: {
    height: 54,
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: space.lg,
    marginBottom: space.md,
    fontSize: 16,
  },
  btn: {
    height: 54,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.sm,
  },
  btnText: { fontSize: 17, fontWeight: '800' },
  secondaryRow: {
    alignItems: 'flex-end',
    marginTop: -space.sm,
    marginBottom: space.md,
  },
  secondaryLink: { fontSize: 14, fontWeight: '600' },
});

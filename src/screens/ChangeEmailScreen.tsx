import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
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

import { getApiToken } from '../api/client';
import { apiChangeEmailConfirm, apiChangeEmailSendCode } from '../api/accountSecurity';
import { upsertSavedAccount } from '../services/savedAccounts';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { LoadingButtonContent } from '../components/LoadingButtonContent';
import { VerificationCodeInput } from '../components/VerificationCodeInput';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useScreenTitle } from '../hooks/useScreenTitle';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { cardShadow, radii, space } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'ChangeEmail'>;

type Step = 'email' | 'code';

export function ChangeEmailScreen({ navigation }: Props) {
  const { colors, t } = useAppPreferences();
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState<Step>('email');
  const [newEmail, setNewEmail] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useScreenTitle('changeEmailTitle');

  const trimmedEmail = newEmail.trim().toLowerCase();

  const sendCode = async () => {
    if (!trimmedEmail) {
      Alert.alert(t('error'), t('emailRequired'));
      return;
    }
    if (trimmedEmail === user?.email?.toLowerCase()) {
      Alert.alert(t('error'), t('sameEmailError'));
      return;
    }
    setIsLoading(true);
    try {
      const res = await apiChangeEmailSendCode(trimmedEmail);
      setStep('code');
      setCode('');
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

  const confirm = async () => {
    if (code.length < 6) {
      Alert.alert(t('error'), t('codeRequired'));
      return;
    }
    setIsLoading(true);
    try {
      const res = await apiChangeEmailConfirm(trimmedEmail, code);
      await updateUser({ email: res.user.email });
      const token = await getApiToken();
      if (token) {
        await upsertSavedAccount({
          id: res.user.id,
          email: res.user.email,
          token,
          name: res.user.name,
        });
      }
      Alert.alert(t('emailChangedTitle'), t('emailChangedBody'), [
        { text: t('ok'), onPress: () => navigation.goBack() },
      ]);
    } catch (e: unknown) {
      Alert.alert(t('error'), e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  };

  const backToEmail = () => {
    setStep('email');
    setCode('');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        <Text style={[styles.current, { color: colors.textMuted }]}>
          {t('currentEmail')}: <Text style={{ color: colors.text }}>{user?.email}</Text>
        </Text>

        <View style={styles.stepRow}>
          <View
            style={[
              styles.stepBadge,
              { backgroundColor: step === 'email' ? colors.brand : colors.chip },
            ]}>
            <Text
              style={[
                styles.stepBadgeText,
                { color: step === 'email' ? colors.inverseText : colors.textMuted },
              ]}>
              1
            </Text>
          </View>
          <View style={[styles.stepLine, { backgroundColor: colors.border }]} />
          <View
            style={[
              styles.stepBadge,
              { backgroundColor: step === 'code' ? colors.brand : colors.chip },
            ]}>
            <Text
              style={[
                styles.stepBadgeText,
                { color: step === 'code' ? colors.inverseText : colors.textMuted },
              ]}>
              2
            </Text>
          </View>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          {step === 'email' ? t('changeEmailStep1Title') : t('changeEmailStep2Title')}
        </Text>
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          {step === 'email' ? t('changeEmailHint') : t('changeEmailCodeHint')}
        </Text>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, cardShadow(false)]}>
          {step === 'email' ? (
            <>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{t('newEmail')}</Text>
              <TextInput
                style={[styles.input, fieldStyle(colors)]}
                placeholder={t('newEmail')}
                placeholderTextColor={colors.textMuted}
                value={newEmail}
                onChangeText={setNewEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </>
          ) : (
            <>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{t('newEmail')}</Text>
              <Text style={[styles.emailReadonly, { color: colors.text, backgroundColor: colors.chip }]}>
                {trimmedEmail}
              </Text>
              <VerificationCodeInput
                value={code}
                onChange={setCode}
                colors={colors}
                label={t('verificationCode')}
                hint={t('verificationCodeHint', { email: trimmedEmail })}
              />
              <View style={styles.secondaryRow}>
                <AnimatedPressable variant="soft" onPress={backToEmail} disabled={isLoading}>
                  <Text style={[styles.secondaryLink, { color: colors.brand }]}>{t('editEmail')}</Text>
                </AnimatedPressable>
                <AnimatedPressable variant="soft" onPress={sendCode} disabled={isLoading}>
                  <Text style={[styles.secondaryLink, { color: colors.brand }]}>{t('resendCode')}</Text>
                </AnimatedPressable>
              </View>
            </>
          )}

          <AnimatedPressable
            variant="primary"
            disabled={isLoading}
            style={[styles.btn, { backgroundColor: colors.brand, opacity: isLoading ? 0.7 : 1 }]}
            onPress={step === 'email' ? sendCode : confirm}>
            {isLoading ? (
              <LoadingButtonContent
                label={step === 'email' ? t('sendCode') : t('confirm')}
                textColor={colors.inverseText}
              />
            ) : (
              <Text style={[styles.btnText, { color: colors.inverseText }]}>
                {step === 'email' ? t('sendCode') : t('confirm')}
              </Text>
            )}
          </AnimatedPressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function fieldStyle(colors: { chip: string; text: string; border: string }) {
  return {
    backgroundColor: colors.chip,
    color: colors.text,
    borderColor: colors.border,
  };
}

const styles = StyleSheet.create({
  wrap: { padding: space.lg, paddingBottom: space.xxl },
  current: { fontSize: 14, marginBottom: space.lg },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space.lg,
    alignSelf: 'center',
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: { fontSize: 14, fontWeight: '800' },
  stepLine: { width: 48, height: 2, marginHorizontal: space.sm },
  title: { fontSize: 22, fontWeight: '800', marginBottom: space.sm },
  hint: { fontSize: 14, lineHeight: 20, marginBottom: space.lg },
  card: { borderRadius: radii.lg, borderWidth: 1, padding: space.lg },
  label: { fontSize: 13, fontWeight: '600', marginBottom: space.xs },
  input: {
    height: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: space.md,
    marginBottom: space.md,
    fontSize: 16,
  },
  emailReadonly: {
    height: 52,
    borderRadius: radii.md,
    paddingHorizontal: space.md,
    marginBottom: space.md,
    fontSize: 16,
    lineHeight: 52,
    overflow: 'hidden',
  },
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: space.md,
  },
  secondaryLink: { fontSize: 14, fontWeight: '600' },
  btn: {
    height: 52,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.sm,
  },
  btnText: { fontSize: 16, fontWeight: '700' },
});

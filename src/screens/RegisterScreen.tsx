import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '../components/AnimatedPressable';
import { LoadingButtonContent } from '../components/LoadingButtonContent';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useAuth } from '../context/AuthContext';
import type { AuthStackParamList } from '../navigation/AuthNavigator';
import { cardShadow, radii, space } from '../theme/tokens';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { colors, t } = useAppPreferences();
  const { register } = useAuth();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert(t('error'), t('fillAllFields'));
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert(t('error'), t('pinMismatch'));
      return;
    }
    if (password.length < 6) {
      Alert.alert(t('error'), t('passwordMinLength'));
      return;
    }

    setIsLoading(true);
    try {
      await register(email, password, name);
    } catch (error) {
      Alert.alert(t('error'), error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.backgroundDeep, paddingTop: insets.top },
      ]}>
      <View style={[styles.heroBand, { backgroundColor: colors.bankCardStart }]}>
        <View style={[styles.heroGlow, { backgroundColor: colors.bankCardEnd }]} />
        <Text style={[styles.bankLogo, { color: colors.onBankCard }]}>MONEFY</Text>
        <Text style={[styles.bankSub, { color: 'rgba(255,255,255,0.7)' }]}>
          {t('registerSubtitle')}
        </Text>
      </View>

      <View
        style={[styles.sheet, { backgroundColor: colors.card }, cardShadow(true)]}>
        <Text style={[styles.title, { color: colors.text }]}>{t('signUpLink')}</Text>

        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.chip, color: colors.text, borderColor: colors.border },
          ]}
          placeholder={t('profileName')}
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
        />
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
        />
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.chip, color: colors.text, borderColor: colors.border },
          ]}
          placeholder={t('password')}
          placeholderTextColor={colors.textMuted}
          value={password}
          onChangeText={setPassword}
          autoComplete="off"
          importantForAutofill="no"
          textContentType="none"
          passwordRules=""
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
          autoComplete="off"
          importantForAutofill="no"
          textContentType="none"
          passwordRules=""
          secureTextEntry
        />

        <AnimatedPressable
          variant="primary"
          style={[styles.button, { backgroundColor: colors.brand }]}
          onPress={handleRegister}
          disabled={isLoading}>
          {isLoading ? (
            <LoadingButtonContent
              label={t('saving')}
              textColor={colors.inverseText}
            />
          ) : (
            <Text style={[styles.buttonText, { color: colors.inverseText }]}>
              {t('signUpLink')}
            </Text>
          )}
        </AnimatedPressable>

        <AnimatedPressable
          variant="soft"
          style={styles.footer}
          onPress={() => navigation.navigate('Login')}>
          <Text style={[styles.link, { color: colors.brand }]}>{t('signIn')}</Text>
        </AnimatedPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroBand: {
    paddingTop: space.xxl,
    paddingBottom: space.xxl * 1.5,
    paddingHorizontal: space.xl,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -40,
    right: -30,
    opacity: 0.5,
  },
  bankLogo: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 3,
  },
  bankSub: { fontSize: 15, marginTop: space.sm, fontWeight: '500' },
  sheet: {
    flex: 1,
    marginTop: -space.xl,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: space.xl,
  },
  title: { fontSize: 26, fontWeight: '800', marginBottom: space.xl },
  input: {
    height: 54,
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: space.lg,
    marginBottom: space.md,
    fontSize: 16,
  },
  button: {
    height: 54,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.sm,
  },
  buttonText: { fontSize: 17, fontWeight: '800' },
  footer: { marginTop: space.xl, alignItems: 'center' },
  link: { fontSize: 15, fontWeight: '700' },
});

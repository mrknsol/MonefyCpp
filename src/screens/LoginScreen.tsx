import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppPreferences } from '../context/AppPreferencesContext';
import { useAuth } from '../context/AuthContext';
import { cardShadow, radii, space } from '../theme/tokens';

export function LoginScreen({ onRegister }: { onRegister: () => void }) {
  const { colors, t } = useAppPreferences();
  const { login } = useAuth();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('error'), t('password'));
      return;
    }
    setIsLoading(true);
    try {
      await login(email, password);
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
        <Text style={[styles.bankLogo, { color: colors.onBankCard }]}>MONEFY BANK</Text>
        <Text style={[styles.bankSub, { color: 'rgba(255,255,255,0.7)' }]}>
          {t('bankTagline')}
        </Text>
      </View>

      <View
        style={[styles.sheet, { backgroundColor: colors.card }, cardShadow(true)]}>
        <Text style={[styles.title, { color: colors.text }]}>{t('welcomeBack')}</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {t('loginSubtitle')}
        </Text>

        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.chip, color: colors.text, borderColor: colors.border },
          ]}
          placeholder="Email"
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
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.brand }]}
          onPress={handleLogin}
          disabled={isLoading}>
          <Text style={[styles.buttonText, { color: colors.inverseText }]}>
            {isLoading ? '...' : t('signIn')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footer} onPress={onRegister}>
          <Text style={[styles.link, { color: colors.brand }]}>{t('signUpLink')}</Text>
        </TouchableOpacity>

        <Text style={[styles.demo, { color: colors.textMuted }]}>
          demo@monefy.com / demo123
        </Text>
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
  title: { fontSize: 26, fontWeight: '800', marginBottom: space.xs },
  subtitle: { fontSize: 15, marginBottom: space.xl },
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
  demo: { marginTop: space.xl, textAlign: 'center', fontSize: 12 },
});

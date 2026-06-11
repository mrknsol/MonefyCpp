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

import { apiChangePassword } from '../api/accountSecurity';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { LoadingButtonContent } from '../components/LoadingButtonContent';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useScreenTitle } from '../hooks/useScreenTitle';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { cardShadow, radii, space } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'ChangePassword'>;

export function ChangePasswordScreen({ navigation }: Props) {
  const { colors, t } = useAppPreferences();
  const { user } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useScreenTitle('changePasswordTitle');

  const save = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert(t('error'), t('fillAllFields'));
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert(t('error'), t('passwordMinLength'));
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t('error'), t('pinMismatch'));
      return;
    }
    setIsLoading(true);
    try {
      await apiChangePassword(oldPassword, newPassword);
      Alert.alert(t('passwordChangedTitle'), t('passwordChangedBody'), [
        { text: t('ok'), onPress: () => navigation.goBack() },
      ]);
    } catch (e: unknown) {
      Alert.alert(t('error'), e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  };

  const resetViaEmail = () => {
    navigation.navigate('ForgotPassword', {
      email: user?.email,
      fromLoggedIn: true,
    });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        <Text style={[styles.hint, { color: colors.textMuted }]}>{t('changePasswordHint')}</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, cardShadow(false)]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t('currentPassword')}</Text>
          <TextInput
            style={[styles.input, fieldStyle(colors)]}
            placeholder={t('currentPassword')}
            placeholderTextColor={colors.textMuted}
            value={oldPassword}
            onChangeText={setOldPassword}
            secureTextEntry
          />
          <AnimatedPressable variant="soft" onPress={resetViaEmail} style={styles.forgotLink}>
            <Text style={[styles.forgotText, { color: colors.brand }]}>{t('forgotCurrentPassword')}</Text>
          </AnimatedPressable>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t('newPassword')}</Text>
          <TextInput
            style={[styles.input, fieldStyle(colors)]}
            placeholder={t('newPassword')}
            placeholderTextColor={colors.textMuted}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t('confirmPassword')}</Text>
          <TextInput
            style={[styles.input, fieldStyle(colors)]}
            placeholder={t('confirmPassword')}
            placeholderTextColor={colors.textMuted}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
          <AnimatedPressable
            variant="primary"
            disabled={isLoading}
            style={[styles.btn, { backgroundColor: colors.brand, opacity: isLoading ? 0.7 : 1 }]}
            onPress={save}>
            {isLoading ? (
              <LoadingButtonContent label={t('save')} textColor={colors.inverseText} />
            ) : (
              <Text style={[styles.btnText, { color: colors.inverseText }]}>{t('save')}</Text>
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
  forgotLink: { alignSelf: 'flex-start', marginTop: -space.sm, marginBottom: space.md },
  forgotText: { fontSize: 14, fontWeight: '600' },
  btn: {
    height: 52,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.sm,
  },
  btnText: { fontSize: 16, fontWeight: '700' },
});

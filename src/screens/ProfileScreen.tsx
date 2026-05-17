import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppPreferences } from '../context/AppPreferencesContext';
import { useAuth } from '../context/AuthContext';
import { useSecurity } from '../context/SecurityContext';
import { authenticateWithBiometrics } from '../services/biometrics';
import { cardShadow, radii, space } from '../theme/tokens';

export function ProfileScreen() {
  const { colors, t, locale, setLocale, themeMode, setThemeMode } = useAppPreferences();
  const { user, logout } = useAuth();
  const { hasPin, faceIdEnabled, setFaceIdEnabled, biometricKind } = useSecurity();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const handleLogout = () => {
    Alert.alert(t('logoutTitle'), t('logoutConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('logout'), style: 'destructive', onPress: logout },
    ]);
  };

  const toggleFaceId = async (value: boolean) => {
    if (!hasPin) {
      Alert.alert(t('paymentSecurity'), t('paymentSecurityHint'));
      navigation.navigate('SetupPin');
      return;
    }
    if (value && biometricKind !== 'none') {
      const ok = await authenticateWithBiometrics(t('biometricPrompt'));
      if (!ok) {
        return;
      }
    }
    await setFaceIdEnabled(value);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: insets.top + space.lg,
        paddingBottom: insets.bottom + space.xl,
        paddingHorizontal: space.lg,
      }}>
      <View
        style={[
          styles.profileCard,
          { backgroundColor: colors.bankCardStart },
          cardShadow(true),
        ]}>
        <View style={[styles.profileGlow, { backgroundColor: colors.bankCardEnd }]} />
        <View style={[styles.avatar, { backgroundColor: colors.gold }]}>
          <Text style={[styles.avatarText, { color: colors.bankCardStart }]}>
            {user?.name.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={[styles.profileName, { color: colors.onBankCard }]}>
          {user?.name || t('user')}
        </Text>
        <Text style={[styles.profileEmail, { color: 'rgba(255,255,255,0.75)' }]}>
          {user?.email}
        </Text>
      </View>

      <View
        style={[
          styles.section,
          { backgroundColor: colors.card, borderColor: colors.border },
          cardShadow(false),
        ]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('paymentSecurity')}
        </Text>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => navigation.navigate('SetupPin')}>
          <View style={styles.settingLeft}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              {hasPin ? t('changePin') : t('createPaymentPin')}
            </Text>
            <Text style={[styles.settingValue, { color: colors.textMuted }]}>
              {hasPin ? '••••' : t('paymentSecurityHint')}
            </Text>
          </View>
          <Text style={[styles.chevron, { color: colors.brand }]}>›</Text>
        </TouchableOpacity>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              {t('faceId')}
            </Text>
            <Text style={[styles.settingValue, { color: colors.textMuted }]}>
              {biometricKind === 'none'
                ? t('faceIdUnavailable')
                : t('faceIdHint')}
            </Text>
          </View>
          <Switch
            value={faceIdEnabled}
            onValueChange={toggleFaceId}
            disabled={biometricKind === 'none' || !hasPin}
            trackColor={{ false: colors.border, true: colors.brandSoft }}
            thumbColor={faceIdEnabled ? colors.brand : colors.textMuted}
          />
        </View>
      </View>

      <View
        style={[
          styles.section,
          { backgroundColor: colors.card, borderColor: colors.border },
          cardShadow(false),
        ]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('settingsTitle')}</Text>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => setLocale(locale === 'ru' ? 'en' : 'ru')}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            {t('languageLabel')}
          </Text>
          <Text style={[styles.settingValue, { color: colors.brand }]}>
            {locale === 'ru' ? t('russian') : t('english')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => {
            const modes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
            const i = modes.indexOf(themeMode);
            setThemeMode(modes[(i + 1) % modes.length]);
          }}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>{t('themeLabel')}</Text>
          <Text style={[styles.settingValue, { color: colors.brand }]}>
            {themeMode === 'light'
              ? t('themeLight')
              : themeMode === 'dark'
                ? t('themeDark')
                : t('themeSystem')}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.logoutButton, { borderColor: colors.expense }]}
        onPress={handleLogout}>
        <Text style={[styles.logoutText, { color: colors.expense }]}>{t('logout')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  profileCard: {
    borderRadius: radii.xl,
    padding: space.xl,
    alignItems: 'center',
    marginBottom: space.lg,
    overflow: 'hidden',
  },
  profileGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    top: -50,
    right: -30,
    opacity: 0.4,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  avatarText: { fontSize: 28, fontWeight: '900' },
  profileName: { fontSize: 22, fontWeight: '800' },
  profileEmail: { fontSize: 14, marginTop: space.xs },
  section: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: space.lg,
    marginBottom: space.lg,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginBottom: space.md },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  settingLeft: { flex: 1, marginRight: space.md },
  settingLabel: { fontSize: 16, fontWeight: '600' },
  settingValue: { fontSize: 13, marginTop: 4 },
  chevron: { fontSize: 22, fontWeight: '300' },
  logoutButton: {
    borderRadius: radii.lg,
    borderWidth: 2,
    padding: space.lg,
    alignItems: 'center',
    marginTop: space.md,
  },
  logoutText: { fontSize: 16, fontWeight: '800' },
});

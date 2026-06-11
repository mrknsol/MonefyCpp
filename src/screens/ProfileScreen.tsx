import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '../components/AnimatedPressable';
import { LoadingButtonContent } from '../components/LoadingButtonContent';
import { LanguagePicker } from '../components/LanguagePicker';
import { ProfileAccountsSection } from '../components/ProfileAccountsSection';
import { PhoneCountryPicker } from '../components/PhoneCountryPicker';
import { apiUpdatePhone } from '../api/profile';
import {
  defaultPhoneCountry,
  detectCountryFromPhone,
  formatPhoneWithDial,
  stripDialCode,
  type PhoneCountry,
} from '../constants/phoneCountries';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useAuth } from '../context/AuthContext';
import { useSecurity } from '../context/SecurityContext';
import { authenticateWithBiometrics } from '../services/biometrics';
import { unreadCount } from '../services/messages';
import { cardShadow, radii, space } from '../theme/tokens';

export function ProfileScreen() {
  const { colors, t, locale, setLocale, themeMode, setThemeMode } = useAppPreferences();
  const { user, logout, beginSwitchAccount, updateUser } = useAuth();
  const { hasPin, faceIdEnabled, setFaceIdEnabled, biometricKind } = useSecurity();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [phoneCountry, setPhoneCountry] = useState<PhoneCountry>(() =>
    defaultPhoneCountry(locale),
  );
  const [phoneLocal, setPhoneLocal] = useState('');
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const glowA = useRef(new Animated.Value(0)).current;
  const glowB = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const glowALoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowA, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glowA, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    const glowBLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowB, {
          toValue: 1,
          duration: 3400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glowB, {
          toValue: 0,
          duration: 3400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    glowALoop.start();
    glowBLoop.start();
    return () => {
      glowALoop.stop();
      glowBLoop.stop();
    };
  }, [glowA, glowB]);

  const glowAScale = glowA.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.08],
  });
  const glowAOpacity = glowA.interpolate({
    inputRange: [0, 1],
    outputRange: [0.18, 0.34],
  });
  const glowBScale = glowB.interpolate({
    inputRange: [0, 1],
    outputRange: [1.08, 0.92],
  });
  const glowBOpacity = glowB.interpolate({
    inputRange: [0, 1],
    outputRange: [0.12, 0.28],
  });

  React.useEffect(() => {
    if (!user?.phone) {
      setPhoneCountry(defaultPhoneCountry(locale));
      setPhoneLocal('');
      return;
    }
    const country = detectCountryFromPhone(user.phone, locale);
    setPhoneCountry(country);
    setPhoneLocal(stripDialCode(user.phone));
  }, [user?.phone, locale]);

  const refreshUnread = useCallback(async () => {
    if (!user?.id) {
      setUnreadMessages(0);
      return;
    }
    setUnreadMessages(await unreadCount(user.id));
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      refreshUnread();
    }, [refreshUnread]),
  );

  const handleLogout = () => {
    Alert.alert(t('logoutTitle'), t('logoutConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('logout'), style: 'destructive', onPress: logout },
    ]);
  };

  const handleSwitchAccount = () => {
    beginSwitchAccount().catch((e: unknown) => {
      Alert.alert(t('error'), String(e));
    });
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

  const savePhone = async () => {
    const phone = formatPhoneWithDial(phoneCountry, phoneLocal);
    if (phone.length > 0 && phone.replace(/\D/g, '').length < 10) {
      Alert.alert(t('error'), t('phoneInvalid'));
      return;
    }

    setIsSavingPhone(true);
    try {
      const updated = await apiUpdatePhone(phone);
      await updateUser({ phone: updated.phone });
      Alert.alert(t('phoneSaved'));
    } catch (e: unknown) {
      Alert.alert(t('error'), String(e));
    } finally {
      setIsSavingPhone(false);
    }
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
        <Animated.View
          style={[
            styles.profileBlobLarge,
            {
              backgroundColor: colors.bankCardEnd,
              opacity: glowAOpacity,
              transform: [{ scale: glowAScale }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.profileBlobSmall,
            {
              backgroundColor: colors.gold,
              opacity: glowBOpacity,
              transform: [{ scale: glowBScale }],
            },
          ]}
        />
        <View style={styles.profileTopRow}>
          <View style={[styles.avatar, { backgroundColor: colors.gold }]}>
            <Text style={[styles.avatarText, { color: colors.bankCardStart }]}>
              {user?.name.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.profileMainInfo}>
            <Text style={[styles.profileName, { color: colors.onBankCard }]}>
              {user?.name || t('user')}
            </Text>
            <Text style={[styles.profileEmail, { color: 'rgba(255,255,255,0.75)' }]}>
              {user?.email}
            </Text>
            {user?.phone ? (
              <Text style={[styles.profilePhone, { color: 'rgba(255,255,255,0.75)' }]}>
                {user.phone}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={styles.profileStatusRow}>
          <View style={styles.profileStatusPill}>
            <Text style={[styles.profileStatusValue, { color: colors.gold }]}>
              {hasPin ? t('statusOn') : t('statusOff')}
            </Text>
            <Text style={[styles.profileStatusLabel, { color: 'rgba(255,255,255,0.62)' }]}>
              {t('pinShort')}
            </Text>
          </View>
          <View style={styles.profileStatusPill}>
            <Text style={[styles.profileStatusValue, { color: colors.gold }]}>
              {faceIdEnabled ? t('statusOn') : t('statusOff')}
            </Text>
            <Text style={[styles.profileStatusLabel, { color: 'rgba(255,255,255,0.62)' }]}>
              {t('faceId')}
            </Text>
          </View>
          <View style={styles.profileStatusPill}>
            <Text style={[styles.profileStatusValue, { color: colors.gold }]}>
              {unreadMessages}
            </Text>
            <Text style={[styles.profileStatusLabel, { color: 'rgba(255,255,255,0.62)' }]}>
              {t('messagesTitle')}
            </Text>
          </View>
        </View>
      </View>

      <ProfileAccountsSection />

      <View
        style={[
          styles.section,
          { backgroundColor: colors.card, borderColor: colors.border },
          cardShadow(false),
        ]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('accountSecurity')}</Text>

        <AnimatedPressable
          variant="soft"
          style={styles.settingItem}
          onPress={() => navigation.navigate('ChangeEmail')}>
          <View style={styles.settingLeft}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              {t('changeEmailTitle')}
            </Text>
            <Text style={[styles.settingValue, { color: colors.textMuted }]}>
              {user?.email}
            </Text>
          </View>
          <Text style={[styles.chevron, { color: colors.brand }]}>›</Text>
        </AnimatedPressable>

        <AnimatedPressable
          variant="soft"
          style={styles.settingItem}
          onPress={() => navigation.navigate('ChangePassword')}>
          <View style={styles.settingLeft}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              {t('changePasswordTitle')}
            </Text>
            <Text style={[styles.settingValue, { color: colors.textMuted }]}>
              {t('changePasswordMenuHint')}
            </Text>
          </View>
          <Text style={[styles.chevron, { color: colors.brand }]}>›</Text>
        </AnimatedPressable>
      </View>

      <View
        style={[
          styles.section,
          { backgroundColor: colors.card, borderColor: colors.border },
          cardShadow(false),
        ]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('phoneBinding')}</Text>
        <Text style={[styles.sectionHint, { color: colors.textMuted }]}>{t('phoneBindingHint')}</Text>
        <PhoneCountryPicker
          colors={colors}
          country={phoneCountry}
          localNumber={phoneLocal}
          onCountryChange={setPhoneCountry}
          onLocalNumberChange={setPhoneLocal}
          placeholder={t('phoneLocalPlaceholder')}
          selectCountryLabel={t('selectCountry')}
          t={t}
        />
        <AnimatedPressable
          variant="primary"
          style={[
            styles.savePhoneBtn,
            { backgroundColor: colors.brand, opacity: isSavingPhone ? 0.7 : 1 },
          ]}
          onPress={savePhone}
          disabled={isSavingPhone}>
          {isSavingPhone ? (
            <LoadingButtonContent label={t('saving')} textColor={colors.inverseText} />
          ) : (
            <Text style={[styles.savePhoneText, { color: colors.inverseText }]}>
              {t('bindPhone')}
            </Text>
          )}
        </AnimatedPressable>
      </View>

      <View
        style={[
          styles.section,
          { backgroundColor: colors.card, borderColor: colors.border },
          cardShadow(false),
        ]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('supportTitle')}</Text>

        <AnimatedPressable
          variant="soft"
          style={styles.settingItem}
          onPress={() => navigation.navigate('Messages')}>
          <View style={styles.settingLeft}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              {t('messagesTitle')}
            </Text>
            <Text style={[styles.settingValue, { color: colors.textMuted }]}>
              {t('messagesHint')}
            </Text>
          </View>
          <View style={styles.settingRight}>
            {unreadMessages > 0 ? (
              <View style={[styles.badge, { backgroundColor: colors.brand }]}>
                <Text style={[styles.badgeText, { color: colors.inverseText }]}>
                  {unreadMessages}
                </Text>
              </View>
            ) : null}
            <Text style={[styles.chevron, { color: colors.brand }]}>›</Text>
          </View>
        </AnimatedPressable>

        <AnimatedPressable
          variant="soft"
          style={styles.settingItem}
          onPress={() => navigation.navigate('Feedback')}>
          <View style={styles.settingLeft}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              {t('feedbackTitle')}
            </Text>
            <Text style={[styles.settingValue, { color: colors.textMuted }]}>
              {t('feedbackMenuHint')}
            </Text>
          </View>
          <Text style={[styles.chevron, { color: colors.brand }]}>›</Text>
        </AnimatedPressable>
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

        <AnimatedPressable
          variant="soft"
          style={styles.settingItem}
          onPress={() => navigation.navigate('SetupPin')}>
          <View style={styles.settingLeft}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              {hasPin ? t('changePin') : t('createPaymentPin')}
            </Text>
            <Text style={[styles.settingValue, { color: colors.textMuted }]}>
              {hasPin ? t('pinMasked') : t('paymentSecurityHint')}
            </Text>
          </View>
          <Text style={[styles.chevron, { color: colors.brand }]}>›</Text>
        </AnimatedPressable>

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

        <LanguagePicker
          colors={colors}
          locale={locale}
          onLocaleChange={setLocale}
          label={t('languageLabel')}
          selectTitle={t('selectLanguage')}
        />

        <AnimatedPressable
          variant="soft"
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
        </AnimatedPressable>
      </View>

      <View style={styles.accountActions}>
        <AnimatedPressable
          variant="primary"
          style={[styles.switchButton, { borderColor: colors.brand }]}
          onPress={handleSwitchAccount}>
          <Text style={[styles.switchText, { color: colors.brand }]}>{t('switchAccount')}</Text>
        </AnimatedPressable>
        <AnimatedPressable
          variant="primary"
          style={[styles.logoutButton, { borderColor: colors.expense }]}
          onPress={handleLogout}>
          <Text style={[styles.logoutText, { color: colors.expense }]}>{t('logout')}</Text>
        </AnimatedPressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  profileCard: {
    borderRadius: radii.xl,
    padding: space.lg,
    marginBottom: space.lg,
    overflow: 'hidden',
  },
  profileBlobLarge: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    top: -54,
    right: -42,
  },
  profileBlobSmall: {
    position: 'absolute',
    width: 112,
    height: 112,
    borderRadius: 56,
    left: -28,
    bottom: -38,
  },
  profileTopRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 28, fontWeight: '900' },
  profileMainInfo: { flex: 1, minWidth: 0 },
  profileName: { fontSize: 22, fontWeight: '800' },
  profileEmail: { fontSize: 14, marginTop: space.xs },
  profilePhone: { fontSize: 14, marginTop: 4, fontWeight: '600' },
  profileStatusRow: { flexDirection: 'row', gap: space.sm, marginTop: space.lg },
  profileStatusPill: {
    flex: 1,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: space.sm,
    paddingHorizontal: space.sm,
    alignItems: 'center',
  },
  profileStatusValue: { fontSize: 15, fontWeight: '900' },
  profileStatusLabel: { fontSize: 10, fontWeight: '800', marginTop: 2 },
  section: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: space.lg,
    marginBottom: space.lg,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginBottom: space.md },
  sectionHint: { fontSize: 13, marginTop: -space.sm, marginBottom: space.md, lineHeight: 18 },
  phoneInput: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: space.md,
  },
  savePhoneBtn: {
    borderRadius: radii.md,
    paddingVertical: space.md,
    alignItems: 'center',
  },
  savePhoneText: { fontSize: 15, fontWeight: '800' },
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
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { fontSize: 11, fontWeight: '800' },
  chevron: { fontSize: 22, fontWeight: '300' },
  accountActions: { gap: space.sm, marginTop: space.md },
  switchButton: {
    borderRadius: radii.lg,
    borderWidth: 2,
    padding: space.lg,
    alignItems: 'center',
  },
  switchText: { fontSize: 16, fontWeight: '800' },
  logoutButton: {
    borderRadius: radii.lg,
    borderWidth: 2,
    padding: space.lg,
    alignItems: 'center',
  },
  logoutText: { fontSize: 16, fontWeight: '800' },
});

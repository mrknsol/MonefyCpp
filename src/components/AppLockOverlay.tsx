import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from './AppIcon';
import { AnimatedPressable } from './AnimatedPressable';
import { LoadingSpinner } from './LoadingSpinner';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { space } from '../theme/tokens';

type Props = {
  showFaceIdButton: boolean;
  onFaceId: () => void;
  onUsePin: () => void;
  busy?: boolean;
};

export function AppLockOverlay({ showFaceIdButton, onFaceId, onUsePin, busy }: Props) {
  const { colors, t } = useAppPreferences();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + space.xxl,
          paddingBottom: insets.bottom + space.xl,
        },
      ]}>
      <AppIcon
        name="security"
        color={colors.brand}
        backgroundColor={colors.brandSoft}
        size={72}
      />
      <Text style={[styles.title, { color: colors.text }]}>{t('unlockApp')}</Text>
      <Text style={[styles.hint, { color: colors.textMuted }]}>{t('unlockAppHint')}</Text>

      {busy ? (
        <LoadingSpinner size="large" color={colors.brand} style={styles.spinner} />
      ) : (
        <View style={styles.actions}>
          {showFaceIdButton ? (
            <AnimatedPressable
              variant="primary"
              style={[styles.btn, { backgroundColor: colors.brand }]}
              onPress={onFaceId}>
              <Text style={[styles.btnText, { color: colors.inverseText }]}>{t('useFaceIdToUnlock')}</Text>
            </AnimatedPressable>
          ) : null}
          <AnimatedPressable
            variant="soft"
            style={[
              styles.btn,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderWidth: 1,
                marginTop: showFaceIdButton ? space.md : 0,
              },
            ]}
            onPress={onUsePin}>
            <Text style={[styles.btnText, { color: colors.text }]}>{t('usePinToUnlock')}</Text>
          </AnimatedPressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
    alignItems: 'center',
    paddingHorizontal: space.lg,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: space.xl,
    marginBottom: space.sm,
    textAlign: 'center',
  },
  hint: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: space.xxl,
  },
  spinner: { marginTop: space.xl },
  actions: { width: '100%', maxWidth: 320 },
  btn: {
    borderRadius: 16,
    paddingVertical: space.lg,
    alignItems: 'center',
  },
  btnText: { fontSize: 16, fontWeight: '700' },
});

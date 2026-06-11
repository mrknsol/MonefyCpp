import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, StyleSheet, View } from 'react-native';

import { AppLockOverlay } from '../components/AppLockOverlay';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { PinPadModal } from '../components/PinPadModal';
import { useAppPreferences } from './AppPreferencesContext';
import { useAuth } from './AuthContext';
import {
  authenticateWithBiometrics,
  getBiometricKind,
  type BiometricKind,
} from '../services/biometrics';
import type { PinLength } from './SecurityContext.types';

export type { PinLength } from './SecurityContext.types';

type SecuritySettings = {
  pin: string;
  pinLength: PinLength;
  faceIdEnabled: boolean;
};

type AuthPurpose = 'payment' | 'unlock' | null;

type SecurityContextType = {
  ready: boolean;
  appUnlocked: boolean;
  hasPin: boolean;
  pinLength: PinLength;
  faceIdEnabled: boolean;
  biometricKind: BiometricKind;
  setupPin: (pin: string, length: PinLength) => Promise<void>;
  setFaceIdEnabled: (enabled: boolean) => Promise<void>;
  requirePaymentAuth: (onSuccess: () => void | Promise<void>) => void;
};

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

function storageKey(userId: string) {
  return `@monefy/security/${userId}`;
}

export function useSecurity() {
  const ctx = useContext(SecurityContext);
  if (!ctx) {
    throw new Error('useSecurity requires SecurityProvider');
  }
  return ctx;
}

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { colors, t } = useAppPreferences();
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [biometricKind, setBiometricKind] = useState<BiometricKind>('none');
  const [appUnlocked, setAppUnlocked] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [authPurpose, setAuthPurpose] = useState<AuthPurpose>(null);
  const [pendingAction, setPendingAction] = useState<(() => void | Promise<void>) | null>(
    null,
  );
  const [unlockBusy, setUnlockBusy] = useState(false);
  const appStateRef = useRef(AppState.currentState);

  const loadSettings = useCallback(async () => {
    if (!user) {
      setSettings(null);
      setReady(true);
      setAppUnlocked(true);
      return;
    }
    try {
      const raw = await AsyncStorage.getItem(storageKey(user.id));
      setSettings(raw ? (JSON.parse(raw) as SecuritySettings) : null);
    } catch {
      setSettings(null);
    } finally {
      setReady(true);
    }
  }, [user]);

  useEffect(() => {
    setReady(false);
    setAppUnlocked(true);
    loadSettings();
    getBiometricKind().then(setBiometricKind);
  }, [loadSettings]);

  const persist = useCallback(
    async (next: SecuritySettings | null) => {
      if (!user) {
        return;
      }
      if (next) {
        await AsyncStorage.setItem(storageKey(user.id), JSON.stringify(next));
      } else {
        await AsyncStorage.removeItem(storageKey(user.id));
      }
      setSettings(next);
    },
    [user],
  );

  const setupPin = useCallback(
    async (pin: string, length: PinLength) => {
      await persist({
        pin,
        pinLength: length,
        faceIdEnabled: settings?.faceIdEnabled ?? false,
      });
    },
    [persist, settings?.faceIdEnabled],
  );

  const setFaceIdEnabled = useCallback(
    async (enabled: boolean) => {
      if (!settings?.pin) {
        return;
      }
      await persist({ ...settings, faceIdEnabled: enabled });
    },
    [persist, settings],
  );

  const finishAuth = useCallback(async () => {
    setModalVisible(false);
    setAuthPurpose(null);
    const action = pendingAction;
    setPendingAction(null);
    if (action) {
      await action();
    }
  }, [pendingAction]);

  const promptAuth = useCallback(
    (purpose: AuthPurpose, onSuccess: () => void | Promise<void>) => {
      if (!settings?.pin) {
        void Promise.resolve(onSuccess());
        return;
      }

      setAuthPurpose(purpose);
      const runAfterAuth = async () => {
        await onSuccess();
      };

      if (settings.faceIdEnabled && biometricKind !== 'none') {
        setUnlockBusy(purpose === 'unlock');
        void authenticateWithBiometrics(t('biometricPrompt')).then(ok => {
          setUnlockBusy(false);
          if (ok) {
            setAuthPurpose(null);
            void runAfterAuth();
          } else {
            setPendingAction(() => runAfterAuth);
            setModalVisible(true);
          }
        });
        return;
      }

      setPendingAction(() => runAfterAuth);
      setModalVisible(true);
    },
    [settings, biometricKind, t],
  );

  const requirePaymentAuth = useCallback(
    (onSuccess: () => void | Promise<void>) => {
      promptAuth('payment', onSuccess);
    },
    [promptAuth],
  );

  const attemptAppUnlock = useCallback(() => {
    if (!settings?.pin) {
      setAppUnlocked(true);
      return;
    }
    promptAuth('unlock', () => setAppUnlocked(true));
  }, [promptAuth, settings?.pin]);

  const openPinForUnlock = useCallback(() => {
    if (!settings?.pin || appUnlocked) {
      return;
    }
    setAuthPurpose('unlock');
    setPendingAction(() => async () => {
      setAppUnlocked(true);
    });
    setModalVisible(true);
  }, [settings?.pin, appUnlocked]);

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!settings?.pin) {
      setAppUnlocked(true);
      return;
    }
    setAppUnlocked(false);
    attemptAppUnlock();
  }, [ready, user?.id]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', nextState => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;

      if (!settings?.pin) {
        return;
      }

      if (nextState === 'background' || nextState === 'inactive') {
        setAppUnlocked(false);
        setModalVisible(false);
        setAuthPurpose(null);
        setPendingAction(null);
        setUnlockBusy(false);
        return;
      }

      if (
        nextState === 'active' &&
        (prev === 'background' || prev === 'inactive') &&
        ready &&
        !appUnlocked
      ) {
        attemptAppUnlock();
      }
    });
    return () => sub.remove();
  }, [settings?.pin, ready, appUnlocked, attemptAppUnlock]);

  const handlePinComplete = useCallback(
    (entered: string): boolean => {
      if (entered === settings?.pin) {
        void finishAuth();
        return true;
      }
      return false;
    },
    [settings?.pin, finishAuth],
  );

  const handleModalClose = useCallback(() => {
    setModalVisible(false);
    if (authPurpose === 'payment') {
      setPendingAction(null);
      setAuthPurpose(null);
    }
  }, [authPurpose]);

  const hasPin = Boolean(settings?.pin);
  const showLockOverlay = ready && hasPin && !appUnlocked;
  const showFaceIdOnLock =
    Boolean(settings?.faceIdEnabled) && biometricKind !== 'none';

  const value = useMemo(
    () => ({
      ready,
      appUnlocked,
      hasPin,
      pinLength: settings?.pinLength ?? 4,
      faceIdEnabled: settings?.faceIdEnabled ?? false,
      biometricKind,
      setupPin,
      setFaceIdEnabled,
      requirePaymentAuth,
    }),
    [
      ready,
      appUnlocked,
      hasPin,
      settings,
      biometricKind,
      setupPin,
      setFaceIdEnabled,
      requirePaymentAuth,
    ],
  );

  const pinModalMode = authPurpose === 'unlock' ? 'unlock' : 'verify';

  return (
    <SecurityContext.Provider value={value}>
      {children}
      {!ready ? (
        <View style={[styles.boot, { backgroundColor: colors.background }]}>
          <LoadingSpinner size="large" color={colors.brand} />
        </View>
      ) : null}
      {showLockOverlay ? (
        <AppLockOverlay
          showFaceIdButton={showFaceIdOnLock}
          onFaceId={attemptAppUnlock}
          onUsePin={openPinForUnlock}
          busy={unlockBusy && !modalVisible}
        />
      ) : null}
      <PinPadModal
        visible={modalVisible}
        mode={pinModalMode}
        pinLength={settings?.pinLength ?? 4}
        dismissible={authPurpose !== 'unlock'}
        onClose={handleModalClose}
        onComplete={handlePinComplete}
      />
    </SecurityContext.Provider>
  );
}

const styles = StyleSheet.create({
  boot: {
    ...StyleSheet.absoluteFill,
    zIndex: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

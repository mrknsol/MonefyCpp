import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Alert } from 'react-native';

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

type SecurityContextType = {
  ready: boolean;
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
  const { t } = useAppPreferences();
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [biometricKind, setBiometricKind] = useState<BiometricKind>('none');
  const [modalVisible, setModalVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void | Promise<void>) | null>(
    null,
  );

  const loadSettings = useCallback(async () => {
    if (!user) {
      setSettings(null);
      setReady(true);
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
    const action = pendingAction;
    setPendingAction(null);
    if (action) {
      await action();
    }
  }, [pendingAction]);

  const requirePaymentAuth = useCallback(
    (onSuccess: () => void | Promise<void>) => {
      if (!settings?.pin) {
        void Promise.resolve(onSuccess());
        return;
      }

      const runAfterAuth = async () => {
        await onSuccess();
      };

      if (settings.faceIdEnabled && biometricKind !== 'none') {
        void authenticateWithBiometrics(t('biometricPrompt')).then(ok => {
          if (ok) {
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

  const handlePinComplete = useCallback(
    (entered: string) => {
      if (entered === settings?.pin) {
        void finishAuth();
      } else {
        Alert.alert(t('error'), t('wrongPin'));
      }
    },
    [settings?.pin, finishAuth, t],
  );

  const value = useMemo(
    () => ({
      ready,
      hasPin: Boolean(settings?.pin),
      pinLength: settings?.pinLength ?? 4,
      faceIdEnabled: settings?.faceIdEnabled ?? false,
      biometricKind,
      setupPin,
      setFaceIdEnabled,
      requirePaymentAuth,
    }),
    [
      ready,
      settings,
      biometricKind,
      setupPin,
      setFaceIdEnabled,
      requirePaymentAuth,
    ],
  );

  return (
    <SecurityContext.Provider value={value}>
      {children}
      <PinPadModal
        visible={modalVisible}
        mode="verify"
        pinLength={settings?.pinLength ?? 4}
        onClose={() => {
          setModalVisible(false);
          setPendingAction(null);
        }}
        onComplete={handlePinComplete}
      />
    </SecurityContext.Provider>
  );
}

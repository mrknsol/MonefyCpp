import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';

import type { AppLocale, DateDisplayMode, ThemeMode } from '../i18n/translations';
import { DICT } from '../i18n/translations';
import { isAppLocale } from '../constants/languages';
import { darkColors, lightColors, type ThemeColors } from '../theme/colors';

const KEYS = {
  locale: '@monefy/locale',
  theme: '@monefy/theme',
  dateFormat: '@monefy/dateFormat',
} as const;

type Ctx = {
  ready: boolean;
  locale: AppLocale;
  setLocale: (l: AppLocale) => void;
  themeMode: ThemeMode;
  setThemeMode: (m: ThemeMode) => void;
  dateDisplayMode: DateDisplayMode;
  setDateDisplayMode: (m: DateDisplayMode) => void;
  isDark: boolean;
  colors: ThemeColors;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const AppPreferencesContext = createContext<Ctx | null>(null);

export function AppPreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const systemScheme = useColorScheme();
  const [ready, setReady] = useState(false);
  const [locale, setLocaleState] = useState<AppLocale>('ru');
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [dateDisplayMode, setDateDisplayModeState] =
    useState<DateDisplayMode>('long');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [l, th, df] = await Promise.all([
          AsyncStorage.getItem(KEYS.locale),
          AsyncStorage.getItem(KEYS.theme),
          AsyncStorage.getItem(KEYS.dateFormat),
        ]);
        if (cancelled) {
          return;
        }
        if (l && isAppLocale(l)) {
          setLocaleState(l);
        }
        if (th === 'light' || th === 'dark' || th === 'system') {
          setThemeModeState(th);
        }
        if (df === 'long' || df === 'short' || df === 'iso') {
          setDateDisplayModeState(df);
        }
      } catch {
        // Native RNCAsyncStorage missing until `pod install` + build ios/*.xcworkspace
      } finally {
        if (!cancelled) {
          setReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setLocale = useCallback((l: AppLocale) => {
    setLocaleState(l);
    AsyncStorage.setItem(KEYS.locale, l).catch(() => {});
  }, []);

  const setThemeMode = useCallback((m: ThemeMode) => {
    setThemeModeState(m);
    AsyncStorage.setItem(KEYS.theme, m).catch(() => {});
  }, []);

  const setDateDisplayMode = useCallback((m: DateDisplayMode) => {
    setDateDisplayModeState(m);
    AsyncStorage.setItem(KEYS.dateFormat, m).catch(() => {});
  }, []);

  const isDark = useMemo(() => {
    if (themeMode === 'system') {
      return systemScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, systemScheme]);

  const colors = isDark ? darkColors : lightColors;

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      let s = DICT[locale][key] ?? DICT.en[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          s = s.split(`{${k}}`).join(String(v));
        }
      }
      return s;
    },
    [locale],
  );

  const value = useMemo(
    () => ({
      ready,
      locale,
      setLocale,
      themeMode,
      setThemeMode,
      dateDisplayMode,
      setDateDisplayMode,
      isDark,
      colors,
      t,
    }),
    [
      ready,
      locale,
      setLocale,
      themeMode,
      setThemeMode,
      dateDisplayMode,
      setDateDisplayMode,
      isDark,
      colors,
      t,
    ],
  );

  return (
    <AppPreferencesContext.Provider value={value}>
      {children}
    </AppPreferencesContext.Provider>
  );
}

export function useAppPreferences(): Ctx {
  const v = useContext(AppPreferencesContext);
  if (!v) {
    throw new Error('useAppPreferences requires AppPreferencesProvider');
  }
  return v;
}

import { useLayoutEffect } from 'react';
import { useNavigation } from '@react-navigation/native';

import { useAppPreferences } from '../context/AppPreferencesContext';

/** Updates stack header title when locale or title key changes. */
export function useScreenTitle(titleKey: string, extraDeps: readonly unknown[] = []) {
  const navigation = useNavigation();
  const { t, locale } = useAppPreferences();

  useLayoutEffect(() => {
    navigation.setOptions({ title: t(titleKey) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, t, locale, titleKey, ...extraDeps]);
}

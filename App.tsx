/**
 * Monefy — React Native UI + C++ core (see `cpp/`).
 */

import { NavigationContainer } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';

import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppSplash } from './src/components/AppSplash';
import { AppPreferencesProvider, useAppPreferences } from './src/context/AppPreferencesContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SecurityProvider } from './src/context/SecurityContext';
import { AuthNavigator } from './src/navigation/AuthNavigator';
import { RootNavigator } from './src/navigation/RootNavigator';

function AppContent() {
  const { ready } = useAppPreferences();
  const { user, isLoading } = useAuth();
  const [minSplashDone, setMinSplashDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinSplashDone(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (!ready || isLoading || !minSplashDone) {
    return <AppSplash />;
  }

  return (
    <NavigationContainer>
      {user ? (
        <SecurityProvider>
          <RootNavigator />
        </SecurityProvider>
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}

function AppReady() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <AppPreferencesProvider>
        <AppReady />
      </AppPreferencesProvider>
    </SafeAreaProvider>
  );
}

export default App;

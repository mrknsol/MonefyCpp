/**
 * Monefy — React Native UI + C++ core (see `cpp/`).
 */

import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppPreferencesProvider, useAppPreferences } from './src/context/AppPreferencesContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SecurityProvider } from './src/context/SecurityContext';
import { AuthNavigator } from './src/navigation/AuthNavigator';
import { RootNavigator } from './src/navigation/RootNavigator';

function AppContent() {
  const { ready, colors } = useAppPreferences();
  const { user, isLoading } = useAuth();

  if (!ready || isLoading) {
    return (
      <View style={[styles.boot, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accentMuted} />
      </View>
    );
  }

  if (!user) {
    return <AuthNavigator />;
  }

  return (
    <SecurityProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </SecurityProvider>
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

const styles = StyleSheet.create({
  boot: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default App;

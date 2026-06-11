import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { useAuth } from '../context/AuthContext';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { SwitchAccountScreen } from '../screens/SwitchAccountScreen';
import type { ForgotPasswordParams } from './forgotPasswordParams';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: ForgotPasswordParams | undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  const { authScreen, cancelSwitchAccount } = useAuth();

  if (authScreen === 'switch') {
    return <SwitchAccountScreen onAnotherAccount={cancelSwitchAccount} />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

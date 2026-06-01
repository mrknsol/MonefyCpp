import React, { useState } from 'react';

import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { SwitchAccountScreen } from '../screens/SwitchAccountScreen';

export function AuthNavigator() {
  const { authScreen, cancelSwitchAccount } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  if (authScreen === 'switch') {
    return <SwitchAccountScreen onAnotherAccount={cancelSwitchAccount} />;
  }

  if (isLogin) {
    return <LoginScreen onRegister={() => setIsLogin(false)} />;
  }

  return <RegisterScreen onLogin={() => setIsLogin(true)} />;
}

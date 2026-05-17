import React, { useState } from 'react';

import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';

export function AuthNavigator() {
  const [isLogin, setIsLogin] = useState(true);

  if (isLogin) {
    return (
      <LoginScreen onRegister={() => setIsLogin(false)} />
    );
  }

  return (
    <RegisterScreen onLogin={() => setIsLogin(true)} />
  );
}

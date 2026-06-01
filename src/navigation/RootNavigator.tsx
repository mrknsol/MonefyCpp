import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { useAppPreferences } from '../context/AppPreferencesContext';
import { AddCardScreen } from '../screens/AddCardScreen';
import { AddCustomCategoryScreen } from '../screens/AddCustomCategoryScreen';
import { AddOperationScreen } from '../screens/AddOperationScreen';
import { AllCategoriesScreen } from '../screens/AllCategoriesScreen';
import { CalculatorScreen } from '../screens/CalculatorScreen';
import { CardsScreen } from '../screens/CardsScreen';
import { CategoriesScreen } from '../screens/CategoriesScreen';
import { CategoryDaysScreen } from '../screens/CategoryDaysScreen';
import { EditCardScreen } from '../screens/EditCardScreen';
import { FeedbackScreen } from '../screens/FeedbackScreen';
import { LoanScreen } from '../screens/LoanScreen';
import { MessageDetailScreen } from '../screens/MessageDetailScreen';
import { MessagesScreen } from '../screens/MessagesScreen';
import { MainTabNavigator } from './MainTabNavigator';
import { PayScreen } from '../screens/PayScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SetupPinScreen } from '../screens/SetupPinScreen';
import { TransferScreen } from '../screens/TransferScreen';
import type { Card } from '../types';

export type RootStackParamList = {
  Home: undefined;
  Calculator: { date: string; intent?: 'expense' | 'topup' };
  Categories: {
    date: string;
    amount: number;
    description: string;
    intent?: 'expense' | 'topup';
  };
  Pay: {
    date: string;
    amount: number;
    description: string;
    category: string;
    iconName: string;
    iconColor: string;
  };
  Cards: undefined;
  AddCard: undefined;
  EditCard: { card: Card };
  Settings: undefined;
  AllCategories: undefined;
  CategoryDays: { categoryId: string; title?: string };
  AddCustomCategory: undefined;
  AddOperation: { type: 'expense' | 'income'; categoryId?: string; description?: string };
  Transfer: { fromCardNumber?: string };
  SetupPin: undefined;
  Feedback: undefined;
  Messages: undefined;
  MessageDetail: { messageId: string };
  Loan: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { colors, isDark } = useAppPreferences();

  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        animation: 'fade_from_bottom',
        animationDuration: 260,
        gestureEnabled: true,
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: colors.cardElevated,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          color: colors.text,
          fontWeight: '700',
          fontSize: 17,
        },
        contentStyle: { backgroundColor: colors.background },
        statusBarStyle: isDark ? 'light' : 'dark',
      }}>
      <Stack.Screen
        name="Home"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Calculator" component={CalculatorScreen} />
      <Stack.Screen name="Categories" component={CategoriesScreen} />
      <Stack.Screen name="Pay" component={PayScreen} />
      <Stack.Screen name="Cards" component={CardsScreen} />
      <Stack.Screen name="AddCard" component={AddCardScreen} />
      <Stack.Screen name="EditCard" component={EditCardScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="AllCategories" component={AllCategoriesScreen} />
      <Stack.Screen name="CategoryDays" component={CategoryDaysScreen} />
      <Stack.Screen name="AddCustomCategory" component={AddCustomCategoryScreen} />
      <Stack.Screen name="AddOperation" component={AddOperationScreen} />
      <Stack.Screen name="Transfer" component={TransferScreen} />
      <Stack.Screen name="SetupPin" component={SetupPinScreen} />
      <Stack.Screen name="Feedback" component={FeedbackScreen} />
      <Stack.Screen name="Messages" component={MessagesScreen} />
      <Stack.Screen name="MessageDetail" component={MessageDetailScreen} />
      <Stack.Screen name="Loan" component={LoanScreen} />
    </Stack.Navigator>
  );
}

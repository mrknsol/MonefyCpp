import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';

import { PremiumTabBar } from '../components/PremiumTabBar';
import { TabBarIcon } from '../components/TabBarIcon';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { HomeScreenSimple } from '../screens/HomeScreenSimple';
import { PaymentsScreen } from '../screens/PaymentsScreen';
import { StatisticsScreen } from '../screens/StatisticsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export function MainTabNavigator() {
  const { colors, t } = useAppPreferences();

  return (
    <Tab.Navigator
      tabBar={props => <PremiumTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textMuted,
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreenSimple}
        options={{
          tabBarLabel: t('tabHome'),
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="home" color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Payments"
        component={PaymentsScreen}
        options={{
          tabBarLabel: t('tabPayments'),
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="payments" color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Statistics"
        component={StatisticsScreen}
        options={{
          tabBarLabel: t('tabStatistics'),
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="stats" color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: t('tabProfile'),
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="profile" color={color} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

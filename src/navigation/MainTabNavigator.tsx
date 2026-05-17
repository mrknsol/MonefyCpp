import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppPreferences } from '../context/AppPreferencesContext';
import { HomeScreenSimple } from '../screens/HomeScreenSimple';
import { CardsScreen } from '../screens/CardsScreen';
import { StatisticsScreen } from '../screens/StatisticsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { radii, space } from '../theme/tokens';

const Tab = createBottomTabNavigator();

function TabIcon({ glyph, color, focused }: { glyph: string; color: string; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Text style={{ fontSize: 22, color }}>{glyph}</Text>
    </View>
  );
}

const CardsTabWrapper = () => {
  const navigation = useNavigation() as any;
  return (
    <CardsScreen
      navigation={navigation}
      route={{ key: 'Cards', name: 'Cards' } as any}
    />
  );
};

export function MainTabNavigator() {
  const { colors, t } = useAppPreferences();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontWeight: '700',
          fontSize: 10,
          letterSpacing: 0.3,
        },
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreenSimple}
        options={{
          tabBarLabel: t('tabHome'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon glyph="🏠" color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Cards"
        component={CardsTabWrapper}
        options={{
          tabBarLabel: t('tabAccounts'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon glyph="💳" color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Statistics"
        component={StatisticsScreen}
        options={{
          tabBarLabel: t('tabStatistics'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon glyph="📊" color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: t('tabProfile'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon glyph="👤" color={color} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    paddingHorizontal: space.sm,
    paddingVertical: 4,
    borderRadius: radii.md,
  },
  iconWrapActive: {
    backgroundColor: 'rgba(26, 79, 214, 0.12)',
  },
});

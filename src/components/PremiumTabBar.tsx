import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppPreferences } from '../context/AppPreferencesContext';
import { cardShadow, radii, space } from '../theme/tokens';

const HORIZONTAL_MARGIN = space.lg;

export function PremiumTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useAppPreferences();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const progress = useRef(new Animated.Value(state.index)).current;
  const itemWidth = (width - HORIZONTAL_MARGIN * 2) / state.routes.length;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: state.index,
      friction: 9,
      tension: 95,
      useNativeDriver: true,
    }).start();
  }, [progress, state.index]);

  const translateX = progress.interpolate({
    inputRange: state.routes.map((_, index) => index),
    outputRange: state.routes.map((_, index) => index * itemWidth),
  });

  return (
    <View
      style={[
        styles.safeArea,
        {
          paddingBottom: Math.max(insets.bottom, space.sm),
          backgroundColor: colors.background,
        },
      ]}>
      <View
        style={[
          styles.bar,
          {
            backgroundColor: colors.tabBar,
            borderColor: colors.border,
          },
          cardShadow(true),
        ]}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.indicator,
            {
              width: itemWidth - space.xs,
              backgroundColor: colors.brandSoft,
              borderColor: colors.borderSubtle,
              transform: [{ translateX }],
            },
          ]}
        />

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : options.title ?? route.name;
          const color = focused ? colors.brand : colors.textMuted;

          const onPress = () => {
            const tabEvent = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!focused && !tabEvent.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[styles.item, { width: itemWidth }]}>
              <AnimatedTabItem focused={focused}>
                {options.tabBarIcon?.({ focused, color, size: 22 })}
                <Text
                  numberOfLines={1}
                  style={[
                    styles.label,
                    {
                      color,
                      fontWeight: focused ? '800' : '700',
                    },
                  ]}>
                  {label}
                </Text>
              </AnimatedTabItem>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function AnimatedTabItem({
  children,
  focused,
}: {
  children: React.ReactNode;
  focused: boolean;
}) {
  const scale = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1 : 0,
      friction: 8,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [focused, scale]);

  const itemScale = scale.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1.04],
  });
  const translateY = scale.interpolate({
    inputRange: [0, 1],
    outputRange: [2, -1],
  });

  return (
    <Animated.View
      style={[
        styles.itemInner,
        {
          transform: [{ translateY }, { scale: itemScale }],
        },
      ]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    paddingHorizontal: HORIZONTAL_MARGIN,
    paddingTop: space.xs,
  },
  bar: {
    minHeight: 66,
    borderRadius: radii.xl,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  indicator: {
    position: 'absolute',
    top: space.xs,
    bottom: space.xs,
    left: space.xs / 2,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  item: {
    minHeight: 66,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
});

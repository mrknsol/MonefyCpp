import React, { useMemo, useRef } from 'react';
import {
  Animated,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleProp,
  UIManager,
  ViewStyle,
  type PressableProps,
} from 'react-native';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

type PressVariant = 'soft' | 'tile' | 'primary' | 'icon' | 'none';

type Props = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  variant?: PressVariant;
};

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

const variantConfig: Record<PressVariant, { scale: number; opacity: number }> = {
  soft: { scale: 0.98, opacity: 0.92 },
  tile: { scale: 0.965, opacity: 0.94 },
  primary: { scale: 0.975, opacity: 0.9 },
  icon: { scale: 0.92, opacity: 0.85 },
  none: { scale: 1, opacity: 1 },
};

export function animateNextLayout() {
  LayoutAnimation.configureNext({
    duration: 240,
    create: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
    update: {
      type: LayoutAnimation.Types.easeInEaseOut,
      springDamping: 0.86,
    },
    delete: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
  });
}

export function AnimatedPressable({
  children,
  disabled,
  onPressIn,
  onPressOut,
  style,
  variant = 'soft',
  ...props
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const config = variantConfig[variant];

  const animatedStyle = useMemo(
    () => ({
      opacity,
      transform: [{ scale }],
    }),
    [opacity, scale],
  );

  const animateTo = (toScale: number, toOpacity: number) => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: toScale,
        friction: 8,
        tension: 130,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: toOpacity,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <AnimatedPressableBase
      {...props}
      disabled={disabled}
      style={[style, animatedStyle]}
      onPressIn={event => {
        if (!disabled) {
          animateTo(config.scale, config.opacity);
        }
        onPressIn?.(event);
      }}
      onPressOut={event => {
        if (!disabled) {
          animateTo(1, 1);
        }
        onPressOut?.(event);
      }}>
      {children}
    </AnimatedPressableBase>
  );
}

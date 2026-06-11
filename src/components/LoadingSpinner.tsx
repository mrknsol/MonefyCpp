import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

export type LoadingSpinnerSize = 'small' | 'medium' | 'large';

const SIZES: Record<LoadingSpinnerSize, number> = {
  small: 18,
  medium: 28,
  large: 40,
};

const STROKES: Record<LoadingSpinnerSize, number> = {
  small: 2,
  medium: 3,
  large: 4,
};

type Props = {
  color?: string;
  size?: LoadingSpinnerSize;
  style?: StyleProp<ViewStyle>;
};

export function LoadingSpinner({ color = '#6366f1', size = 'medium', style }: Props) {
  const spin = useRef(new Animated.Value(0)).current;
  const dim = SIZES[size];

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 880,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.ring,
        {
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          borderWidth: STROKES[size],
          borderColor: `${color}30`,
          borderTopColor: color,
          borderRightColor: color,
          transform: [{ rotate }],
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  ring: {
    borderStyle: 'solid',
  },
});

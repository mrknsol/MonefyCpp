import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

export type AppIconName =
  | 'pets'
  | 'phone'
  | 'restaurant'
  | 'taxi'
  | 'clothes'
  | 'beverages'
  | 'transport'
  | 'home'
  | 'hygiene'
  | 'sport'
  | 'gift'
  | 'health'
  | 'carRepair'
  | 'market'
  | 'custom'
  | 'topup'
  | 'transfer'
  | 'expense'
  | 'utilities'
  | 'internet'
  | 'education'
  | 'fines'
  | 'games'
  | 'subscriptions'
  | 'travel'
  | 'charity'
  | 'beauty'
  | 'loan'
  | 'card'
  | 'info'
  | 'security'
  | 'promo';

type Props = {
  name: AppIconName;
  color: string;
  size?: number;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
};

export function AppIcon({ name, color, size = 36, backgroundColor, style }: Props) {
  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
          backgroundColor: backgroundColor ?? 'transparent',
        },
        style,
      ]}>
      <View style={[styles.stage, { width: size * 0.62, height: size * 0.62 }]}>
        {renderIcon(name, color, size * 0.62)}
      </View>
    </View>
  );
}

function renderIcon(name: AppIconName, color: string, box: number) {
  const stroke = Math.max(2, box * 0.1);
  const thin = Math.max(1.5, box * 0.075);
  const line = (style: ViewStyle) => (
    <View style={[styles.line, { backgroundColor: color, height: stroke, borderRadius: stroke }, style]} />
  );
  const vline = (style: ViewStyle) => (
    <View style={[styles.vline, { backgroundColor: color, width: stroke, borderRadius: stroke }, style]} />
  );
  const dot = (style: ViewStyle) => (
    <View style={[styles.dot, { backgroundColor: color, width: stroke * 1.5, height: stroke * 1.5, borderRadius: stroke }, style]} />
  );
  const outline = (style: ViewStyle) => (
    <View style={[styles.outline, { borderColor: color, borderWidth: thin, borderRadius: stroke }, style]} />
  );

  switch (name) {
    case 'pets':
      return (
        <>
          {dot({ left: box * 0.17, top: box * 0.17 })}
          {dot({ left: box * 0.4, top: box * 0.08 })}
          {dot({ right: box * 0.17, top: box * 0.17 })}
          {dot({ left: box * 0.29, top: box * 0.36, width: box * 0.42, height: box * 0.34, borderRadius: box * 0.18 })}
        </>
      );
    case 'phone':
      return (
        <>
          {outline({ left: box * 0.28, top: box * 0.03, width: box * 0.44, height: box * 0.86, borderRadius: box * 0.12 })}
          {line({ left: box * 0.41, bottom: box * 0.13, width: box * 0.18, height: thin })}
        </>
      );
    case 'restaurant':
      return (
        <>
          {vline({ left: box * 0.2, top: box * 0.06, height: box * 0.72, width: thin })}
          {vline({ left: box * 0.31, top: box * 0.06, height: box * 0.32, width: thin })}
          {vline({ left: box * 0.09, top: box * 0.06, height: box * 0.32, width: thin })}
          {vline({ right: box * 0.27, top: box * 0.08, height: box * 0.72, width: thin, transform: [{ rotate: '15deg' }] })}
          {outline({ right: box * 0.1, top: box * 0.05, width: box * 0.19, height: box * 0.36, borderTopLeftRadius: box * 0.12, borderTopRightRadius: box * 0.12 })}
        </>
      );
    case 'taxi':
    case 'carRepair':
      return (
        <>
          {outline({ left: box * 0.12, top: box * 0.33, width: box * 0.76, height: box * 0.28, borderRadius: box * 0.08 })}
          {line({ left: box * 0.27, top: box * 0.2, width: box * 0.46, transform: [{ rotate: name === 'carRepair' ? '-22deg' : '0deg' }] })}
          {dot({ left: box * 0.22, bottom: box * 0.14 })}
          {dot({ right: box * 0.22, bottom: box * 0.14 })}
          {name === 'carRepair' ? vline({ right: box * 0.16, top: box * 0.04, height: box * 0.32, transform: [{ rotate: '45deg' }] }) : null}
        </>
      );
    case 'clothes':
      return (
        <>
          {line({ left: box * 0.2, top: box * 0.32, width: box * 0.25, transform: [{ rotate: '-28deg' }] })}
          {line({ right: box * 0.2, top: box * 0.32, width: box * 0.25, transform: [{ rotate: '28deg' }] })}
          {outline({ left: box * 0.22, top: box * 0.33, width: box * 0.56, height: box * 0.44, borderRadius: box * 0.08 })}
          {outline({ left: box * 0.42, top: box * 0.27, width: box * 0.16, height: box * 0.16, borderRadius: box * 0.08 })}
        </>
      );
    case 'beverages':
      return (
        <>
          {outline({ left: box * 0.24, top: box * 0.16, width: box * 0.42, height: box * 0.62, borderRadius: box * 0.08 })}
          {line({ left: box * 0.2, top: box * 0.15, width: box * 0.5 })}
          {line({ right: box * 0.15, top: box * 0.3, width: box * 0.24, transform: [{ rotate: '-48deg' }] })}
        </>
      );
    case 'transport':
      return (
        <>
          {outline({ left: box * 0.16, top: box * 0.12, width: box * 0.68, height: box * 0.58, borderRadius: box * 0.1 })}
          {line({ left: box * 0.25, top: box * 0.34, width: box * 0.5, height: thin })}
          {dot({ left: box * 0.25, bottom: box * 0.13 })}
          {dot({ right: box * 0.25, bottom: box * 0.13 })}
        </>
      );
    case 'home':
      return (
        <>
          {line({ left: box * 0.18, top: box * 0.33, width: box * 0.41, transform: [{ rotate: '-38deg' }] })}
          {line({ right: box * 0.18, top: box * 0.33, width: box * 0.41, transform: [{ rotate: '38deg' }] })}
          {outline({ left: box * 0.26, top: box * 0.42, width: box * 0.48, height: box * 0.36, borderTopWidth: 0 })}
        </>
      );
    case 'hygiene':
      return (
        <>
          {outline({ left: box * 0.24, top: box * 0.38, width: box * 0.52, height: box * 0.34, borderRadius: box * 0.16 })}
          {line({ left: box * 0.3, top: box * 0.27, width: box * 0.4 })}
          {line({ left: box * 0.42, top: box * 0.18, width: box * 0.18 })}
          {dot({ right: box * 0.18, top: box * 0.16, width: thin * 1.2, height: thin * 1.2 })}
        </>
      );
    case 'sport':
      return (
        <>
          {outline({ left: box * 0.18, top: box * 0.18, width: box * 0.64, height: box * 0.64, borderRadius: box * 0.32 })}
          {line({ left: box * 0.24, top: box * 0.48, width: box * 0.52, height: thin })}
          {vline({ left: box * 0.48, top: box * 0.24, height: box * 0.52, width: thin })}
        </>
      );
    case 'gift':
    case 'promo':
      return (
        <>
          {outline({ left: box * 0.18, top: box * 0.33, width: box * 0.64, height: box * 0.44, borderRadius: box * 0.06 })}
          {line({ left: box * 0.15, top: box * 0.32, width: box * 0.7 })}
          {vline({ left: box * 0.48, top: box * 0.22, height: box * 0.56, width: thin })}
          {line({ left: box * 0.28, top: box * 0.19, width: box * 0.2, transform: [{ rotate: '35deg' }] })}
          {line({ right: box * 0.28, top: box * 0.19, width: box * 0.2, transform: [{ rotate: '-35deg' }] })}
        </>
      );
    case 'health':
      return (
        <>
          {line({ left: box * 0.24, top: box * 0.45, width: box * 0.52 })}
          {vline({ left: box * 0.45, top: box * 0.24, height: box * 0.52 })}
        </>
      );
    case 'market':
      return (
        <>
          {line({ left: box * 0.16, top: box * 0.18, width: box * 0.18, transform: [{ rotate: '65deg' }] })}
          {outline({ left: box * 0.25, top: box * 0.28, width: box * 0.5, height: box * 0.25, borderRadius: box * 0.04 })}
          {dot({ left: box * 0.32, bottom: box * 0.18 })}
          {dot({ right: box * 0.28, bottom: box * 0.18 })}
        </>
      );
    case 'topup':
      return (
        <>
          {line({ left: box * 0.24, top: box * 0.45, width: box * 0.52 })}
          {vline({ left: box * 0.45, top: box * 0.24, height: box * 0.52 })}
        </>
      );
    case 'custom':
      return (
        <>
          {outline({ left: box * 0.24, top: box * 0.24, width: box * 0.52, height: box * 0.52, borderRadius: box * 0.26 })}
          {line({ left: box * 0.34, top: box * 0.47, width: box * 0.32, height: thin })}
          {vline({ left: box * 0.48, top: box * 0.34, height: box * 0.32, width: thin })}
        </>
      );
    case 'expense':
      return line({ left: box * 0.24, top: box * 0.47, width: box * 0.52 });
    case 'transfer':
      return (
        <>
          {line({ left: box * 0.16, top: box * 0.31, width: box * 0.62 })}
          {line({ right: box * 0.15, top: box * 0.24, width: box * 0.16, transform: [{ rotate: '45deg' }] })}
          {line({ right: box * 0.15, top: box * 0.38, width: box * 0.16, transform: [{ rotate: '-45deg' }] })}
          {line({ right: box * 0.16, top: box * 0.62, width: box * 0.62 })}
          {line({ left: box * 0.15, top: box * 0.55, width: box * 0.16, transform: [{ rotate: '-45deg' }] })}
          {line({ left: box * 0.15, top: box * 0.69, width: box * 0.16, transform: [{ rotate: '45deg' }] })}
        </>
      );
    case 'utilities':
      return (
        <>
          {vline({ left: box * 0.47, top: box * 0.1, height: box * 0.32 })}
          {line({ left: box * 0.23, top: box * 0.45, width: box * 0.54 })}
          {outline({ left: box * 0.28, top: box * 0.22, width: box * 0.44, height: box * 0.42, borderRadius: box * 0.22 })}
          {line({ left: box * 0.39, bottom: box * 0.17, width: box * 0.22 })}
        </>
      );
    case 'internet':
      return (
        <>
          {outline({ left: box * 0.16, top: box * 0.16, width: box * 0.68, height: box * 0.68, borderRadius: box * 0.34 })}
          {vline({ left: box * 0.48, top: box * 0.18, height: box * 0.64, width: thin })}
          {line({ left: box * 0.22, top: box * 0.48, width: box * 0.56, height: thin })}
        </>
      );
    case 'education':
      return (
        <>
          {line({ left: box * 0.18, top: box * 0.34, width: box * 0.64, transform: [{ rotate: '14deg' }] })}
          {line({ left: box * 0.18, top: box * 0.34, width: box * 0.64, transform: [{ rotate: '-14deg' }] })}
          {outline({ left: box * 0.32, top: box * 0.48, width: box * 0.36, height: box * 0.2, borderRadius: box * 0.05 })}
        </>
      );
    case 'fines':
      return (
        <>
          {vline({ left: box * 0.48, top: box * 0.14, height: box * 0.56 })}
          {line({ left: box * 0.25, top: box * 0.25, width: box * 0.5 })}
          {line({ left: box * 0.2, top: box * 0.55, width: box * 0.18 })}
          {line({ right: box * 0.2, top: box * 0.55, width: box * 0.18 })}
          {line({ left: box * 0.34, bottom: box * 0.16, width: box * 0.32 })}
        </>
      );
    case 'games':
      return (
        <>
          {outline({ left: box * 0.14, top: box * 0.34, width: box * 0.72, height: box * 0.32, borderRadius: box * 0.16 })}
          {line({ left: box * 0.25, top: box * 0.49, width: box * 0.2, height: thin })}
          {vline({ left: box * 0.33, top: box * 0.41, height: box * 0.2, width: thin })}
          {dot({ right: box * 0.28, top: box * 0.44, width: thin * 1.4, height: thin * 1.4 })}
          {dot({ right: box * 0.18, top: box * 0.51, width: thin * 1.4, height: thin * 1.4 })}
        </>
      );
    case 'subscriptions':
      return (
        <>
          {outline({ left: box * 0.2, top: box * 0.2, width: box * 0.54, height: box * 0.54, borderRadius: box * 0.1 })}
          {outline({ left: box * 0.3, top: box * 0.3, width: box * 0.54, height: box * 0.54, borderRadius: box * 0.1 })}
          {line({ left: box * 0.4, top: box * 0.5, width: box * 0.28, height: thin })}
        </>
      );
    case 'travel':
      return (
        <>
          {line({ left: box * 0.16, top: box * 0.48, width: box * 0.68, transform: [{ rotate: '-12deg' }] })}
          {line({ left: box * 0.36, top: box * 0.26, width: box * 0.34, transform: [{ rotate: '30deg' }] })}
          {line({ left: box * 0.42, top: box * 0.56, width: box * 0.28, transform: [{ rotate: '-35deg' }] })}
          {line({ left: box * 0.2, bottom: box * 0.13, width: box * 0.42, height: thin })}
        </>
      );
    case 'charity':
      return (
        <>
          {outline({ left: box * 0.18, top: box * 0.35, width: box * 0.27, height: box * 0.27, borderRadius: box * 0.14 })}
          {outline({ right: box * 0.18, top: box * 0.35, width: box * 0.27, height: box * 0.27, borderRadius: box * 0.14 })}
          {line({ left: box * 0.23, top: box * 0.57, width: box * 0.54, transform: [{ rotate: '-45deg' }] })}
          {line({ right: box * 0.23, top: box * 0.57, width: box * 0.54, transform: [{ rotate: '45deg' }] })}
        </>
      );
    case 'beauty':
      return (
        <>
          {outline({ left: box * 0.3, top: box * 0.14, width: box * 0.4, height: box * 0.54, borderRadius: box * 0.2 })}
          {line({ left: box * 0.35, bottom: box * 0.18, width: box * 0.3, height: thin })}
          {line({ left: box * 0.42, top: box * 0.27, width: box * 0.16, height: thin })}
        </>
      );
    case 'loan':
      return (
        <>
          {line({ left: box * 0.18, top: box * 0.26, width: box * 0.64 })}
          {vline({ left: box * 0.25, top: box * 0.34, height: box * 0.32, width: thin })}
          {vline({ left: box * 0.47, top: box * 0.34, height: box * 0.32, width: thin })}
          {vline({ right: box * 0.25, top: box * 0.34, height: box * 0.32, width: thin })}
          {line({ left: box * 0.16, bottom: box * 0.18, width: box * 0.68 })}
        </>
      );
    case 'card':
      return (
        <>
          {outline({ left: box * 0.13, top: box * 0.25, width: box * 0.74, height: box * 0.5, borderRadius: box * 0.08 })}
          {line({ left: box * 0.14, top: box * 0.39, width: box * 0.72, height: thin })}
          {line({ left: box * 0.24, bottom: box * 0.24, width: box * 0.2, height: thin })}
        </>
      );
    case 'info':
      return (
        <>
          {dot({ left: box * 0.44, top: box * 0.18 })}
          {vline({ left: box * 0.47, top: box * 0.4, height: box * 0.36 })}
        </>
      );
    case 'security':
      return (
        <>
          {outline({ left: box * 0.24, top: box * 0.4, width: box * 0.52, height: box * 0.36, borderRadius: box * 0.08 })}
          {outline({ left: box * 0.33, top: box * 0.17, width: box * 0.34, height: box * 0.34, borderRadius: box * 0.17 })}
        </>
      );
    default:
      return outline({ left: box * 0.24, top: box * 0.24, width: box * 0.52, height: box * 0.52, borderRadius: box * 0.12 });
  }
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stage: {
    position: 'relative',
  },
  line: {
    position: 'absolute',
  },
  vline: {
    position: 'absolute',
  },
  dot: {
    position: 'absolute',
  },
  outline: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
});

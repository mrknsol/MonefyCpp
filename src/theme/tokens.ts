import { Platform, StyleSheet } from 'react-native';

/** Layout & shape — “product” feel, not default RN spacing */
export const radii = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

export const space = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
} as const;

export const type = {
  heroAmount: { fontSize: 40, fontWeight: '700' as const, letterSpacing: -1.2 },
  title: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.4 },
  section: { fontSize: 12, fontWeight: '700' as const, letterSpacing: 1.2 },
  body: { fontSize: 15, fontWeight: '500' as const },
  bodyStrong: { fontSize: 15, fontWeight: '700' as const },
  caption: { fontSize: 12, fontWeight: '600' as const },
  micro: { fontSize: 10, fontWeight: '600' as const, letterSpacing: 0.6 },
};

export function cardShadow(elevated: boolean) {
  return Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: elevated ? 12 : 6 },
      shadowOpacity: elevated ? 0.12 : 0.08,
      shadowRadius: elevated ? 24 : 14,
    },
    android: {
      elevation: elevated ? 10 : 4,
    },
    default: {},
  });
}

export const styles = StyleSheet.create({
  screenPad: { paddingHorizontal: space.lg },
});

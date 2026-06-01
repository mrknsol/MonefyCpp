import React from 'react';
import { StyleSheet, View } from 'react-native';

import { radii, space } from '../theme/tokens';

export type TabIconName = 'home' | 'payments' | 'stats' | 'profile';

type Props = {
  name: TabIconName;
  color: string;
  focused: boolean;
};

export function TabBarIcon({ name, color, focused }: Props) {
  return (
    <View style={[styles.wrap, focused && styles.wrapActive]}>
      {name === 'home' ? <HomeIcon color={color} /> : null}
      {name === 'payments' ? <PaymentsIcon color={color} /> : null}
      {name === 'stats' ? <StatsIcon color={color} /> : null}
      {name === 'profile' ? <ProfileIcon color={color} /> : null}
    </View>
  );
}

function HomeIcon({ color }: { color: string }) {
  return (
    <View style={styles.iconBox}>
      <View style={[styles.roof, { borderBottomColor: color }]} />
      <View style={[styles.house, { borderColor: color }]}>
        <View style={[styles.door, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

function PaymentsIcon({ color }: { color: string }) {
  return (
    <View style={styles.iconBox}>
      <View style={[styles.bill, { borderColor: color }]}>
        <View style={[styles.billLine, { backgroundColor: color }]} />
        <View style={[styles.billLine, styles.billLineShort, { backgroundColor: color }]} />
      </View>
      <View style={[styles.arrowRight, { borderLeftColor: color }]} />
    </View>
  );
}

function StatsIcon({ color }: { color: string }) {
  return (
    <View style={[styles.iconBox, styles.statsRow]}>
      <View style={[styles.bar, styles.barSm, { backgroundColor: color }]} />
      <View style={[styles.bar, styles.barMd, { backgroundColor: color }]} />
      <View style={[styles.bar, styles.barLg, { backgroundColor: color }]} />
    </View>
  );
}

function ProfileIcon({ color }: { color: string }) {
  return (
    <View style={styles.iconBox}>
      <View style={[styles.head, { borderColor: color }]} />
      <View style={[styles.shoulders, { borderColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: space.sm,
    paddingVertical: 4,
    borderRadius: radii.md,
  },
  wrapActive: {
    transform: [{ translateY: -1 }],
  },
  iconBox: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roof: {
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderBottomWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginBottom: 1,
  },
  house: {
    width: 14,
    height: 10,
    borderWidth: 2,
    borderTopWidth: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 1,
  },
  door: { width: 4, height: 5, borderRadius: 1 },
  bill: {
    width: 12,
    height: 16,
    borderWidth: 2,
    borderRadius: 2,
    padding: 2,
    justifyContent: 'center',
    gap: 2,
  },
  billLine: { height: 1.5, width: '100%', borderRadius: 1 },
  billLineShort: { width: '70%' },
  arrowRight: {
    position: 'absolute',
    right: -1,
    width: 0,
    height: 0,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderLeftWidth: 5,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  statsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  bar: { width: 4, borderRadius: 1 },
  barSm: { height: 8 },
  barMd: { height: 13 },
  barLg: { height: 18 },
  head: {
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 2,
    marginBottom: 1,
  },
  shoulders: {
    width: 16,
    height: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 2,
    borderBottomWidth: 0,
  },
});

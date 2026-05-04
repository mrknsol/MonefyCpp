import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { ThemeColors } from '../theme/colors';

export function DecorBackdrop({ colors }: { colors: ThemeColors }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View
        style={[
          styles.blob,
          styles.blobTeal,
          { backgroundColor: colors.decorTeal },
        ]}
      />
      <View
        style={[
          styles.blob,
          styles.blobAmber,
          { backgroundColor: colors.decorAmber },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blobTeal: {
    width: 280,
    height: 280,
    top: -80,
    right: -100,
  },
  blobAmber: {
    width: 220,
    height: 220,
    bottom: '15%',
    left: -90,
  },
});

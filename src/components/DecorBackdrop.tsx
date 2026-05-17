import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { ThemeColors } from '../theme/colors';

export function DecorBackdrop({ colors }: { colors: ThemeColors }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View
        style={[
          styles.blob,
          styles.blobPrimary,
          { backgroundColor: colors.decorTeal },
        ]}
      />
      <View
        style={[
          styles.blob,
          styles.blobGold,
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
  blobPrimary: {
    width: 320,
    height: 320,
    top: -120,
    right: -120,
  },
  blobGold: {
    width: 200,
    height: 200,
    bottom: '20%',
    left: -80,
  },
});

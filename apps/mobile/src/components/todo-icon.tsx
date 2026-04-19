'use client';

import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

export function TodoIcon({ size = 24, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={[styles.checkbox, { borderColor: color }]}>
        <Text style={[styles.checkmark, { color }]}>✓</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkbox: {
    width: '70%',
    height: '70%',
    borderWidth: 2,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 12,
    fontWeight: '700',
  },
});
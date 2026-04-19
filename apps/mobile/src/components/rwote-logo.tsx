'use client';

import { Text, StyleSheet, View } from 'react-native';

interface RwoteLogoProps {
  size?: 'small' | 'medium' | 'large';
}

export function RwoteLogo({ size = 'medium' }: RwoteLogoProps) {
  const sizes = {
    small: { fontSize: 24 },
    medium: { fontSize: 32 },
    large: { fontSize: 48 },
  };

  return (
    <Text style={[styles.logo, sizes[size]]}>Rwote</Text>
  );
}

const styles = StyleSheet.create({
  logo: {
    fontFamily: "'Grand Hotel', cursive",
    fontWeight: '400',
  },
});
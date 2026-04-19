'use client';

import { Image } from 'expo-image';

interface RwoteLogoProps {
  size?: 'small' | 'medium' | 'large';
}

export function RwoteLogo({ size = 'medium' }: RwoteLogoProps) {
  const sizes = {
    small: { width: 80, height: 35 },
    medium: { width: 100, height: 44 },
    large: { width: 140, height: 61 },
  };

  return (
    <Image
      source={require('@/assets/images/rwotelogo-text.svg')}
      style={sizes[size]}
      contentFit="contain"
    />
  );
}
'use client';

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SafeAreaProps {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function SafeArea({
  children,
  style,
  edges = ['top', 'bottom'],
}: SafeAreaProps) {
  const insets = useSafeAreaInsets();

  const styleStyles: ViewStyle[] = [];
  if (edges.includes('top')) styleStyles.push({ paddingTop: insets.top });
  if (edges.includes('bottom')) styleStyles.push({ paddingBottom: insets.bottom });
  if (edges.includes('left')) styleStyles.push({ paddingLeft: insets.left });
  if (edges.includes('right')) styleStyles.push({ paddingRight: insets.right });

  return (
    <View style={[styles.container, ...styleStyles, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
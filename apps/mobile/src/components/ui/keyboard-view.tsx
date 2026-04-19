'use client';

import React from 'react';
import { View, StyleSheet, ViewStyle, Keyboard, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface KeyboardAvoidingWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function KeyboardAvoidingWrapper({
  children,
  style,
}: KeyboardAvoidingWrapperProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.keyboardView,
          { paddingBottom: Platform.OS === 'ios' ? 0 : insets.bottom },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
});
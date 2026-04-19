'use client';

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '@/components/theme-provider';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const { theme } = useTheme();
  const translateX = useSharedValue(-200);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  translateX.value = withRepeat(
    withTiming(200, { duration: 1500, easing: Easing.linear }),
    -1,
    false
  );

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.colors.surfaceAlt,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: theme.colors.border,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}

interface SkeletonCardProps {
  style?: ViewStyle;
}

export function SkeletonCard({ style }: SkeletonCardProps) {
  const { theme } = useTheme();
  const s = theme.spacing;

  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderRadius: 12,
          padding: s.md,
          marginBottom: s.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        style,
      ]}
    >
      <Skeleton width="60%" height={18} borderRadius={4} style={{ marginBottom: s.sm }} />
      <Skeleton width="100%" height={14} borderRadius={4} style={{ marginBottom: s.xs }} />
      <Skeleton width="80%" height={14} borderRadius={4} style={{ marginBottom: s.md }} />
      <View style={{ flexDirection: 'row', gap: s.sm }}>
        <Skeleton width={60} height={20} borderRadius={4} />
        <Skeleton width={60} height={20} borderRadius={4} />
      </View>
    </View>
  );
}

interface SkeletonListProps {
  count?: number;
}

export function SkeletonList({ count = 3 }: SkeletonListProps) {
  return (
    <View style={{ padding: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}
import { Stack } from 'expo-router/stack';
import { useTheme } from '@/components/theme-provider';

export default function SettingsLayout() {
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.bg },
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}

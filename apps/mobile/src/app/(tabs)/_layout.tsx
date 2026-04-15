import { Stack } from 'expo-router/stack';
import { useTheme } from '@/components/theme-provider';

export default function TabsLayout() {
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.textPrimary,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.colors.bg },
      }}
    >
      <Stack.Screen name="(notes)" options={{ title: 'Notes' }} />
      <Stack.Screen name="(settings)" options={{ title: 'Settings' }} />
    </Stack>
  );
}

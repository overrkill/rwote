import { Stack } from 'expo-router/stack';
import { useTheme } from '@/components/theme-provider';

export default function NotesLayout() {
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.bg },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="new"
        options={{
          title: 'New Note',
          presentation: 'modal',
          headerShown: true,
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.textPrimary,
        }}
      />
      <Stack.Screen
        name="note/[id]"
        options={{
          title: 'Edit Note',
          headerShown: true,
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.textPrimary,
        }}
      />
    </Stack>
  );
}

import { Stack } from 'expo-router/stack';
import { useTheme } from '@/components/theme-provider';

export default function NotesLayout() {
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.textPrimary,
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: theme.colors.bg,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Notes',
        }}
      />
      <Stack.Screen
        name="new"
        options={{
          title: 'New Note',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="note/[id]"
        options={{
          title: 'Edit Note',
        }}
      />
    </Stack>
  );
}

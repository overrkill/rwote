import { useTheme } from '@/components/theme-provider';
import { Stack } from 'expo-router/stack';

import { Text, View } from 'react-native';

export default function NotesLayout() {
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.bg },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Notes',
          headerShown: true,
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.textPrimary,
          headerShadowVisible: false,
          headerTitle: () => (
            <View style={{ alignItems: "flex-start" }}>
              <Text style={{color:theme.colors.textPrimary}}>Notes</Text>
            </View>
          ),
        }}
      />
      <Stack.Screen
        name="new"
        options={{
          title: 'New Note',
          headerShown: true,
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.textPrimary,
          headerShadowVisible: false,
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="note/[id]"
        options={{
          title: 'Edit Note',
          headerShown: true,
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.textPrimary,
          headerShadowVisible: false,
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}

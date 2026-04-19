import { Stack } from 'expo-router';
import { useTheme } from '@/components/theme-provider';

import { View } from 'react-native';

export default function TodosLayout() {
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
          title: 'Todos',
          headerShown: true,
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.textPrimary,
          headerShadowVisible: false,
          headerTitle: () => (
            <View style={{ alignItems: 'center' }}>
              Todos
            </View>
          ),
        }}
      />
    </Stack>
  );
}
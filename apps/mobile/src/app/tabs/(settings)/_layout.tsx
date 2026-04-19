import { useTheme } from '@/components/theme-provider';
import { Stack } from 'expo-router/stack';

import { Text, View } from 'react-native';

export default function SettingsLayout() {
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
          title: 'Settings',
          headerShown: true,
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.textPrimary,
          headerShadowVisible: false,
          headerTitle: () => (
            <View style={{ alignItems: 'flex-start' }}>
              <Text style={{color:theme.colors.textPrimary}}>Settings</Text>
            </View>
          ),
        }}
      />
    </Stack>
  );
}

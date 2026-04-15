import { useEffect, useState } from 'react';
import { View, ActivityIndicator, useColorScheme } from 'react-native';
import { useAuthStore } from '@/stores/auth-store';
import { ThemeProvider } from '@/components/theme-provider';
import AuthNavigator from './(auth)/_layout';
import TabsNavigator from './(tabs)/_layout';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [ready, setReady] = useState(false);
  const { initialize, user } = useAuthStore();

  useEffect(() => {
    initialize();
    setReady(true);
  }, [initialize]);

  if (!ready) {
    const bg = colorScheme === 'dark' ? '#1a1a1e' : '#ffffff';
    const color = colorScheme === 'dark' ? '#f5f2ec' : '#1a1a1a';
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: bg }}>
        <ActivityIndicator size="large" color={color} />
      </View>
    );
  }

  return (
    <ThemeProvider>
      {user ? <TabsNavigator /> : <AuthNavigator />}
    </ThemeProvider>
  );
}

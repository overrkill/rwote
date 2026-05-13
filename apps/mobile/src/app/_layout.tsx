import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '@/components/theme-provider';
import { ToastProvider } from '@/components/toast-context';
import { useAuthStore } from '@/stores/auth-store';
import { Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [ready, setReady] = useState(false);
  const initRef = useRef(false);
  const { user, initialize } = useAuthStore();

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    initialize();
    setReady(true);
  }, []);

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
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
      <ThemeProvider>
        <ToastProvider>
          {user ? (
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(app)" />
            </Stack>
          ) : (
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="auth" />
            </Stack>
          )}
        </ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

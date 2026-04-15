import { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import { useAuthStore } from '@/stores/auth-store';
import { ThemeProvider } from '@/components/theme-provider';

function AuthStack() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="auth" />
    </Stack>
  );
}

function MainStack() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="tabs" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [ready, setReady] = useState(false);
  const initRef = useRef(false);
  const { user } = useAuthStore();

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
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
    <ThemeProvider>
      {user ? <MainStack /> : <AuthStack />}
    </ThemeProvider>
  );
}

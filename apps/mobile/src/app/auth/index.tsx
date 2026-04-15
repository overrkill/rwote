'use client';

import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTheme } from '@/components/theme-provider';
import { useAuthStore } from '@/stores/auth-store';

export default function LoginScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { signIn, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    try {
      await signIn(email, password);
      router.replace('/tabs/(notes)');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to sign in');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ ...styles.container, backgroundColor: theme.colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={{ ...styles.title, color: theme.colors.textPrimary }}>Rwote</Text>
        <Text style={{ ...styles.subtitle, color: theme.colors.textSecondary }}>
          Sign in to your account
        </Text>

        <View style={styles.form}>
          <TextInput
            style={{
              ...styles.input,
              backgroundColor: theme.colors.surface,
              color: theme.colors.textPrimary,
              borderColor: theme.colors.border,
            }}
            placeholder="Email"
            placeholderTextColor={theme.colors.textTertiary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={{
              ...styles.input,
              backgroundColor: theme.colors.surface,
              color: theme.colors.textPrimary,
              borderColor: theme.colors.border,
            }}
            placeholder="Password"
            placeholderTextColor={theme.colors.textTertiary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Pressable
            style={{ ...styles.button, backgroundColor: theme.colors.accentBtn, opacity: isLoading ? 0.6 : 1 }}
            onPress={handleSignIn}
            disabled={isLoading}
          >
            <Text style={{ ...styles.buttonText, color: theme.colors.bg }}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={{ ...styles.footerText, color: theme.colors.textSecondary }}>
            Don&apos;t have an account?{' '}
          </Text>
          <Link href="/auth/register">
            <Text style={{ ...styles.link, color: theme.colors.accent }}>Sign Up</Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 36, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 32 },
  form: { gap: 16 },
  input: { borderWidth: 1, borderRadius: 12, padding: 16, fontSize: 16 },
  button: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { fontSize: 16, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { fontSize: 14 },
  link: { fontSize: 14, fontWeight: '600' },
});

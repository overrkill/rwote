'use client';

import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTheme } from '@/components/theme-provider';
import { useAuthStore } from '@/stores/auth-store';
import { useToast } from '@/components/toast-context';
import { RwoteLogo } from '@/components/rwote-logo';

export default function LoginScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { signIn, signInWithGoogle, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    try {
      await signIn(email, password);
      router.replace('/(app)' as any);
    } catch (err: any) {
      toast.error(err.message || 'Failed to sign in');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      router.replace('/(app)' as any);
    } catch (err: any) {
      toast.error(err.message || 'Failed to sign in with Google');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <RwoteLogo size="large" />
          </View>
          <Text style={{ ...styles.subtitle, color: theme.colors.textSecondary }}>
            Sign in to your account
          </Text>

          <View style={styles.form}>
            <Pressable
              style={{ ...styles.googleButton, borderColor: theme.colors.border }}
              onPress={handleGoogleSignIn}
              disabled={isLoading}
            >
              <Text style={{ ...styles.googleButtonText, color: theme.colors.textPrimary }}>
                Continue with Google
              </Text>
            </Pressable>

            <View style={styles.divider}>
              <View style={{ ...styles.dividerLine, backgroundColor: theme.colors.border }} />
              <Text style={{ ...styles.dividerText, color: theme.colors.textTertiary }}>or</Text>
              <View style={{ ...styles.dividerLine, backgroundColor: theme.colors.border }} />
            </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 16 },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 32 },
  form: { gap: 16 },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  googleButtonText: { fontSize: 16, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 14 },
  input: { borderWidth: 1, borderRadius: 12, padding: 16, fontSize: 16 },
  button: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { fontSize: 16, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { fontSize: 14 },
  link: { fontSize: 14, fontWeight: '600' },
});

'use client';

import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTheme } from '@/components/theme-provider';
import { useAuthStore } from '@/stores/auth-store';
import { useToast } from '@/components/toast-context';
import { RwoteLogo } from '@/components/rwote-logo';

export default function RegisterScreen() {
  const { theme } = useTheme();
  const toast = useToast();
  const router = useRouter();
  const { signUp, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      await signUp(email, password);
      router.replace('/(app)' as any);
    } catch {
      toast.error('Failed to create account');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ ...styles.container, backgroundColor: theme.colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <RwoteLogo size="large" />
        </View>
        <Text style={{ ...styles.subtitle, color: theme.colors.textSecondary }}>
          Start capturing your insights
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

          <TextInput
            style={{
              ...styles.input,
              backgroundColor: theme.colors.surface,
              color: theme.colors.textPrimary,
              borderColor: theme.colors.border,
            }}
            placeholder="Confirm Password"
            placeholderTextColor={theme.colors.textTertiary}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <Pressable
            style={{ ...styles.button, backgroundColor: theme.colors.accentBtn, opacity: isLoading ? 0.6 : 1 }}
            onPress={handleSignUp}
            disabled={isLoading}
          >
            <Text style={{ ...styles.buttonText, color: theme.colors.bg }}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={{ ...styles.footerText, color: theme.colors.textSecondary }}>
            Already have an account?{' '}
          </Text>
          <Link href="/auth">
            <Text style={{ ...styles.link, color: theme.colors.accent }}>Sign In</Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 16 },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 32 },
  form: { gap: 16 },
  input: { borderWidth: 1, borderRadius: 12, padding: 16, fontSize: 16 },
  button: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { fontSize: 16, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { fontSize: 14 },
  link: { fontSize: 14, fontWeight: '600' },
});

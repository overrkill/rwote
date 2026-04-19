'use client';

import { View, Text, Pressable, ScrollView, Alert, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useTheme, THEMES, Theme } from '@/components/theme-provider';
import { useAuthStore } from '@/stores/auth-store';
import { useNotesStore } from '@/stores/notes-store';
import { Check } from 'lucide-react-native';
import { storage } from '@/lib/storage';
import { useToast } from '@/components/toast-context';

type AIMode = 'off' | 'local' | 'cloud';

export default function SettingsScreen() {
  const { theme, themeId, setThemeId } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { user, signOut, isLoading } = useAuthStore();
  const { setNotes } = useNotesStore();
  const [aiMode, setAiMode] = useState<AIMode>('off');
  const [localUrl, setLocalUrl] = useState('');
  const [localModel, setLocalModel] = useState('');

  useEffect(() => {
    const savedMode = storage.get<AIMode>('ai_mode', 'off');
    const savedUrl = storage.get<string>('ai_local_url', '');
    const savedModel = storage.get<string>('ai_local_model', '');
    setAiMode(savedMode);
    setLocalUrl(savedUrl);
    setLocalModel(savedModel);
  }, []);

  const handleAiModeChange = (mode: AIMode) => {
    setAiMode(mode);
    storage.set('ai_mode', mode);
  };

  const handleLocalUrlChange = (url: string) => {
    setLocalUrl(url);
    storage.set('ai_local_url', url);
  };

  const handleLocalModelChange = (model: string) => {
    setLocalModel(model);
    storage.set('ai_local_model', model);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              setNotes([]);
              router.replace('/auth');
            } catch {
              toast.error('Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const renderThemeOption = (t: Theme) => {
    const isSelected = themeId === t.id;
    return (
      <Pressable
        key={t.id}
        style={{
          width: 150,
          borderRadius: 12,
          padding: s.md,
          backgroundColor: t.colors.bg,
          borderColor: isSelected ? t.colors.accent : t.colors.border,
          borderWidth: isSelected ? 2 : 1,
          position: 'relative',
        }}
        onPress={() => setThemeId(t.id)}
      >
        <View style={{ height: 60, borderRadius: 8, overflow: 'hidden', marginBottom: 8, justifyContent: 'flex-end', padding: 8, gap: 6 }}>
          <View style={{ height: 16, borderRadius: 4, backgroundColor: t.colors.surface }} />
          <View style={{ height: 10, width: '70%', borderRadius: 4, backgroundColor: t.colors.textTertiary }} />
        </View>
        <Text style={{ fontSize: 14, fontWeight: '500', color: t.colors.textPrimary }}>
          {t.name}
        </Text>
        {isSelected && (
          <View style={{ position: 'absolute', top: 12, right: 12 }}>
            <Check size={18} color={t.colors.accent} />
          </View>
        )}
      </Pressable>
    );
  };

  const s = theme.spacing;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{ padding: s.lg, paddingBottom: 100 }}
    >
      <View style={{ marginBottom: s.xl }}>
        <Text style={{ fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: s.sm, color: theme.colors.textSecondary }}>
          Account
        </Text>
        <View style={{ borderRadius: 12, overflow: 'hidden', backgroundColor: theme.colors.surface }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: s.lg }}>
            <Text style={{ fontSize: 16, color: theme.colors.textPrimary }}>
              Email
            </Text>
            <Text style={{ fontSize: 16, color: theme.colors.textSecondary }}>
              {user?.email || 'Not signed in'}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ marginBottom: s.xl }}>
        <Text style={{ fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: s.sm, color: theme.colors.textSecondary }}>
          Appearance
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.md, paddingRight: s.lg }}>
            {Object.values(THEMES).map(renderThemeOption)}
          </View>
        </ScrollView>
      </View>

      <View style={{ marginBottom: s.xl }}>
        <Text style={{ fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: s.sm, color: theme.colors.textSecondary }}>
          AI Settings
        </Text>
        <View style={{ borderRadius: 12, overflow: 'hidden', backgroundColor: theme.colors.surface, padding: s.lg }}>
          <View style={{ flexDirection: 'row', gap: s.sm }}>
            {(['off', 'local', 'cloud'] as AIMode[]).map((mode) => (
              <Pressable
                key={mode}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 8,
                  alignItems: 'center',
                  backgroundColor: aiMode === mode ? theme.colors.accentBtn : theme.colors.bg,
                }}
                onPress={() => handleAiModeChange(mode)}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: aiMode === mode ? theme.colors.bg : theme.colors.textSecondary }}>
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          {aiMode === 'local' && (
            <View style={{ marginTop: s.lg }}>
              <Text style={{ fontSize: 13, fontWeight: '500', marginBottom: s.xs, color: theme.colors.textSecondary }}>
                API URL
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderRadius: 8,
                  padding: s.md,
                  fontSize: 14,
                  backgroundColor: theme.colors.bg,
                  color: theme.colors.textPrimary,
                  borderColor: theme.colors.border,
                }}
                placeholder="http://localhost:11434/v1/chat/completions"
                placeholderTextColor={theme.colors.textTertiary}
                value={localUrl}
                onChangeText={handleLocalUrlChange}
              />
              <Text style={{ fontSize: 13, fontWeight: '500', marginBottom: s.xs, marginTop: s.md, color: theme.colors.textSecondary }}>
                Model
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderRadius: 8,
                  padding: s.md,
                  fontSize: 14,
                  backgroundColor: theme.colors.bg,
                  color: theme.colors.textPrimary,
                  borderColor: theme.colors.border,
                }}
                placeholder="llama3.2"
                placeholderTextColor={theme.colors.textTertiary}
                value={localModel}
                onChangeText={handleLocalModelChange}
              />
            </View>
          )}

          {aiMode === 'cloud' && (
            <View style={{ marginTop: s.md }}>
              <Text style={{ fontSize: 13, textAlign: 'center', color: theme.colors.textTertiary }}>
                Cloud AI uses your subscription credits
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={{ marginBottom: s.xl }}>
        <Text style={{ fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: s.sm, color: theme.colors.textSecondary }}>
          About
        </Text>
        <View style={{ borderRadius: 12, overflow: 'hidden', backgroundColor: theme.colors.surface }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: s.lg }}>
            <Text style={{ fontSize: 16, color: theme.colors.textPrimary }}>
              Version
            </Text>
            <Text style={{ fontSize: 16, color: theme.colors.textSecondary }}>
              1.0.0
            </Text>
          </View>
        </View>
      </View>

      {user && (
        <View>
          <Pressable
            style={{ borderRadius: 12, padding: s.lg, alignItems: 'center', backgroundColor: theme.colors.surface }}
            onPress={handleSignOut}
            disabled={isLoading}
          >
            <Text style={{ fontSize: 16, fontWeight: '500', color: '#ff4444' }}>
              {isLoading ? 'Signing out...' : 'Sign Out'}
            </Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}
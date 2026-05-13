import { View, Text, Pressable, ScrollView, Alert, TextInput } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useTheme, THEMES, Theme } from '@/components/theme-provider';
import { useAuthStore } from '@/stores/auth-store';
import { useNotesStore } from '@/stores/notes-store';
import { useUIStore } from '@/stores/ui-store';
import { Check } from 'lucide-react-native';
import { storage } from '@/lib/storage';
import { useToast } from '@/components/toast-context';

type AIMode = 'off' | 'local' | 'cloud';

export function SettingsPanel() {
  const { theme, themeId, setThemeId } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const isLoading = useAuthStore((s) => s.isLoading);
  const setNotes = useNotesStore((s) => s.setNotes);
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

  const s = theme.spacing;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.surface }}
      contentContainerStyle={{ padding: s.lg, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Account */}
      <Section title="Account" theme={theme}>
        <Row
          label="Email"
          value={user?.email || 'Not signed in'}
          theme={theme}
          s={s}
        />
      </Section>

      {/* Appearance */}
      <Section title="Appearance" theme={theme}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: s.md, paddingRight: s.lg }}>
            {Object.values(THEMES).map((t) => (
              <ThemeOption
                key={t.id}
                t={t}
                isSelected={themeId === t.id}
                onSelect={() => setThemeId(t.id)}
                theme={theme}
                s={s}
              />
            ))}
          </View>
        </ScrollView>
      </Section>

      {/* AI Settings */}
      <Section title="AI Settings" theme={theme}>
        <View style={{ borderRadius: 12, overflow: 'hidden', backgroundColor: theme.colors.surfaceAlt, padding: s.lg }}>
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
                <Text style={{
                  fontSize: 14, fontWeight: '600',
                  color: aiMode === mode ? theme.colors.bg : theme.colors.textSecondary,
                }}>
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
                  borderWidth: 1, borderRadius: 8, padding: s.md, fontSize: 14,
                  backgroundColor: theme.colors.bg, color: theme.colors.textPrimary,
                  borderColor: theme.colors.border,
                }}
                placeholder="http://localhost:11434"
                placeholderTextColor={theme.colors.textTertiary}
                value={localUrl}
                onChangeText={handleLocalUrlChange}
              />
              <Text style={{
                fontSize: 13, fontWeight: '500', marginBottom: s.xs,
                marginTop: s.md, color: theme.colors.textSecondary,
              }}>
                Model
              </Text>
              <TextInput
                style={{
                  borderWidth: 1, borderRadius: 8, padding: s.md, fontSize: 14,
                  backgroundColor: theme.colors.bg, color: theme.colors.textPrimary,
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
      </Section>

      {/* About */}
      <Section title="About" theme={theme}>
        <Row label="Version" value="1.0.0" theme={theme} s={s} />
      </Section>

      {/* Sign Out */}
      {user && (
        <View style={{ marginTop: s.xl }}>
          <Pressable
            style={{
              borderRadius: 12, padding: s.lg, alignItems: 'center',
              backgroundColor: theme.colors.surfaceAlt,
            }}
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

const Section = React.memo(function Section({ title, theme, children }: { title: string; theme: any; children: React.ReactNode }) {
  const s = theme.spacing;
  return (
    <View style={{ marginBottom: s.xl }}>
      <Text style={{
        fontSize: 12, fontWeight: '600', textTransform: 'uppercase',
        letterSpacing: 0.5, marginBottom: s.sm, color: theme.colors.textSecondary,
      }}>
        {title}
      </Text>
      <View style={{ borderRadius: 12, overflow: 'hidden', backgroundColor: theme.colors.surfaceAlt }}>
        {children}
      </View>
    </View>
  );
});

const Row = React.memo(function Row({ label, value, theme, s }: { label: string; value: string; theme: any; s: any }) {
  return (
    <View style={{
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', padding: s.lg,
    }}>
      <Text style={{ fontSize: 16, color: theme.colors.textPrimary }}>{label}</Text>
      <Text style={{ fontSize: 16, color: theme.colors.textSecondary }}>{value}</Text>
    </View>
  );
});

const ThemeOption = React.memo(function ThemeOption({ t, isSelected, onSelect, theme, s }: {
  t: Theme; isSelected: boolean; onSelect: () => void; theme: any; s: any;
}) {
  return (
    <Pressable
      style={{
        width: 130, borderRadius: 12, padding: s.md,
        backgroundColor: t.colors.bg,
        borderColor: isSelected ? t.colors.accent : t.colors.border,
        borderWidth: isSelected ? 2 : 1,
        position: 'relative',
      }}
      onPress={onSelect}
    >
      <View style={{
        height: 50, borderRadius: 8, overflow: 'hidden',
        marginBottom: 8, justifyContent: 'flex-end', padding: 8, gap: 4,
      }}>
        <View style={{ height: 14, borderRadius: 4, backgroundColor: t.colors.surface }} />
        <View style={{ height: 8, width: '60%', borderRadius: 4, backgroundColor: t.colors.textTertiary }} />
      </View>
      <Text style={{ fontSize: 13, fontWeight: '500', color: t.colors.textPrimary }}>
        {t.name}
      </Text>
      {isSelected && (
        <View style={{ position: 'absolute', top: 12, right: 12 }}>
          <Check size={16} color={t.colors.accent} />
        </View>
      )}
    </Pressable>
  );
});

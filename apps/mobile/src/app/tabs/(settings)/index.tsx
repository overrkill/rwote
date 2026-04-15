'use client';

import { View, Text, Pressable, StyleSheet, ScrollView, Alert } from 'react-native';
import { useTheme, THEMES, Theme } from '@/components/theme-provider';
import { useAuthStore } from '@/stores/auth-store';
import { CheckIcon } from '@/components/icons';

export default function SettingsScreen() {
  const { theme, themeId, setThemeId } = useTheme();
  const { user, signOut, isLoading } = useAuthStore();

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
            } catch {
              Alert.alert('Error', 'Failed to sign out');
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
          ...styles.themeOption,
          backgroundColor: t.colors.bg,
          borderColor: isSelected ? t.colors.accent : t.colors.border,
          borderWidth: isSelected ? 2 : 1,
        }}
        onPress={() => setThemeId(t.id)}
      >
        <View style={styles.themePreview}>
          <View style={{ ...styles.previewBar, backgroundColor: t.colors.surface }} />
          <View style={{ ...styles.previewBar, ...styles.previewBarSmall, backgroundColor: t.colors.textTertiary }} />
        </View>
        <Text style={{ ...styles.themeName, color: t.colors.textPrimary }}>
          {t.name}
        </Text>
        {isSelected && (
          <View style={styles.checkmark}>
            <CheckIcon size={18} color={t.colors.accent} />
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <ScrollView
      style={{ ...styles.container, backgroundColor: theme.colors.bg }}
      contentContainerStyle={styles.content}
    >
      <View style={styles.section}>
        <Text style={{ ...styles.sectionTitle, color: theme.colors.textSecondary }}>
          Account
        </Text>
        <View style={{ ...styles.card, backgroundColor: theme.colors.surface }}>
          <View style={styles.row}>
            <Text style={{ ...styles.label, color: theme.colors.textPrimary }}>
              Email
            </Text>
            <Text style={{ ...styles.value, color: theme.colors.textSecondary }}>
              {user?.email || 'Not signed in'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={{ ...styles.sectionTitle, color: theme.colors.textSecondary }}>
          Appearance
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.themesContainer}>
          <View style={styles.themesGrid}>
            {Object.values(THEMES).map(renderThemeOption)}
          </View>
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={{ ...styles.sectionTitle, color: theme.colors.textSecondary }}>
          About
        </Text>
        <View style={{ ...styles.card, backgroundColor: theme.colors.surface }}>
          <View style={styles.row}>
            <Text style={{ ...styles.label, color: theme.colors.textPrimary }}>
              Version
            </Text>
            <Text style={{ ...styles.value, color: theme.colors.textSecondary }}>
              1.0.0
            </Text>
          </View>
        </View>
      </View>

      {user && (
        <View style={styles.section}>
          <Pressable
            style={{ ...styles.signOutBtn, backgroundColor: theme.colors.surface }}
            onPress={handleSignOut}
            disabled={isLoading}
          >
            <Text style={{ ...styles.signOutText, color: '#ff4444' }}>
              {isLoading ? 'Signing out...' : 'Sign Out'}
            </Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, paddingHorizontal: 4 },
  card: { borderRadius: 12, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  label: { fontSize: 16 },
  value: { fontSize: 16 },
  themesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  themesContainer: { paddingRight: 16 },
  themeOption: { width: 150, borderRadius: 12, padding: 12, position: 'relative' },
  themePreview: { height: 60, borderRadius: 8, overflow: 'hidden', marginBottom: 8, justifyContent: 'flex-end', padding: 8, gap: 6 },
  previewBar: { height: 16, borderRadius: 4 },
  previewBarSmall: { height: 10, width: '70%' },
  themeName: { fontSize: 14, fontWeight: '500' },
  checkmark: { position: 'absolute', top: 12, right: 12 },
  signOutBtn: { borderRadius: 12, padding: 16, alignItems: 'center' },
  signOutText: { fontSize: 16, fontWeight: '500' },
});

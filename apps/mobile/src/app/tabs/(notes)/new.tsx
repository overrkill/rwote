'use client';

import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useTheme } from '@/components/theme-provider';
import { useNotesStore } from '@/stores/notes-store';
import { useAuthStore } from '@/stores/auth-store';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/toast-context';

const AVAILABLE_TAGS = ['general','thought','uncategorized'];

export default function NewNoteScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['general']);
  const [saving, setSaving] = useState(false);

  const { addNote } = useNotesStore();
  const { accessToken } = useAuthStore();

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    setSaving(true);
    try {
      const noteData = {
        title: title.trim(),
        content: content.trim(),
        tags: selectedTags,
        pinned: false,
      };

      const tempNote = {
        id: `temp_${Date.now()}`,
        ...noteData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      addNote(tempNote);

      if (accessToken) {
        await supabase.saveNote(accessToken, {
          text: title.trim(),
          note: content.trim(),
          tag: selectedTags[0] || 'general',
          date: new Date().toISOString(),
          pinned: false,
          updated_at: new Date().toISOString(),
        });
      }

      router.back();
    } catch {
      toast.error('Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={handleSave} disabled={saving}>
              <Text style={{ color: theme.colors.accent, fontWeight: '600', opacity: saving ? 0.5 : 1 }}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView
        style={{ ...styles.container, backgroundColor: theme.colors.bg }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          style={{
            ...styles.titleInput,
            color: theme.colors.textPrimary,
            borderBottomColor: theme.colors.border,
          }}
          placeholder="Title"
          placeholderTextColor={theme.colors.textTertiary}
          value={title}
          onChangeText={setTitle}
          autoFocus
        />

        <TextInput
          style={{
            ...styles.contentInput,
            color: theme.colors.textPrimary,
          }}
          placeholder="Start writing your insight..."
          placeholderTextColor={theme.colors.textTertiary}
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
        />

        <View style={styles.tagsSection}>
          <Text style={{ ...styles.tagsLabel, color: theme.colors.textSecondary }}>
            Tags
          </Text>
          <View style={styles.tagsGrid}>
            {AVAILABLE_TAGS.map((tag) => (
              <Pressable
                key={tag}
                style={{
                  ...styles.tagChip,
                  backgroundColor: selectedTags.includes(tag)
                    ? theme.colors.accentBtn
                    : theme.colors.surface,
                }}
                onPress={() => toggleTag(tag)}
              >
                <Text
                  style={{
                    ...styles.tagText,
                    color: selectedTags.includes(tag)
                      ? theme.colors.bg
                      : theme.colors.textSecondary,
                  }}
                >
                  {tag.charAt(0).toUpperCase() + tag.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 },
  titleInput: { fontSize: 24, fontWeight: '600', paddingVertical: 8, borderBottomWidth: 1, marginBottom: 12 },
  contentInput: { fontSize: 16, lineHeight: 24, minHeight: 150, marginBottom: 16 },
  tagsSection: { marginTop: 8 },
  tagsLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  tagsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  tagText: { fontSize: 14, fontWeight: '500' },
});

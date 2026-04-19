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
import { useState, useEffect, useMemo } from 'react';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/components/theme-provider';
import { useNotesStore } from '@/stores/notes-store';
import { useAuthStore } from '@/stores/auth-store';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/toast-context';

function getTagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 85%)`;
}

function getTagTextColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 25%)`;
}

function extractTags(text: string): string[] {
  const matches = text.match(/#(\w+)/g);
  return matches ? matches.map((t) => t.slice(1).toLowerCase()) : [];
}

function cleanText(text: string): string {
  return text.replace(/#\w+/g, '').trim();
}

export default function NoteDetailScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [removedTags, setRemovedTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const { notes, updateNote } = useNotesStore();
  const { accessToken } = useAuthStore();

  useEffect(() => {
    const note = notes.find((n) => n.id === id);
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setRemovedTags([]);
    }
  }, [id, notes]);

  const combinedText = `${title} ${content}`;
  const parsedTags = useMemo(() => extractTags(combinedText), [title, content]);
  
  // Start with existing tags from note, filter out removed ones, add new parsed ones
  const note = notes.find((n) => n.id === id);
  const existingTags = note?.tags || [];
  
  const allTags = useMemo(() => {
    const keptExisting = existingTags.filter((t) => !removedTags.includes(t));
    const newTags = parsedTags.filter((t) => !keptExisting.includes(t));
    return [...new Set([...keptExisting, ...newTags])];
  }, [existingTags, parsedTags, removedTags]);

  const removeTag = (tagToRemove: string) => {
    if (existingTags.includes(tagToRemove) && !removedTags.includes(tagToRemove)) {
      setRemovedTags([...removedTags, tagToRemove]);
    } else if (parsedTags.includes(tagToRemove)) {
      const regex = new RegExp(`#${tagToRemove}\\b`, 'gi');
      setTitle(title.replace(regex, '').trim());
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    setSaving(true);
    try {
      const cleanedTitle = cleanText(title);
      const cleanedContent = cleanText(content);
      const finalTags = allTags.length > 0 ? allTags : ['uncategorized'];

      const updates = {
        title: cleanedTitle,
        content: cleanedContent,
        tags: finalTags,
        updated_at: new Date().toISOString(),
      };

      updateNote(id!, updates);

      if (accessToken && note) {
        await supabase.saveNote(accessToken, {
          id: note.id,
          text: cleanedTitle,
          note: cleanedContent,
          tag: finalTags.join(','),
          date: note.created_at,
          pinned: note.pinned,
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
            minHeight: 96,
            maxHeight: 96,
          }}
          placeholder="Write your insight... use #hashtag to add tags"
          placeholderTextColor={theme.colors.textTertiary}
          value={title}
          onChangeText={setTitle}
          multiline
          scrollEnabled
        />

        <TextInput
          style={{
            ...styles.contentInput,
            color: theme.colors.textPrimary,
          }}
          placeholder="Extra context..."
          placeholderTextColor={theme.colors.textTertiary}
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
        />

        {allTags.length > 0 && (
          <View style={styles.tagsSection}>
            <Text style={{ ...styles.tagsLabel, color: theme.colors.textSecondary }}>
              Tags
            </Text>
            <View style={styles.tagsGrid}>
              {allTags.map((tag) => (
                <Pressable
                  key={tag}
                  style={{
                    ...styles.tagChip,
                    backgroundColor: getTagColor(tag),
                  }}
                  onPress={() => removeTag(tag)}
                >
                  <Text style={{ ...styles.tagText, color: getTagTextColor(tag) }}>
                    #{tag}
                  </Text>
                  <Text style={{ ...styles.tagRemove, color: getTagTextColor(tag) }}>×</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 },
  titleInput: { fontSize: 24, fontWeight: '600', paddingVertical: 8, marginBottom: 12 },
  contentInput: { fontSize: 16, lineHeight: 24, minHeight: 150, marginBottom: 16 },
  tagsSection: { marginTop: 8 },
  tagsLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  tagsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 4 },
  tagText: { fontSize: 14, fontWeight: '600' },
  tagRemove: { fontSize: 16, fontWeight: '600' },
});
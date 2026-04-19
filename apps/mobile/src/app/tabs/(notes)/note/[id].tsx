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
import { EyeIcon, EditIcon } from '@/components/icons';
import { MarkdownView } from '@/components/markdown-view';

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
  const [viewMode, setViewMode] = useState(true);

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
        try {
          const result = await supabase.saveNote(accessToken, {
            local_id: note.id,
            text: cleanedTitle,
            note: cleanedContent,
            tag: finalTags.join(','),
            date: note.created_at,
            pinned: note.pinned,
            updated_at: new Date().toISOString(),
          });
          if (result?.id) {
            updateNote(id!, { cloud_id: result.id, synced: true });
          }
        } catch {
          toast.error('Failed to sync note');
        }
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
            <Pressable onPress={() => setViewMode(!viewMode)}>
              {viewMode ? (
                <EditIcon size={22} color={theme.colors.accent} />
              ) : (
                <Pressable onPress={handleSave} disabled={saving}>
                  <Text style={{ color: theme.colors.accent, fontWeight: '600', opacity: saving ? 0.5 : 1 }}>
                    {saving ? 'Saving...' : 'Save'}
                  </Text>
                </Pressable>
              )}
            </Pressable>
          ),
        }}
      />
      <ScrollView
        style={{ ...styles.container, backgroundColor: theme.colors.bg }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {viewMode ? (
          <View>
            <MarkdownView content={title || 'Untitled'} style={styles.titleRead} />
            <MarkdownView content={content || ''} style={styles.contentRead} />
          </View>
        ) : (
          <>
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
          </>
        )}

        {allTags.length > 0 && (
          <View style={styles.tagsSection}>
            <View style={styles.tagsGrid}>
              {allTags.map((tag) => (
                <View
                  key={tag}
                  style={{
                    ...styles.tag,
                    backgroundColor: getTagColor(tag),
                  }}
                >
                  <Text style={{ ...styles.tagText, color: getTagTextColor(tag) }}>
                    #{tag}
                  </Text>
                </View>
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
  content: { paddingHorizontal: 14, paddingTop: 6, paddingBottom: 80 },
  titleInput: { fontSize: 22, fontWeight: '600', paddingVertical: 6, marginBottom: 10 },
  contentInput: { fontSize: 15, lineHeight: 22, minHeight: 120, marginBottom: 12 },
  titleRead: { fontSize: 24, fontWeight: '700', paddingVertical: 10, marginBottom: 12 },
  contentRead: { fontSize: 15, lineHeight: 24, marginBottom: 12, whiteSpace: 'pre-wrap' },
  tagsSection: { marginTop: 12 },
  tagsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagText: { fontSize: 11 },
});
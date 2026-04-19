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
import { useState, useMemo } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useTheme } from '@/components/theme-provider';
import { useNotesStore } from '@/stores/notes-store';
import { useAuthStore } from '@/stores/auth-store';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/toast-context';
import { MarkdownView } from '@/components/markdown-view';
import { Eye, Pencil } from 'lucide-react-native';

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
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

export default function NewNoteScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [removedTags, setRemovedTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState(false);

  const { addNote, updateNote } = useNotesStore();
  const { accessToken } = useAuthStore();

  const combinedText = `${title} ${content}`;
  const parsedTags = useMemo(() => extractTags(combinedText), [title, content]);
  
  const allTags = useMemo(() => {
    const kept = parsedTags.filter((t) => !removedTags.includes(t));
    return [...new Set(kept)];
  }, [parsedTags, removedTags]);

  const removeTag = (tagToRemove: string) => {
    if (parsedTags.includes(tagToRemove) && !removedTags.includes(tagToRemove)) {
      setRemovedTags([...removedTags, tagToRemove]);
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

      const noteData = {
        title: cleanedTitle,
        content: cleanedContent,
        tags: finalTags,
        pinned: false,
        synced: false,
      };

      const localId = generateId();
      const tempNote = {
        id: localId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...noteData,
      };
      addNote(tempNote);

      if (accessToken) {
        try {
          await supabase.saveNote(accessToken, {
            id: localId,
            title: cleanedTitle,
            content: cleanedContent,
            tags: finalTags,
            pinned: false,
            updated_at: new Date().toISOString(),
          });
          updateNote(localId, { synced: true });
        } catch {
          toast.error('Failed to sync note');
        }
      }

      router.back();
    } catch(err) {
      console.log(err)
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
                <Pencil size={22} color={theme.colors.accent} />
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
            <MarkdownView content={title || 'Write your insight...'} style={styles.titleRead} />
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
              autoFocus
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
                <Pressable
                  key={tag}
                  style={{
                    ...styles.tag,
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
  content: { paddingHorizontal: 14, paddingTop: 6, paddingBottom: 80 },
  titleInput: { fontSize: 22, fontWeight: '600', paddingVertical: 6, marginBottom: 10 },
  contentInput: { fontSize: 15, lineHeight: 22, minHeight: 120, marginBottom: 12 },
  titleRead: { fontSize: 24, fontWeight: '700', paddingVertical: 10, marginBottom: 12 },
  contentRead: { fontSize: 15, lineHeight: 24, marginBottom: 12 },
  tagsSection: { marginTop: 12 },
  tagsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, flexDirection: 'row', alignItems: 'center', gap: 2 },
  tagText: { fontSize: 11 },
  tagRemove: { fontSize: 11, fontWeight: '600' },
});
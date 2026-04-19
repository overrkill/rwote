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

  const { addNote } = useNotesStore();
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
          text: cleanedTitle,
          note: cleanedContent,
          tag: finalTags.join(','),
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
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 },
  titleInput: { fontSize: 24, fontWeight: '600', paddingVertical: 8, marginBottom: 12 },
  contentInput: { fontSize: 16, lineHeight: 24, minHeight: 150, marginBottom: 16 },
  tagsSection: { marginTop: 16 },
  tagsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4 },
  tagText: { fontSize: 12 },
  tagRemove: { fontSize: 12, fontWeight: '600' },
});
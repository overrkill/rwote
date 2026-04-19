'use client';

import { PinIcon, PlusIcon, TrashIcon } from '@/components/icons';
import { MarkdownView } from '@/components/markdown-view';
import { useTheme } from '@/components/theme-provider';
import { useToast } from '@/components/toast-context';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';
import { Note, getFilteredNotes, useNotesStore } from '@/stores/notes-store';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import Animated, {
  FadeIn,
  FadeOut,
  Layout,
} from 'react-native-reanimated';

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

export default function NotesScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');

  const {
    notes,
    activeTag,
    searchQuery,
    setNotes,
    updateNote,
    deleteNote,
    setSearchQuery,
    setActiveTag,
  } = useNotesStore();

  const filteredByTag = getFilteredNotes(notes || [], searchQuery || '', activeTag || 'all');

  const { user, accessToken, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  const loadNotes = useCallback(async () => {
    const currentToken = useAuthStore.getState().accessToken;
    if (!currentToken) return;
    try {
      const data = await supabase.fetchNotes(currentToken);
      const notesData = data?.notes || [];
      const seen = new Set<string>();

      const mappedNotes = notesData
        .filter((item: any) => item.local_id && !seen.has(item.local_id))
        .filter((item: any) => {
          if (seen.has(item.local_id)) return false;
          seen.add(item.local_id);
          return true;
        })
        .map((item: any) => ({
          id: item.local_id,
          cloud_id: item.id,
          title: item.text || 'Untitled',
          content: item.note || '',
          tags: item.tag ? item.tag.split(',').filter((t: string) => t.length > 0) : [],
          pinned: item.pinned || false,
          created_at: item.date || item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString(),
          synced: true,
        }));
      setNotes(mappedNotes);
    } catch {
      toast.error('Failed to load notes');
    }
  }, [setNotes]);

  useEffect(() => {
    if (user && accessToken) {
      loadNotes();
    }
  }, [user, accessToken]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotes();
    setRefreshing(false);
  }, [loadNotes]);

  const handleSearch = (text: string) => {
    setSearchText(text);
    setSearchQuery(text);
  };

  const handleDelete = async (note: Note) => {
    deleteNote(note.id);
    if (note.cloud_id && accessToken) {
      try {
        await supabase.deleteNote(accessToken, note.cloud_id);
      } catch {
        toast.error('Failed to delete note');
      }
    }
  };

  const handleTogglePin = async (note: Note) => {
    const newPinned = !note.pinned;
    updateNote(note.id, { pinned: newPinned });
    if (note.cloud_id && accessToken) {
      try {
        const result = await supabase.saveNote(accessToken, {
          local_id: note.id,
          text: note.title,
          note: note.content,
          tag: (note.tags || []).join(','),
          date: note.created_at,
          pinned: newPinned,
          updated_at: new Date().toISOString(),
        });
        if (result?.id) {
          updateNote(note.id, { cloud_id: result.id, synced: true });
        }
      } catch {
        toast.error('Failed to update note');
      }
    }
  };

  const cardBg = theme.colors.surface;
  const textPrimary = theme.colors.textPrimary;
  const textSecondary = theme.colors.textSecondary;
  const textTertiary = theme.colors.textTertiary;
  const accentBtn = theme.colors.accentBtn;

  const uniqueTags = notes.length > 0
    ? [...new Set(notes.flatMap((n) => n.tags || []))]
    : [];
  const filterTags = uniqueTags.length > 0 ? ['all', ...uniqueTags] : [];

  const renderNote = ({ item }: { item: Note }) => (
    <Animated.View
      entering={FadeIn.duration(100)}
      exiting={FadeOut.duration(100)}
      layout={Layout.springify().damping(50).stiffness(400)}
      style={{ marginBottom: 12 }}
    >
      <Pressable
        style={{
          ...styles.card,
          backgroundColor: cardBg,
          borderColor: item.pinned ? theme.colors.accent : theme.colors.border,
          borderWidth: item.pinned ? 1.5 : 1,
        }}
        onPress={() => router.push(`/tabs/(notes)/note/${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <Text style={{ ...styles.cardTitle, color: textPrimary }} numberOfLines={1}>
            {item.title || 'Untitled'}
          </Text>
        </View>
        <MarkdownView content={item.content || ''} style={styles.cardContent} />
        <View style={styles.cardFooter}>
          <View style={styles.tags}>
            {(item.tags || []).slice(0, 3).map((tag: string) => (
              <View key={tag} style={{ ...styles.tag, backgroundColor: getTagColor(tag) }}>
                <Text style={{ ...styles.tagText, color: getTagTextColor(tag) }}>#{tag}</Text>
              </View>
            ))}
          </View>
          <View style={styles.actions}>
            <Pressable style={styles.actionBtn} onPress={() => handleTogglePin(item)}>
              <PinIcon size={18} color={item.pinned ? theme.colors.accent : textTertiary} fill={item.pinned ? theme.colors.accent : 'none'} />
            </Pressable>
            <Pressable style={styles.actionBtn} onPress={() => handleDelete(item)}>
              <TrashIcon size={18} color={textTertiary} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View style={styles.header}>
        <TextInput
          style={{
            ...styles.searchInput,
            backgroundColor: cardBg,
            color: textPrimary,
            borderColor: theme.colors.border,
          }}
          placeholder="Search notes..."
          placeholderTextColor={textTertiary}
          value={searchText}
          onChangeText={handleSearch}
        />
      </View>

      {filterTags.length > 0 && (
        <View style={styles.filters}>
          <FlatList
            horizontal
            data={filterTags}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersList}
            renderItem={({ item }) => (
              <Pressable
                style={{
                  ...styles.filterChip,
                  backgroundColor: activeTag === item ? accentBtn : cardBg,
                }}
                onPress={() => setActiveTag(item)}
              >
                <Text
                  style={{
                    ...styles.filterText,
                    color: activeTag === item ? theme.colors.bg : textSecondary,
                  }}
                >
                  {item === 'all' ? 'All' : item.charAt(0).toUpperCase() + item.slice(1)}
                </Text>
              </Pressable>
            )}
          />
        </View>
      )}
      {filteredByTag.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ ...styles.emptyText, color: textSecondary }}>
            {notes.length === 0 ? 'No notes yet' : 'No notes match your search'}
          </Text>
          <Text style={{ ...styles.emptySubtext, color: textTertiary }}>
            Tap + to add your first note
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredByTag}
          keyExtractor={(item) => item.id}
          renderItem={renderNote}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}

      <Pressable
        style={{ ...styles.fab, backgroundColor: accentBtn }}
        onPress={() => router.push('/tabs/(notes)/new')}
      >
        <PlusIcon size={24} color={theme.colors.bg} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  searchInput: { borderWidth: 1, borderRadius: 10, padding: 10, fontSize: 15 },
  filters: { height: 36, paddingBottom: 6 },
  filtersList: { paddingHorizontal: 12, gap: 6 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  filterText: { fontSize: 13, fontWeight: '500', textAlignVertical: 'center' },
  list: { padding: 12, paddingBottom: 100 },
  card: { borderRadius: 10, padding: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: '600', flex: 1 },
  pinIcon: { fontSize: 14, marginLeft: 8 },
  cardContent: { fontSize: 13, lineHeight: 18, marginBottom: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tags: { flexDirection: 'row', gap: 4 },
  tag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagText: { fontSize: 11 },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: { padding: 4 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptySubtext: { fontSize: 14 },
  fab: { position: 'absolute', right: 16, bottom: 16, width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
});

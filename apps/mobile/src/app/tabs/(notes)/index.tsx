'use client';

import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useTheme } from '@/components/theme-provider';
import { useNotesStore, Note, getFilteredNotes } from '@/stores/notes-store';
import { useAuthStore } from '@/stores/auth-store';
import { supabase } from '@/lib/supabase';

const DEFAULT_TAGS = ['general', 'arrays', 'strings', 'trees', 'graphs', 'dp', 'sorting', 'searching'];

export default function NotesScreen() {
  const { theme } = useTheme();
  const router = useRouter();
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

  const { user, accessToken } = useAuthStore();

  const loadNotes = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await supabase.fetchNotes(accessToken);
      setNotes(data || []);
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  }, [accessToken, setNotes]);

  useEffect(() => {
    if (user && accessToken) {
      loadNotes();
    }
  }, [user, accessToken, loadNotes]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotes();
    setRefreshing(false);
  }, [loadNotes]);

  const handleSearch = (text: string) => {
    setSearchText(text);
    setSearchQuery(text);
  };

  const handleDelete = async (id: string) => {
    deleteNote(id);
    if (accessToken) {
      try {
        await supabase.deleteNote(accessToken, id);
      } catch (error) {
        console.error('Failed to delete note:', error);
      }
    }
  };

  const handleTogglePin = async (note: Note) => {
    updateNote(note.id, { pinned: !note.pinned });
    if (accessToken) {
      try {
        await supabase.updateNote(accessToken, note.id, { pinned: !note.pinned });
      } catch (error) {
        console.error('Failed to update note:', error);
      }
    }
  };

  const cardBg = theme.colors.surface;
  const textPrimary = theme.colors.textPrimary;
  const textSecondary = theme.colors.textSecondary;
  const textTertiary = theme.colors.textTertiary;
  const accentBtn = theme.colors.accentBtn;

  const renderNote = ({ item }: { item: Note }) => (
    <Pressable
      style={{ ...styles.card, backgroundColor: cardBg }}
      onPress={() => router.push(`/tabs/(notes)/note/${item.id}`)}
    >
      <View style={styles.cardHeader}>
        <Text style={{ ...styles.cardTitle, color: textPrimary }} numberOfLines={1}>
          {item.title}
        </Text>
        {item.pinned && (
          <Text style={{ ...styles.pinIcon, color: theme.colors.accent }}>📌</Text>
        )}
      </View>
      <Text style={{ ...styles.cardContent, color: textSecondary }} numberOfLines={2}>
        {item.content}
      </Text>
      <View style={styles.cardFooter}>
        <View style={styles.tags}>
          {item.tags.slice(0, 2).map((tag) => (
            <View key={tag} style={{ ...styles.tag, backgroundColor: theme.colors.bg }}>
              <Text style={{ ...styles.tagText, color: textTertiary }}>{tag}</Text>
            </View>
          ))}
        </View>
        <View style={styles.actions}>
          <Pressable style={styles.actionBtn} onPress={() => handleTogglePin(item)}>
            <Text style={{ color: textTertiary }}>{item.pinned ? '📌' : '📍'}</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={() => handleDelete(item.id)}>
            <Text style={{ color: textTertiary }}>🗑️</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
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

      <View style={styles.filters}>
        <FlatList
          horizontal
          data={['all', ...DEFAULT_TAGS]}
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
        <Text style={{ ...styles.fabText, color: theme.colors.bg }}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  searchInput: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 16 },
  filters: { height: 44, paddingBottom: 8 },
  filtersList: { paddingHorizontal: 16, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  filterText: { fontSize: 14, fontWeight: '500' },
  list: { padding: 16, paddingBottom: 100 },
  card: { borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600', flex: 1 },
  pinIcon: { fontSize: 14, marginLeft: 8 },
  cardContent: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tags: { flexDirection: 'row', gap: 8 },
  tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tagText: { fontSize: 12 },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: { padding: 4 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptySubtext: { fontSize: 14 },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  fabText: { fontSize: 28, fontWeight: '400' },
});

'use client';

import { useTheme } from '@/components/theme-provider';
import { useToast } from '@/components/toast-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';
import { Note, useNotesStore } from '@/stores/notes-store';
import { useRouter } from 'expo-router';

import Animated, {
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonList } from '@/components/ui/skeleton';
import { Pin, Trash2, Filter, Plus } from 'lucide-react-native';
import { MarkdownView } from '@/components/markdown-view';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';

function getTagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 85%)`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const NOTE_ITEM_HEIGHT = 120;

function NoteItem({
  item,
  index,
  theme,
  spacing,
  onTogglePin,
  onDelete,
  onPress,
}: {
  item: Note;
  index: number;
  theme: any;
  spacing: any;
  onTogglePin: (note: Note) => void;
  onDelete: (note: Note) => void;
  onPress: (id: string) => void;
}) {
  const delay = Math.min(index, 10) * 50;
  return (
    <Animated.View
      layout={Layout.springify().damping(50).stiffness(400)}
      style={{ marginBottom: spacing.md }}
    >
      <Pressable
        style={{
          backgroundColor: theme.colors.surface,
          borderColor: item.pinned ? theme.colors.accent : theme.colors.border,
          borderWidth: item.pinned ? 1.5 : 1,
          borderRadius: 12,
          padding: spacing.md,
        }}
        onPress={() => onPress(item.id)}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: theme.colors.textPrimary, flex: 1 }} numberOfLines={1}>
            {item.title || 'Untitled'}
          </Text>
          <Text style={{ fontSize: 11, color: theme.colors.textTertiary, marginLeft: spacing.sm }}>
            {formatDate(item.created_at)}
          </Text>
        </View>
        <View style={{ marginBottom: spacing.sm }}>
          <MarkdownView content={item.content || ''} style={{ fontSize: 13, lineHeight: 18 }} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            {(item.tags || []).slice(0, 3).map((tag: string) => (
              <View key={tag} style={{ backgroundColor: getTagColor(tag), paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                <Text style={{ fontSize: 11, color: getTagTextColor(tag) }}>#{tag}</Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Pressable style={{ padding: 4 }} onPress={() => onTogglePin(item)}>
              <Pin size={18} color={item.pinned ? theme.colors.accent : theme.colors.textTertiary} fill={item.pinned ? theme.colors.accent : undefined} />
            </Pressable>
            <Pressable style={{ padding: 4 }} onPress={() => onDelete(item)}>
              <Trash2 size={18} color={theme.colors.textTertiary} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

function getTagTextColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 25%)`;
}

function getFilteredByTag(notes: Note[], query: string, selectedTags: Set<string>): Note[] {
  let result = [...notes];
  
  if (query) {
    const q = query.toLowerCase();
    result = result.filter(n =>
      n.title?.toLowerCase().includes(q) ||
      n.content?.toLowerCase().includes(q) ||
      n.tags?.some(t => t.toLowerCase().includes(q))
    );
  }
  
  if (selectedTags.size > 0 && !selectedTags.has('all')) {
    result = result.filter(n => 
      n.tags?.some(t => selectedTags.has(t))
    );
  }
  
  return result;
}

export default function NotesScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set(['all']));
  const navLockRef = useRef(false);

  const fabScale = useSharedValue(1);

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  const handleFabPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/tabs/(notes)/new');
  };

  const handleFabPressIn = () => {
    fabScale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
  };

  const handleFabPressOut = () => {
    fabScale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const s = theme.spacing;

  const notes = useNotesStore(state => state.notes);
  const setNotes = useNotesStore(state => state.setNotes);
  const updateNote = useNotesStore(state => state.updateNote);
  const deleteNote = useNotesStore(state => state.deleteNote);
  const { user, accessToken, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  const loadNotes = useCallback(async () => {
    const currentToken = useAuthStore.getState().accessToken;
    if (!currentToken) {
      setIsLoading(false);
      return;
    }
    try {
      const data = await supabase.fetchNotes(currentToken);
      const notesData = data?.notes || [];
      const seen = new Set<string>();

      const mappedNotes = notesData
        .filter((item: any) => item.id && !seen.has(item.id))
        .filter((item: any) => {
          if (seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        })
        .map((item: any) => ({
          id: item.id,
          title: item.title || 'Untitled',
          content: item.content || '',
          tags: item.tags || [],
          pinned: item.pinned || false,
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString(),
          synced: true,
        }));
      setNotes(mappedNotes);
      setIsLoading(false);
    } catch {
      toast.error('Failed to load notes');
      setIsLoading(false);
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
  };

  const handleDelete = async (note: Note) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    deleteNote(note.id);
    if (accessToken) {
      try {
        await supabase.deleteNote(accessToken, note.id);
      } catch {
        toast.error('Failed to delete note');
      }
    }
  };

  const handleTogglePin = async (note: Note) => {
    const newPinned = !note.pinned;
    updateNote(note.id, { pinned: newPinned });
    if (accessToken) {
      try {
        await supabase.saveNote(accessToken, {
          id: note.id,
          title: note.title,
          content: note.content,
          tags: note.tags || [],
          pinned: newPinned,
          updated_at: new Date().toISOString(),
        });
        updateNote(note.id, { synced: true });
      } catch {
        toast.error('Failed to update note');
      }
    }
  };

  const handleNotePress = useCallback((id: string) => {
    if (navLockRef.current) return;
    navLockRef.current = true;
    router.push({
      pathname: '/tabs/(notes)/note/'+id,
      params: { animation: 'none' },
    });
    setTimeout(() => { navLockRef.current = false; }, 1000);
  }, [router]);

  const uniqueTags = notes.length > 0
    ? [...new Set(notes.flatMap((n) => n.tags || []))]
    : [];
  const filterTags = uniqueTags.length > 0 ? ['all', ...uniqueTags] : [];

  const filteredNotes = useMemo(
    () => getFilteredByTag(notes || [], searchText, selectedTags),
    [notes, searchText, selectedTags]
  );

  const updateTagsSelection = (tag: string) => {
    setSelectedTags(prev => {
      const newSelected = new Set(prev);
      if (tag === 'all') {
        newSelected.clear();
        newSelected.add('all');
      } else if (newSelected.has(tag)) {
        newSelected.delete(tag);
        if (newSelected.size === 0) newSelected.add('all');
      } else {
        newSelected.delete('all');
        newSelected.add(tag);
      }
      return newSelected;
    });
  };

  const getItemLayout = (_: any, index: number) => ({
    length: NOTE_ITEM_HEIGHT,
    offset: NOTE_ITEM_HEIGHT * index,
    index,
  });

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg, paddingTop: s.lg }}>
      <View style={{ paddingHorizontal: s.lg, paddingBottom: s.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm }}>
          <TextInput
            style={{
              flex: 1,
              backgroundColor: theme.colors.surface,
              color: theme.colors.textPrimary,
              borderColor: theme.colors.border,
              borderWidth: 1,
              borderRadius: 10,
              padding: s.md,
              fontSize: 15,
            }}
            placeholder="Search..."
            placeholderTextColor={theme.colors.textTertiary}
            value={searchText}
            onChangeText={handleSearch}
          />
          <Pressable
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              backgroundColor: showFilter ? theme.colors.accentBtn : theme.colors.surface,
              borderWidth: 1,
              borderColor: theme.colors.border,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => setShowFilter(!showFilter)}
          >
            <Filter size={18} color={showFilter ? theme.colors.bg : theme.colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      {showFilter && filterTags.length > 0 && (
        <View style={styles.filterChipsRow}>
          {filterTags.map((tag) => {
            const isSelected = selectedTags.has(tag);
            return (
              <Pressable
                key={tag}
                onPress={() => updateTagsSelection(tag)}
                style={{
                  backgroundColor: isSelected ? getTagColor(tag) : theme.colors.surfaceAlt,
                  paddingHorizontal: s.sm,
                  paddingVertical: s.xs,
                  borderRadius: 8,
                  marginRight: s.xs,
                  marginBottom: s.xs,
                  borderWidth: 1,
                  borderColor: isSelected ? getTagColor(tag) : theme.colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    color: isSelected ? getTagTextColor(tag) : theme.colors.textSecondary,
                  }}
                >
                  {tag === 'all' ? 'All' : `#${tag}`}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {isLoading ? (
        <SkeletonList count={3} />
      ) : filteredNotes.length === 0 ? (
        <EmptyState type="notes" />
      ) : (
        <FlatList
          data={filteredNotes}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <NoteItem
              item={item}
              index={index}
              theme={theme}
              spacing={s}
              onTogglePin={handleTogglePin}
              onDelete={handleDelete}
              onPress={handleNotePress}
            />
          )}
          contentContainerStyle={{ padding: s.lg, paddingBottom: 100 + s.xxl + insets.bottom }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.accent}
            />
          }
          getItemLayout={getItemLayout}
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={10}
          removeClippedSubviews={true}
        />
      )}

      <Animated.View style={fabAnimatedStyle}>
        <Pressable
          style={{
            position: 'absolute',
            right: s.lg,
            bottom: s.lg + insets.bottom,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: theme.colors.accentBtn,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 6,
          }}
          onPress={handleFabPress}
          onPressIn={handleFabPressIn}
          onPressOut={handleFabPressOut}
        >
          <Plus size={28} color={theme.colors.bg} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  filterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
});
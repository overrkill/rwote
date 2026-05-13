import { View, Text, Pressable, TextInput, FlatList, RefreshControl, Modal, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTheme } from '@/components/theme-provider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotesStore, getFilteredNotes } from '@/stores/notes-store';
import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';
import { useToast } from '@/components/toast-context';
import { supabase } from '@/lib/supabase';
import Animated, { Layout, FadeIn, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { FileText, Pin, Trash2, Plus, Settings as SettingsIcon, X } from 'lucide-react-native';
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function tagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 85%)`;
}

export function tagTextColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 25%)`;
}

function extractTags(text: string): string[] {
  const matches = text.match(/#(\w+)/g);
  return matches ? [...new Set(matches.map((t) => t.slice(1).toLowerCase()))] : [];
}

function cleanTags(text: string): string {
  return text.replace(/#\w+/g, '').trim();
}

function NewNoteModal({ theme, s, onClose, toast, onNoteCreated }: any) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const addNote = useNotesStore((s) => s.addNote);
  const updateNote = useNotesStore((s) => s.updateNote);
  const accessToken = useAuthStore((s) => s.accessToken);

  const handleSave = async () => {
    if (!title.trim()) return;
    const id = generateId();
    const now = new Date().toISOString();
    const extractedTags = extractTags(title + ' ' + content);

    const note = {
      id,
      title: cleanTags(title),
      content: cleanTags(content),
      tags: extractedTags,
      pinned: false,
      created_at: now,
      updated_at: now,
      synced: false,
    };

    addNote(note);

    if (accessToken) {
      try {
        await supabase.saveNote(accessToken, {
          id,
          title: note.title,
          content: note.content,
          tags: note.tags,
          pinned: false,
          updated_at: now,
        });
        updateNote(id, { synced: true });
      } catch { toast.error('Sync failed'); }
    }

    onNoteCreated(id);
  };

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }} />
      </Pressable>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <Animated.View
            entering={FadeIn.duration(200)}
            style={{
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: s.lg,
              paddingBottom: s.xxl + 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.2,
              shadowRadius: 12,
              elevation: 16,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: s.lg }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors.textPrimary }}>New Note</Text>
              <View style={{ flexDirection: 'row', gap: s.sm }}>
                <Pressable onPress={onClose} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.surfaceAlt, justifyContent: 'center', alignItems: 'center' }}>
                  <X size={20} color={theme.colors.textSecondary} />
                </Pressable>
              </View>
            </View>

            <TextInput
              style={{
                fontSize: 18, fontWeight: '600', color: theme.colors.textPrimary,
                paddingVertical: s.sm, marginBottom: s.md,
                borderBottomWidth: 1, borderBottomColor: theme.colors.border,
              }}
              placeholder="Note title... use #tag for tags"
              placeholderTextColor={theme.colors.textTertiary}
              value={title}
              onChangeText={setTitle}
              multiline
              autoFocus
            />

            <TextInput
              style={{
                fontSize: 15, lineHeight: 22, color: theme.colors.textPrimary,
                minHeight: 120, paddingVertical: s.sm,
              }}
              placeholder="Add context (optional)"
              placeholderTextColor={theme.colors.textTertiary}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />

            <Pressable
              onPress={handleSave}
              style={{
                backgroundColor: title.trim() ? theme.colors.accentBtn : theme.colors.surfaceAlt,
                borderRadius: 12,
                padding: s.md,
                alignItems: 'center',
                marginTop: s.lg,
                opacity: title.trim() ? 1 : 0.5,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: title.trim() ? theme.colors.bg : theme.colors.textTertiary }}>
                Save Note
              </Text>
            </Pressable>
          </Animated.View>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function NoteListItem({ item, index, theme, s, onSelect, onPin, onDelete }: any) {
  return (
    <Animated.View
      layout={Layout.springify().damping(30).stiffness(300)}
      entering={FadeIn.duration(200).delay(Math.min(index * 30, 200))}
      exiting={FadeOut.duration(150)}
    >
      <Pressable
        onPress={() => onSelect(item.id)}
        style={{
          backgroundColor: theme.colors.bg,
          borderWidth: 1,
          borderColor: item.pinned ? theme.colors.accent : 'transparent',
          borderRadius: 10,
          padding: s.md,
          marginBottom: s.xs,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, marginRight: s.sm }}>
            <Text
              style={{ fontSize: 14, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 4 }}
              numberOfLines={1}
            >
              {item.title || 'Untitled'}
            </Text>
            {item.content ? (
              <Text
                style={{ fontSize: 12, color: theme.colors.textTertiary, lineHeight: 16 }}
                numberOfLines={2}
              >
                {item.content}
              </Text>
            ) : null}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
              {(item.tags || []).slice(0, 2).map((tag: string) => (
                <View key={tag} style={{ backgroundColor: tagColor(tag), paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                  <Text style={{ fontSize: 10, color: tagTextColor(tag) }}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 2 }}>
            <Pressable onPress={() => onPin(item.id, item.pinned)} style={{ padding: 6 }}>
              <Pin size={14} color={item.pinned ? theme.colors.accent : theme.colors.textTertiary} />
            </Pressable>
            <Pressable onPress={() => onDelete(item.id)} style={{ padding: 6 }}>
              <Trash2 size={14} color={theme.colors.textTertiary} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function NoteListDrawer(props: any) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const s = theme.spacing;
  const navigation = props.navigation;

  const notes = useNotesStore((s) => s.notes);
  const setNotes = useNotesStore((s) => s.setNotes);
  const deleteNote = useNotesStore((s) => s.deleteNote);
  const updateNote = useNotesStore((s) => s.updateNote);
  const accessToken = useAuthStore((s) => s.accessToken);

  const [searchText, setSearchText] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(
    () => getFilteredNotes(notes, searchText, selectedTag),
    [notes, searchText, selectedTag]
  );

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach((n: any) => (n.tags || []).forEach((t: string) => tagSet.add(t)));
    return Array.from(tagSet);
  }, [notes]);

  const loadNotes = useCallback(async () => {
    const token = useAuthStore.getState().accessToken;
    if (!token) return;
    try {
      const data = await supabase.fetchNotes(token);
      const notesData = data?.notes || [];
      const mapped = notesData.map((item: any) => ({
        id: item.id,
        title: item.title || 'Untitled',
        content: item.content || '',
        tags: item.tags || [],
        pinned: item.pinned || false,
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at || new Date().toISOString(),
        synced: true,
      }));
      setNotes(mapped);
    } catch { toast.error('Failed to load notes'); }
  }, [setNotes]);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotes();
    setRefreshing(false);
  }, [loadNotes]);

  const handleDelete = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    deleteNote(id);
    if (accessToken) {
      try { await supabase.deleteNote(accessToken, id); } catch { toast.error('Delete failed'); }
    }
  };

  const handlePin = async (id: string, pinned: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateNote(id, { pinned: !pinned });
    if (accessToken) {
      const note = notes.find((n: any) => n.id === id);
      if (note) {
        try {
          await supabase.saveNote(accessToken, {
            id, title: note.title, content: note.content,
            tags: note.tags || [], pinned: !pinned,
            updated_at: new Date().toISOString(),
          });
        } catch { toast.error('Sync failed'); }
      }
    }
  };

  const [showNewNote, setShowNewNote] = useState(false);

  const handleSelectNote = (id: string) => {
    useUIStore.getState().setSelectedNoteId(id);
    (navigation as any).closeDrawer();
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: s.lg, paddingVertical: s.md,
        borderBottomWidth: 1, borderBottomColor: theme.colors.border,
      }}>
        <View>
          <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors.textPrimary }}>Notes</Text>
          <Text style={{ fontSize: 13, color: theme.colors.textTertiary, marginTop: 2 }}>
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: s.xs }}>
          <Pressable
            onPress={() => (navigation as any).navigate('settings')}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.surfaceAlt, justifyContent: 'center', alignItems: 'center' }}
          >
            <SettingsIcon size={20} color={theme.colors.textPrimary} />
          </Pressable>
          <Pressable
            onPress={() => setShowNewNote(true)}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.accentBtn, justifyContent: 'center', alignItems: 'center' }}
          >
            <Plus size={20} color={theme.colors.bg} />
          </Pressable>
        </View>
      </View>

      <View style={{ paddingHorizontal: s.lg, paddingTop: s.md, paddingBottom: s.sm }}>
        <TextInput
          style={{
            backgroundColor: theme.colors.bg,
            color: theme.colors.textPrimary,
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: 10,
            padding: s.md,
            fontSize: 14,
          }}
          placeholder="Search..."
          placeholderTextColor={theme.colors.textTertiary}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {allTags.length > 0 && (
        <View style={{ paddingHorizontal: s.lg, paddingBottom: s.sm }}>
          <FlatList
            horizontal
            data={['all', ...allTags]}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => {
              const active = selectedTag === item;
              return (
                <Pressable
                  onPress={() => setSelectedTag(item)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                    marginRight: s.xs,
                    backgroundColor: active ? theme.colors.accentBtn : theme.colors.surfaceAlt,
                  }}
                >
                  <Text style={{
                    fontSize: 13,
                    fontWeight: active ? '600' : '400',
                    color: active ? theme.colors.bg : theme.colors.textSecondary,
                  }}>
                    {item === 'all' ? 'All' : `#${item}`}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>
      )}

      {filtered.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: s.xl }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: theme.colors.surfaceAlt, justifyContent: 'center', alignItems: 'center', marginBottom: s.lg }}>
            <FileText size={36} color={theme.colors.textTertiary} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors.textSecondary, marginBottom: s.xs }}>
            No Notes Yet
          </Text>
          <Text style={{ fontSize: 14, color: theme.colors.textTertiary, textAlign: 'center' }}>
            {searchText ? 'No matching notes' : selectedTag !== 'all' ? 'No notes with this tag' : 'Tap + to create your first note'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={{ padding: s.sm }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />
          }
          renderItem={({ item, index }) => (
            <NoteListItem
              item={item}
              index={index}
              theme={theme}
              s={s}
              onSelect={handleSelectNote}
              onPin={handlePin}
              onDelete={handleDelete}
            />
          )}
        />
      )}

      {showNewNote && (
        <NewNoteModal
          theme={theme}
          s={s}
          onClose={() => setShowNewNote(false)}
          toast={toast}
          onNoteCreated={(id: string) => {
            setShowNewNote(false);
            useUIStore.getState().setSelectedNoteId(id);
            (navigation as any).closeDrawer();
          }}
        />
      )}
    </View>
  );
}

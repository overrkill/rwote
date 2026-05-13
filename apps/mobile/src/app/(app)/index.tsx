import { useTheme } from '@/components/theme-provider';
import { useUIStore } from '@/stores/ui-store';
import { useNotesStore } from '@/stores/notes-store';
import { useAuthStore } from '@/stores/auth-store';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/toast-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useNavigation } from 'expo-router';
import { MarkdownView } from '@/components/markdown-view';
import { generateId, extractTags, cleanTags, tagColor, tagTextColor } from '@/components/note-list-drawer';
import {
  FileText, Pin, Trash2, Copy, Menu, Pencil, Plus,
} from 'lucide-react-native';

export default function HomeScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const navigation = useNavigation();
  const s = theme.spacing;
  const [newNoteVersion, setNewNoteVersion] = useState(0);
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);
  const addNote = useNotesStore((s) => s.addNote);

  const selectedNoteId = useUIStore((s) => s.selectedNoteId);
  const notes = useNotesStore((s) => s.notes);
  const selectedNote = useMemo(
    () => notes.find((n: any) => n.id === selectedNoteId),
    [notes, selectedNoteId]
  );

  const updateNote = useNotesStore((s) => s.updateNote);
  const deleteNote = useNotesStore((s) => s.deleteNote);
  const accessToken = useAuthStore((s) => s.accessToken);

  const handlePin = async () => {
    if (!selectedNote) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateNote(selectedNote.id, { pinned: !selectedNote.pinned });
    if (accessToken) {
      try {
        await supabase.saveNote(accessToken, {
          id: selectedNote.id,
          title: selectedNote.title,
          content: selectedNote.content,
          tags: selectedNote.tags || [],
          pinned: !selectedNote.pinned,
          updated_at: new Date().toISOString(),
        });
      } catch { toast.error('Sync failed'); }
    }
  };

  const handleCopy = () => {
    if (!selectedNote) return;
    const text = selectedNote.content
      ? `${selectedNote.title}\n\n${selectedNote.content}`
      : selectedNote.title;
    toast.success('Copied');
  };

  const handleDelete = async () => {
    if (!selectedNote) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    deleteNote(selectedNote.id);
    useUIStore.getState().setSelectedNoteId(null);
    if (accessToken) {
      try {
        await supabase.deleteNote(accessToken, selectedNote.id);
      } catch { toast.error('Delete sync failed'); }
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View
        style={[
          styles.mainHeader,
          {
            paddingTop: insets.top + s.sm,
            paddingHorizontal: s.lg,
            backgroundColor: theme.colors.bg,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable
            onPress={() => (navigation as any).openDrawer()}
            style={[styles.iconBtn, { backgroundColor: theme.colors.surfaceAlt }]}
          >
            <Menu size={20} color={theme.colors.textPrimary} />
          </Pressable>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm }}>
            {selectedNote && (
              <>
                <Pressable onPress={handlePin} style={styles.iconBtn}>
                  <Pin
                    size={18}
                    color={selectedNote.pinned ? theme.colors.accent : theme.colors.textTertiary}
                    fill={selectedNote.pinned ? theme.colors.accent : 'none'}
                  />
                </Pressable>
                <Pressable onPress={handleCopy} style={styles.iconBtn}>
                  <Copy size={18} color={theme.colors.textTertiary} />
                </Pressable>
                <Pressable onPress={handleDelete} style={styles.iconBtn}>
                  <Trash2 size={18} color={theme.colors.textTertiary} />
                </Pressable>
              </>
            )}
          </View>
        </View>
      </View>

      {selectedNote ? (
        <NoteDetailView key={`${selectedNote.id}-${newNoteVersion}`} note={selectedNote} theme={theme} s={s} toast={toast} autoEdit={selectedNote.id === lastCreatedId} />
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: s.xl }}>
          <View
            style={{
              width: 80, height: 80, borderRadius: 40,
              backgroundColor: theme.colors.surfaceAlt,
              justifyContent: 'center', alignItems: 'center',
              marginBottom: s.lg,
            }}
          >
            <FileText size={36} color={theme.colors.textTertiary} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors.textSecondary, marginBottom: s.xs }}>
            No Note Selected
          </Text>
          <Text style={{ fontSize: 14, color: theme.colors.textTertiary, textAlign: 'center' }}>
            Open the sidebar to browse your notes
          </Text>
        </View>
      )}

      <Pressable
        onPress={() => {
          const id = generateId();
          const now = new Date().toISOString();
          addNote({
            id, title: '', content: '', tags: [],
            pinned: false, created_at: now, updated_at: now, synced: false,
          });
          useUIStore.getState().setSelectedNoteId(id);
          setLastCreatedId(id);
          setNewNoteVersion(v => v + 1);
        }}
        style={{
          position: 'absolute',
          bottom: insets.bottom + 20,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: theme.colors.accentBtn,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Plus size={24} color={theme.colors.bg} />
      </Pressable>
    </View>
  );
}

function NoteDetailView({ note, theme, s, toast, autoEdit }: any) {
  const updateNote = useNotesStore((s) => s.updateNote);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [editing, setEditing] = useState(autoEdit || false);
  const [editTitle, setEditTitle] = useState(note.title);
  const [editContent, setEditContent] = useState(note.content || '');

  const dateStr = note.created_at
    ? new Date(note.created_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : '';

  const md = useMemo(() => {
    let text = `# ${note.title}`;
    if (note.content) text += `\n\n${note.content}`;
    if (dateStr) text += `\n\n---\n\n<span class="meta">${dateStr}</span>`;
    return text;
  }, [note.title, note.content, dateStr]);

  const handleSaveEdit = async () => {
    const updates = {
      title: editTitle,
      content: editContent,
      updated_at: new Date().toISOString(),
    };
    updateNote(note.id, updates);
    setEditing(false);
    if (accessToken) {
      try {
        await supabase.saveNote(accessToken, {
          id: note.id,
          title: editTitle,
          content: editContent,
          tags: note.tags || [],
          pinned: note.pinned,
          updated_at: new Date().toISOString(),
        });
      } catch { toast.error('Sync failed'); }
    }
  };

  return (
    <View style={{ flex: 1, paddingHorizontal: s.lg, paddingTop: s.md, backgroundColor: theme.colors.bg }}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: s.sm }}>
        {editing ? (
          <View style={{ flexDirection: 'row', gap: s.sm }}>
            <Pressable
              onPress={() => { setEditing(false); setEditTitle(note.title); setEditContent(note.content || ''); }}
              style={[styles.smallBtn, { backgroundColor: theme.colors.surfaceAlt }]}
            >
              <Text style={{ fontSize: 13, color: theme.colors.textSecondary }}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSaveEdit}
              style={[styles.smallBtn, { backgroundColor: theme.colors.accentBtn }]}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.bg }}>Save</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => setEditing(true)} style={[styles.smallBtn, { backgroundColor: theme.colors.surfaceAlt }]}>
            <Pencil size={14} color={theme.colors.textSecondary} />
            <Text style={{ fontSize: 13, color: theme.colors.textSecondary, marginLeft: 4 }}>Edit</Text>
          </Pressable>
        )}
      </View>

      {note.tags && note.tags.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: s.md }}>
          {note.tags.map((tag: string) => (
            <View key={tag} style={[styles.tagBadge, { backgroundColor: tagColor(tag) }]}>
              <Text style={[styles.tagBadgeText, { color: tagTextColor(tag) }]}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {editing ? (
        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
          <TextInput
            style={{
              fontSize: 22, fontWeight: '700', color: theme.colors.textPrimary,
              marginBottom: s.md, paddingVertical: s.sm,
              borderBottomWidth: 1, borderBottomColor: theme.colors.border,
            }}
            value={editTitle}
            onChangeText={setEditTitle}
            multiline
            autoFocus
            placeholder="Note title..."
            placeholderTextColor={theme.colors.textTertiary}
          />
          <TextInput
            style={{
              fontSize: 15, lineHeight: 22, color: theme.colors.textPrimary,
              minHeight: 200, paddingVertical: s.sm,
            }}
            value={editContent}
            onChangeText={setEditContent}
            multiline
            textAlignVertical="top"
            placeholder="Add context..."
            placeholderTextColor={theme.colors.textTertiary}
          />
        </ScrollView>
      ) : (
        <MarkdownView content={md} style={{ flex: 1 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainHeader: {
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
});

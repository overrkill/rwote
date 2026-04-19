'use client';

import { useTheme } from '@/components/theme-provider';
import { useToast } from '@/components/toast-context';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';
import { useNotesStore } from '@/stores/notes-store';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { Check, Square } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface TodoItem {
  id: string;
  noteId: string;
  text: string;
  completed: boolean;
  noteCreatedAt: string;
}

export default function TodosScreen() {
  const { theme } = useTheme();
  const toast = useToast();
  const [refreshing, setRefreshing] = useState(false);

  const { notes, setNotes, updateNote } = useNotesStore();
  const { accessToken } = useAuthStore();

  const todos = useMemo(() => {
    const result: TodoItem[] = [];
    
    for (const note of notes || []) {
      const content = note.content || '';
      const lines = content.split('\n');
      
      for (const line of lines) {
        const match = line.match(/^- \[([ x])\] (.+)$/);
        if (match) {
          result.push({
            id: `${note.id}-${result.length}`,
            noteId: note.id,
            text: match[2].trim(),
            completed: match[1] === 'x',
            noteCreatedAt: note.created_at,
          });
        }
      }
    }
    
    result.sort((a, b) => 
      new Date(b.noteCreatedAt).getTime() - new Date(a.noteCreatedAt).getTime()
    );
    
    return result;
  }, [notes]);

  const pendingTodos = todos.filter((t) => !t.completed);
  const completedTodos = todos.filter((t) => t.completed);
  const sortedTodos = [...pendingTodos, ...completedTodos];

  const loadNotes = useCallback(async () => {
    const currentToken = useAuthStore.getState().accessToken;
    if (!currentToken) return;
    try {
      const data = await supabase.fetchNotes(currentToken);
      const notesData = data?.notes || [];
      const mappedNotes = notesData.map((item: any) => ({
        id: item.local_id || item.id,
        title: item.text || 'Untitled',
        content: item.note || '',
        tags: item.tag ? item.tag.split(',').filter((t: string) => t.length > 0) : [],
        pinned: item.pinned || false,
        created_at: item.date || item.created_at || new Date().toISOString(),
        updated_at: item.updated_at || new Date().toISOString(),
      }));
      setNotes(mappedNotes);
    } catch {
      toast.error('Failed to load notes');
    }
  }, [setNotes, toast]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotes();
    setRefreshing(false);
  }, [loadNotes]);

  const toggleTodo = async (todo: TodoItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const note = notes.find((n) => n.id === todo.noteId);
    if (!note) return;

    const lines = note.content.split('\n');
    const updatedLines = lines.map((line) => {
      const match = line.match(/^- \[([ x])\] (.+)$/);
      if (match && match[2].trim() === todo.text) {
        return todo.completed ? `- [ ] ${todo.text}` : `- [x] ${todo.text}`;
      }
      return line;
    });

    const updatedContent = updatedLines.join('\n');
    updateNote(todo.noteId, { content: updatedContent });

    if (accessToken) {
      try {
        await supabase.saveNote(accessToken, {
          id: note.id,
          text: note.title,
          note: updatedContent,
          tag: (note.tags || []).join(','),
          date: note.created_at,
          pinned: note.pinned,
          updated_at: new Date().toISOString(),
        });
      } catch {
        toast.error('Failed to update todo');
      }
    }
  };

  const TodoCheckbox = ({ completed }: { completed: boolean }) => (
    completed ? (
      <Check size={22} color="#22c55e" />
    ) : (
      <Square size={22} color={theme.colors.textTertiary} />
    )
  );

  const renderTodo = ({ item }: { item: TodoItem }) => (
    <Animated.View
      entering={FadeIn.duration(100)}
      exiting={FadeOut.duration(100)}
      layout={Layout.springify().damping(50).stiffness(400)}
      style={{ marginBottom: s.sm }}
    >
      <Pressable
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: s.md,
          borderRadius: 12,
          borderWidth: 1,
          backgroundColor: theme.colors.surface,
          borderColor: item.completed ? theme.colors.textTertiary : theme.colors.border,
          gap: s.md,
        }}
        onPress={() => toggleTodo(item)}
      >
        <TodoCheckbox completed={item.completed} />
        <Text
          style={{
            flex: 1,
            fontSize: 16,
            color: item.completed ? theme.colors.textTertiary : theme.colors.textPrimary,
            textDecorationLine: item.completed ? 'line-through' : 'none',
          }}
        >
          {item.text}
        </Text>
      </Pressable>
    </Animated.View>
  );

  const s = theme.spacing;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg, paddingTop: s.lg }}>
      <View style={{ paddingHorizontal: s.lg, paddingBottom: s.sm }}>
        <Text style={{ fontSize: 14, color: theme.colors.textSecondary }}>
          {pendingTodos.length} pending · {completedTodos.length} completed
        </Text>
      </View>

      {sortedTodos.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: s.sm, color: theme.colors.textSecondary }}>
            No todos found
          </Text>
          <Text style={{ fontSize: 14, color: theme.colors.textTertiary }}>
            Add - [ ] task in your notes
          </Text>
        </View>
      ) : (
        <FlatList
          data={sortedTodos}
          keyExtractor={(item) => item.id}
          renderItem={renderTodo}
          contentContainerStyle={{ padding: s.lg, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
  );
}
import { create } from 'zustand';

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

interface NotesState {
  notes: Note[];
  searchQuery: string;
  activeTag: string;
  deletedNote: Note | null;
  setNotes: (notes: Note[]) => void;
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  undoDelete: () => void;
  setSearchQuery: (query: string) => void;
  setActiveTag: (tag: string) => void;
  filteredNotes: () => Note[];
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  searchQuery: '',
  activeTag: 'all',
  deletedNote: null,

  setNotes: (notes) => set({ notes }),

  addNote: (note) => set((state) => ({ notes: [note, ...state.notes] })),

  updateNote: (id, updates) =>
    set((state) => ({
      notes: state.notes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    })),

  deleteNote: (id) =>
    set((state) => {
      const note = state.notes.find((n) => n.id === id);
      return {
        notes: state.notes.filter((n) => n.id !== id),
        deletedNote: note || null,
      };
    }),

  undoDelete: () =>
    set((state) => {
      if (state.deletedNote) {
        return {
          notes: [state.deletedNote, ...state.notes],
          deletedNote: null,
        };
      }
      return state;
    }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setActiveTag: (tag) => set({ activeTag: tag }),

  filteredNotes: () => {
    const { notes, searchQuery, activeTag } = get();
    let filtered = [...notes];

    if (activeTag !== 'all') {
      filtered = filtered.filter((n) => n.tags.includes(activeTag));
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.content.toLowerCase().includes(query)
      );
    }

    const pinned = filtered.filter((n) => n.pinned);
    const unpinned = filtered.filter((n) => !n.pinned);

    return [...pinned, ...unpinned];
  },
}));

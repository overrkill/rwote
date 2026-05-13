import { create } from 'zustand';

export interface Note {
  id: string;
  cloud_id?: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  created_at: string;
  updated_at: string;
  synced: boolean;
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
}

export const useNotesStore = create<NotesState>((set) => ({
  notes: [],
  searchQuery: '',
  activeTag: 'all',
  deletedNote: null,

  setNotes: (notes) => set({ notes: Array.isArray(notes) ? notes : [] }),

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
}));

export function getFilteredNotes(notes: Note[], searchQuery: string, activeTag: string): Note[] {
  if (!Array.isArray(notes)) return [];

  const query = searchQuery?.trim().toLowerCase();
  const filterByTag = activeTag && activeTag !== 'all';
  const filterBySearch = !!query;

  const pinned: Note[] = [];
  const unpinned: Note[] = [];

  for (let i = 0; i < notes.length; i++) {
    const n = notes[i];
    if (filterByTag && !n.tags?.includes(activeTag)) continue;
    if (filterBySearch) {
      const titleMatch = n.title && n.title.toLowerCase().includes(query);
      const contentMatch = !titleMatch && n.content && n.content.toLowerCase().includes(query);
      if (!titleMatch && !contentMatch) continue;
    }
    (n.pinned ? pinned : unpinned).push(n);
  }

  pinned.push(...unpinned);
  return pinned;
}

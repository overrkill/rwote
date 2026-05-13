import { create } from 'zustand';

interface UIState {
  selectedNoteId: string | null;
  editMode: boolean;
  setSelectedNoteId: (id: string | null) => void;
  setEditMode: (mode: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedNoteId: null,
  editMode: false,
  setSelectedNoteId: (id) => set({ selectedNoteId: id }),
  setEditMode: (mode) => set({ editMode: mode }),
}));

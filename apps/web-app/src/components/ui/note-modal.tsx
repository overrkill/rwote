'use client'

import type { Note } from '@/lib/types'
import { NoteForm } from '@/components/notes'
import { X } from 'lucide-react'

interface NoteModalProps {
  note: Note | null
  onSave: (title: string, content: string, tags: string[]) => void
  onClose: () => void
}

export default function NoteModal({ note, onSave, onClose }: NoteModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg mx-4 rounded-xl shadow-xl overflow-hidden max-h-[80vh] flex flex-col"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
            {note ? 'Edit Note' : 'New Note'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-black/10"
            style={{ color: 'var(--text-secondary)' }}
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto">
          <NoteForm
            note={note || undefined}
            onSave={(title, content, tags) => {
              onSave(title, content, tags)
              onClose()
            }}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  )
}
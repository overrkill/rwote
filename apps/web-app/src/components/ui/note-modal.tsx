'use client'

import type { Note } from '@/lib/types'
import { NoteForm } from '@/components/notes'
import Dialog from './dialog'

interface NoteModalProps {
  note: Note | null
  onSave: (title: string, content: string, tags: string[]) => void
  onClose: () => void
}

export default function NoteModal({ note, onSave, onClose }: NoteModalProps) {
  return (
    <Dialog open={!!note} onOpenChange={(open) => { if (!open) onClose() }} title={note ? 'Edit Note' : 'New Note'}>
      <div className="p-4 overflow-y-auto max-h-[60vh]">
        <NoteForm
          note={note || undefined}
          onSave={(title, content, tags) => {
            onSave(title, content, tags)
            onClose()
          }}
          onCancel={onClose}
        />
      </div>
    </Dialog>
  )
}

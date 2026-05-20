'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { Editor } from '@tiptap/react'
import type { Note } from '@/lib/types'
import { Pin, Copy, Trash2, X, Check } from 'lucide-react'
import MarkdownEditor from './markdown-editor'
import NoteAnalyzer from './note-analyzer'
import { loadAnalyzeConfig } from '@/lib/ai-config'
import AlertDialog, { AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog'

interface NoteDetailProps {
  note: Note
  onUpdate: (updated: Note) => void
  onDelete: (id: string) => void
  onTogglePin: (id: string) => void
}

function getTagColor(tag: string): string {
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 70%, 85%)`
}

function getTagTextColor(tag: string): string {
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 70%, 25%)`
}

export default function NoteDetail({ note, onUpdate, onDelete, onTogglePin }: NoteDetailProps) {
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content || '')
  const [tags, setTags] = useState<string[]>(note.tags || [])
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [analyzeView, setAnalyzeView] = useState<'minimized' | 'expanded'>('minimized')
  const [autoAnalyzeTrigger, setAutoAnalyzeTrigger] = useState(0)
  const editorRef = useRef<Editor | null>(null)

  const titleRef = useRef(title)
  const contentRef = useRef(content)
  const tagsRef = useRef(tags)

  useEffect(() => { titleRef.current = title }, [title])
  useEffect(() => { contentRef.current = content }, [content])
  useEffect(() => { tagsRef.current = tags }, [tags])

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const extractTags = (input: string): string[] => {
    const matches = input.match(/#(\w+)/g)
    return matches ? matches.map((t) => t.slice(1).toLowerCase()) : []
  }

  const doSave = useCallback(() => {
    const currentTags = extractTags(titleRef.current)
    const allTags = [...new Set([...tagsRef.current.filter(t => !currentTags.includes(t)), ...currentTags])]
    
    onUpdate({
      ...note,
      title: titleRef.current.replace(/#\w+/g, '').trim() || 'Untitled',
      content: contentRef.current,
      tags: allTags,
      updated_at: new Date().toISOString(),
    })
    
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)

    const cfg = loadAnalyzeConfig()
    if (cfg.autoAnalyze && (titleRef.current.trim() || contentRef.current.trim())) {
      setAutoAnalyzeTrigger(c => c + 1)
    }
  }, [note, onUpdate])

  const scheduleSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => {
      doSave()
      saveTimeoutRef.current = null
    }, 800)
  }, [doSave])

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }
    setTitle(note.title)
    setContent(note.content || '')
    setTags(note.tags || [])
  }, [note])

  const handleCopy = () => {
    const text = content ? `${title}\n\n${content}` : title
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDelete = () => {
    setDeleteOpen(true)
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
    doSave()
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault()
      editorRef.current?.commands.focus()
    }
  }

  const handleEditorCreated = (editor: Editor) => {
    editorRef.current = editor
  }

  const handleEditorUpdate = (md: string) => {
    contentRef.current = md
    setContent(md)
    scheduleSave()
  }

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="p-3 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {new Date(note.created_at).toLocaleDateString()}
            {note.updated_at !== note.created_at && (
              <span className="ml-1">· edited {new Date(note.updated_at).toLocaleDateString()}</span>
            )}
          </span>
          {saved && (
            <span className="text-xs flex items-center gap-1" style={{ color: '#22c55e' }}>
              <Check size={12} />
              Saved
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onTogglePin(note.id)}
            className="p-2 rounded transition-colors"
            style={{ color: note.pinned ? 'var(--accent)' : 'var(--text-secondary)' }}
            title={note.pinned ? 'Unpin' : 'Pin'}
          >
            <Pin size={16} fill={note.pinned ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={handleCopy}
            className="p-2 rounded transition-colors"
            style={{ color: copied ? '#22c55e' : 'var(--text-secondary)' }}
            title="Copy"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
          <button
            onClick={handleDelete}
            className="p-2 rounded transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto">
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                scheduleSave()
              }}
              onKeyDown={handleTitleKeyDown}
              placeholder="Note title... use #tag for tags"
              className="w-full text-2xl font-bold outline-none mb-4 py-2"
              style={{ backgroundColor: 'transparent', color: 'var(--text-primary)', fontFamily: 'inherit' }}
            />

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-[8px] font-semibold px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: getTagColor(tag),
                      opacity:0.4,
                      color: getTagTextColor(tag),
                    }}
                  >
                    #{tag}
                    <button onClick={() => removeTag(tag)} className="hover:opacity-70 ml-0.5">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <MarkdownEditor
              content={content}
              onChange={handleEditorUpdate}
              onCreated={handleEditorCreated}
              onSave={doSave}
              onInput={() => scheduleSave()}
              placeholder="Start typing..."
            />
          </div>
        </div>

        <div
          className="shrink-0 overflow-y-auto"
          style={{
            width: analyzeView === 'minimized' ? 48 : 320,
            borderLeft: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
          }}
        >
            <NoteAnalyzer
              noteId={note.id}
              text={title + '\n\n' + content}
              view={analyzeView}
              autoAnalyzeTrigger={autoAnalyzeTrigger}
              onToggleView={() => setAnalyzeView(analyzeView === 'minimized' ? 'expanded' : 'minimized')}
            />
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete note?" description="This cannot be undone.">
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={() => onDelete(note.id)} variant="destructive">Delete</AlertDialogAction>
      </AlertDialog>
    </div>
  )
}

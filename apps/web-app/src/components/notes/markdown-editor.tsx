'use client'

import { useEditor, EditorContent, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { createLowlight, common } from 'lowlight'
import { Markdown } from '@tiptap/markdown'
import { useEffect, useCallback, useRef } from 'react'

const lowlight = createLowlight(common)

interface MarkdownEditorProps {
  content: string
  onChange: (content: string) => void
  onCreated?: (editor: Editor) => void
  onSave?: () => void
  onInput?: () => void
  placeholder?: string
}

function looksLikeHtml(str: string): boolean {
  return /^\s*</.test(str)
}

export default function MarkdownEditor({ content, onChange, onCreated, onSave, onInput, placeholder = 'Start typing...' }: MarkdownEditorProps) {
  const isExternalUpdate = useRef(false)
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault()
      onSave?.()
    }
  }, [onSave])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        code: {
          HTMLAttributes: {
            class: 'code-inline',
          },
        },
        codeBlock: false,
        link: {
          openOnClick: true,
          HTMLAttributes: {
            class: 'editor-link',
          },
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: null,
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      Markdown.configure({
        indentation: { style: 'space', size: 2 },
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      if (!isExternalUpdate.current) {
        onChange(editor.getMarkdown())
        onInput?.()
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm focus:outline-none min-h-[400px] py-2 px-1',
      },
      handleKeyDown: (_view, event) => {
        if (event.key === 'Tab') {
          event.preventDefault()
          const sel = window.getSelection()
          if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0)
            const node = range.commonAncestorContainer as Node
            const el = node.nodeType === 1 ? node as Element : node.parentElement
            if (el?.closest('.ProseMirror')) {
              document.execCommand('insertText', false, '\t')
              return true
            }
          }
        }
        return false
      },
    },
  })

  useEffect(() => {
    if (editor) {
      onCreated?.(editor)
    }
  }, [editor, onCreated])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    if (editor) {
      const currentMd = editor.getMarkdown()
      if (content !== currentMd) {
        isExternalUpdate.current = true
        if (content && !looksLikeHtml(content)) {
          editor.commands.setContent(content, { contentType: 'markdown' as any })
        } else {
          editor.commands.setContent(content)
        }
        isExternalUpdate.current = false
      }
    }
  }, [editor, content])

  return (
    <EditorContent
      editor={editor}
      className="w-full [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[400px] [&_.ProseMirror]:py-2 [&_.ProseMirror_p]:my-2 [&_.ProseMirror_h1]:text-2xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_strong]:font-bold [&_.ProseMirror_em]:italic [&_.ProseMirror_code]:bg-black/10 [&_.ProseMirror_code]:px-1 [&_.ProseMirror_code]:py-0.5 [&_.ProseMirror_code]:rounded [&_.ProseMirror_pre]:bg-[var(--surface-alt)] [&_.ProseMirror_pre]:rounded [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5 [&_.ProseMirror_li]:my-1 [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_blockquote]:opacity-80 [&_.ProseMirror_hr]:border-t [&_.ProseMirror_hr]:my-4 [&_.ProseMirror_is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_is-editor-empty:first-child::before]:float-left [&_.ProseMirror_is-editor-empty:first-child::before]:text-[var(--text-tertiary)] [&_.ProseMirror_is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_is-editor-empty:first-child::before]:h-0"
      style={{ color: 'var(--text-primary)' }}
    />
  )
}

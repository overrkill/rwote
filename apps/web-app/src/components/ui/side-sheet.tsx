'use client'

import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ReactNode } from 'react'

interface SideSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  width?: string
}

export default function SideSheet({ open, onClose, title, children, width = 'w-80' }: SideSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/20"
            style={{ backdropFilter: 'blur(2px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />

          <motion.div
            className={`fixed top-0 right-0 h-full z-50 flex flex-col shadow-[-8px_0_30px_rgba(0,0,0,0.15)] ${width}`}
            style={{ backgroundColor: 'var(--surface)' }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {title && (
              <div className="p-5 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
                <h2 className="text-base font-medium" style={{ color: 'var(--text-primary)' }}>{title}</h2>
                <button
                  onClick={onClose}
                  className="p-1 rounded-md transition-colors hover:bg-black/10"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  <X size={18} strokeWidth={2} />
                </button>
              </div>
            )}

            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

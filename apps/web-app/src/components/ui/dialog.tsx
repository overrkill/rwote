'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ReactNode } from 'react'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  children: ReactNode
}

export default function Dialog({ open, onOpenChange, title, description, children }: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-40 bg-black/40"
                style={{ backdropFilter: 'blur(2px)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            </DialogPrimitive.Overlay>

            <DialogPrimitive.Content asChild>
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                <div
                  className="relative w-full max-w-md rounded shadow-lg overflow-hidden"
                  style={{ backgroundColor: 'var(--surface)' }}
                >
                  {(title || description) && (
                    <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
                      <div>
                        <DialogPrimitive.Title className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {title}
                        </DialogPrimitive.Title>
                        {description && (
                          <DialogPrimitive.Description className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                            {description}
                          </DialogPrimitive.Description>
                        )}
                      </div>
                      <DialogPrimitive.Close className="p-1 rounded-md transition-colors hover:bg-black/10" style={{ color: 'var(--text-tertiary)' }}>
                        <X size={18} strokeWidth={2} />
                      </DialogPrimitive.Close>
                    </div>
                  )}

                  {children}
                </div>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  )
}

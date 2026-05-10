'use client'

import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import type { ReactNode } from 'react'

interface AlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
}

interface AlertDialogActionProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'default' | 'destructive'
}

export function AlertDialogAction({ children, onClick, variant = 'default' }: AlertDialogActionProps) {
  return (
    <AlertDialogPrimitive.Action asChild>
      <button
        onClick={onClick}
        className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity cursor-pointer"
        style={{
          backgroundColor: variant === 'destructive' ? '#ef4444' : 'var(--accent-btn)',
          color: variant === 'destructive' ? 'white' : 'var(--bg)',
        }}
      >
        {children}
      </button>
    </AlertDialogPrimitive.Action>
  )
}

export function AlertDialogCancel({ children }: { children: ReactNode }) {
  return (
    <AlertDialogPrimitive.Cancel asChild>
      <button
        className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors"
        style={{ border: '1px solid var(--border)', color: 'var(--text-primary)', backgroundColor: 'transparent' }}
      >
        {children}
      </button>
    </AlertDialogPrimitive.Cancel>
  )
}

export default function AlertDialog({ open, onOpenChange, title, description, children }: AlertDialogProps) {
  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <AlertDialogPrimitive.Portal forceMount>
            <AlertDialogPrimitive.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-40 bg-black/40"
                style={{ backdropFilter: 'blur(2px)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            </AlertDialogPrimitive.Overlay>

            <AlertDialogPrimitive.Content asChild>
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                <div
                  className="relative w-full max-w-sm rounded-xl shadow-lg overflow-hidden"
                  style={{ backgroundColor: 'var(--surface)' }}
                >
                  <div className="p-5">
                    <AlertDialogPrimitive.Title className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {title}
                    </AlertDialogPrimitive.Title>
                    {description && (
                      <AlertDialogPrimitive.Description className="text-sm mt-1.5" style={{ color: 'var(--text-secondary)' }}>
                        {description}
                      </AlertDialogPrimitive.Description>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 px-5 pb-5">
                    {children}
                  </div>
                </div>
              </motion.div>
            </AlertDialogPrimitive.Content>
          </AlertDialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </AlertDialogPrimitive.Root>
  )
}

'use client'

import { useState, ReactNode } from 'react'

interface TooltipProps {
  content: string
  children: ReactNode
  position?: 'top' | 'bottom'
}

export default function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [show, setShow] = useState(false)

  const isTop = position === 'top'

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div 
          className={`absolute ${isTop ? 'bottom-full' : 'top-full'} left-1/2 -translate-x-1/2 ${isTop ? 'mb-2' : 'mt-2'} px-2 py-1 text-xs rounded whitespace-nowrap z-50`}
          style={{ 
            backgroundColor: 'var(--surface-alt)', 
            color: 'var(--text-primary)',
            border: '1px solid var(--border)'
          }}
        >
          {content}
          <div 
            className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rotate-45"
            style={{ 
              backgroundColor: 'var(--surface-alt)',
              borderRight: '1px solid var(--border)',
              borderBottom: '1px solid var(--border)',
              ...(isTop ? { bottom: '-5px', top: 'auto' } : { top: '-5px', bottom: 'auto' })
            }}
          />
        </div>
      )}
    </div>
  )
}
'use client'

import { useState, ReactNode, useRef } from 'react'

interface TooltipProps {
  content: string
  children: ReactNode
  position?: 'top' | 'bottom'
  delay?: number
}

export default function Tooltip({ content, children, position = 'top', delay = 300 }: TooltipProps) {
  const [show, setShow] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const isTop = position === 'top'

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => setShow(true), delay)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setShow(false)
  }

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={() => {
        timeoutRef.current = setTimeout(() => setShow(true), delay)
      }}
      onBlur={handleMouseLeave}
    >
      {children}
      {show && (
        <div 
          className={`absolute ${isTop ? 'bottom-full' : 'top-full'} left-1/2 -translate-x-1/2 ${isTop ? 'mb-2' : 'mt-2'} px-2.5 py-1.5 text-xs rounded-md whitespace-nowrap z-50 shadow-md`}
          style={{ 
            backgroundColor: 'var(--surface)', 
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          {content}
          <div 
            className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rotate-45"
            style={{ 
              backgroundColor: 'var(--surface)',
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
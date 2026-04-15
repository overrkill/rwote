'use client'

import { useState } from 'react'
import type { User } from '@/lib/types'

interface AvatarProps {
  user: User | null
  size?: number
}

export default function Avatar({ user, size = 32 }: AvatarProps) {
  const [imgError, setImgError] = useState(false)
  
  const getInitial = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase()
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return '?'
  }

  const avatarStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: size * 0.4,
    fontWeight: 600,
    flexShrink: 0,
    overflow: 'hidden',
    backgroundColor: 'var(--surface-alt)',
    color: 'var(--text-primary)',
  }

  if (user?.avatar && !imgError) {
    return (
      <img
        src={user.avatar}
        alt={user.name || user.email || 'Avatar'}
        style={avatarStyle}
        onError={() => setImgError(true)}
      />
    )
  }

  return (
    <div style={avatarStyle}>
      {getInitial()}
    </div>
  )
}

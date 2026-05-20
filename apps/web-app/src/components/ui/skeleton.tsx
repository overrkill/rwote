'use client'

function S({ width, height, rounded = '6px' }: { width: string | number; height: string | number; rounded?: string }) {
  return (
    <div
      className="animate-pulse"
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: rounded,
        backgroundColor: 'var(--border)',
      }}
    />
  )
}

const SIDEBAR_WIDTHS = ['85%', '70%', '75%', '60%', '80%', '65%', '55%', '72%', '68%', '78%']

export function DashboardSkeleton() {
  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--bg)' }}>
      <header className="px-4 py-2 shrink-0 flex items-center justify-between" style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-4">
          <S width={70} height={20} />
          <S width={50} height={12} rounded="4px" />
        </div>
        <div className="flex items-center gap-3">
          <S width={20} height={20} rounded="4px" />
          <S width={20} height={20} rounded="4px" />
          <S width={20} height={20} rounded="4px" />
          <S width={28} height={28} rounded="50%" />
        </div>
      </header>
      <div className="flex-1 flex overflow-hidden">
        <div className="hidden md:flex flex-col gap-2 p-3" style={{ width: 280, flexShrink: 0, borderRight: '1px solid var(--border)' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2.5 rounded-lg">
              <S width={SIDEBAR_WIDTHS[i]} height={14} rounded="4px" />
            </div>
          ))}
        </div>
        <div className="flex-1 p-6 flex items-start justify-center">
          <div className="flex flex-col gap-4 w-full max-w-2xl pt-12">
            <S width="60%" height={28} />
            <S width="100%" height={14} rounded="4px" />
            <S width="100%" height={14} rounded="4px" />
            <S width="90%" height={14} rounded="4px" />
            <div className="h-4" />
            <S width="100%" height={14} rounded="4px" />
            <S width="100%" height={14} rounded="4px" />
            <S width="75%" height={14} rounded="4px" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function SettingsSkeleton() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <header className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <S width={18} height={18} rounded="4px" />
        <S width={80} height={20} />
      </header>
      <div className="max-w-lg mx-auto p-4 space-y-6">
        <div className="flex items-center gap-4 p-4 rounded" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <S width={44} height={44} rounded="50%" />
          <div className="flex-1 space-y-2">
            <S width="40%" height={16} rounded="4px" />
            <S width="60%" height={12} rounded="4px" />
          </div>
        </div>
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="p-4 rounded space-y-3" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
            <S width={120} height={12} rounded="4px" />
            <S width="100%" height={12} rounded="4px" />
            <S width="100%" height={40} />
            <S width="100%" height={40} />
            <S width="50%" height={34} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function OverviewSkeleton() {
  return (
    <div className="h-full p-6">
      <div className="h-full max-w-5xl mx-auto">
        <div className="grid grid-cols-4 gap-3 h-full">
          {['deadlines', 'todos', 'followUps', 'flashCards'].map((key) => (
            <div
              key={key}
              className="flex flex-col overflow-hidden"
              style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
            >
              <div className="flex items-center justify-between px-3 py-2" style={{ backgroundColor: 'var(--surface)' }}>
                <S width={80} height={14} rounded="4px" />
                <S width={14} height={14} rounded="4px" />
              </div>
              <div className="flex-1 p-3 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-2 py-1">
                    <S width={12} height={12} rounded="3px" />
                    <S width={SIDEBAR_WIDTHS[i % SIDEBAR_WIDTHS.length]} height={12} rounded="4px" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

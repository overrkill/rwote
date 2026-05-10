'use client'

import type { SubscriptionStatus } from '@/lib/types'
import Dialog from './dialog'

interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  subscription: SubscriptionStatus | null
  onSubscribe: (plan: string) => Promise<void>
}

export default function SubscriptionModal({ isOpen, onClose, subscription, onSubscribe }: SubscriptionModalProps) {
  const status = subscription?.subscription_status || 'none'
  const daysLeft = subscription?.days_left

  const handleSubscribe = async (plan: string) => {
    await onSubscribe(plan)
    onClose()
  }

  const content = (
    <div className="p-6">
      {status === 'paid' ? (
        <div className="text-center">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-lg font-semibold" style={{ color: '#15803d' }}>You&apos;re subscribed!</p>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Cloud sync is enabled</p>
        </div>
      ) : status === 'trial' && daysLeft && daysLeft > 0 ? (
        <div className="text-center">
          <div className="text-4xl mb-3">⏳</div>
          <p className="text-lg font-semibold" style={{ color: '#1d4ed8' }}>Trial Active</p>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>{daysLeft} days left</p>
        </div>
      ) : (
        <>
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">☁️</div>
            <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Enable Cloud Sync</p>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Sync your notes across all your devices with cloud backup.
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--surface-alt)' }}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Monthly</span>
                <span style={{ color: 'var(--text-secondary)' }}>$5/mo</span>
              </div>
              <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>Billed monthly, cancel anytime</p>
              <button
                onClick={() => handleSubscribe('monthly')}
                className="w-full px-6 py-2.5 rounded-md font-semibold cursor-pointer transition-opacity"
                style={{ backgroundColor: 'var(--accent-btn)', color: 'var(--bg)' }}
              >
                Subscribe Monthly
              </button>
            </div>

            <div className="p-4 rounded-lg" style={{ border: '1px solid var(--border)' }}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Lifetime</span>
                <span style={{ color: 'var(--text-secondary)' }}>$30</span>
              </div>
              <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>One-time payment, forever access</p>
              <button
                onClick={() => handleSubscribe('lifetime')}
                className="w-full px-6 py-2.5 rounded-md font-semibold cursor-pointer transition-all"
                style={{ backgroundColor: 'var(--surface-alt)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
              >
                Get Lifetime Access
              </button>
            </div>
          </div>

          <p className="text-xs text-center mt-4" style={{ color: 'var(--text-tertiary)' }}>
            Secure payment via Supabase
          </p>
        </>
      )}
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }} title="Subscription">
      {content}
    </Dialog>
  )
}

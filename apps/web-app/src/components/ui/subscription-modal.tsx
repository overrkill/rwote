'use client'

import type { SubscriptionStatus } from '@/lib/types'

interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  subscription: SubscriptionStatus | null
  onSubscribe: (plan: string) => Promise<void>
}

export default function SubscriptionModal({ isOpen, onClose, subscription, onSubscribe }: SubscriptionModalProps) {
  if (!isOpen) return null

  const status = subscription?.subscription_status || 'none'
  const daysLeft = subscription?.days_left

  const handleSubscribe = async (plan: string) => {
    await onSubscribe(plan)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-lg max-w-md w-full mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-lg font-semibold">Subscription</h3>
          <button onClick={onClose} className="text-xl text-tertiary hover:text-primary">
            ×
          </button>
        </div>

        <div className="p-6">
          {status === 'paid' ? (
            <div className="text-center">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-lg font-semibold text-green-700">You&apos;re subscribed!</p>
              <p className="text-secondary mt-2">Cloud sync is enabled</p>
            </div>
          ) : status === 'trial' && daysLeft && daysLeft > 0 ? (
            <div className="text-center">
              <div className="text-4xl mb-3">⏳</div>
              <p className="text-lg font-semibold text-blue-700">Trial Active</p>
              <p className="text-secondary mt-2">{daysLeft} days left</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">☁️</div>
                <p className="text-lg font-semibold">Enable Cloud Sync</p>
                <p className="text-secondary mt-2 text-sm">
                  Sync your notes across all your devices with cloud backup.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-surface-alt rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">Monthly</span>
                    <span className="text-secondary">$5/mo</span>
                  </div>
                  <p className="text-sm text-secondary mb-3">Billed monthly, cancel anytime</p>
                  <button
                    onClick={() => handleSubscribe('monthly')}
                    className="w-full btn-primary"
                  >
                    Subscribe Monthly
                  </button>
                </div>

                <div className="p-4 border border-border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">Lifetime</span>
                    <span className="text-secondary">$30</span>
                  </div>
                  <p className="text-sm text-secondary mb-3">One-time payment, forever access</p>
                  <button
                    onClick={() => handleSubscribe('lifetime')}
                    className="w-full btn-secondary"
                  >
                    Get Lifetime Access
                  </button>
                </div>
              </div>

              <p className="text-xs text-center text-tertiary mt-4">
                Secure payment via Supabase
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

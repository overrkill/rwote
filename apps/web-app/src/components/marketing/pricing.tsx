export default function Pricing() {
  return (
    <section className="py-16 bg-surface" id="pricing">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
          Simple pricing
        </h2>
        <p className="text-secondary text-center mb-12">
          Start free. Upgrade when you need cloud sync.
        </p>
        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white rounded-xl border border-border p-8">
            <h3 className="text-xl font-semibold mb-2">Free</h3>
            <p className="text-3xl font-bold mb-4">$0</p>
            <p className="text-secondary text-sm mb-6">Forever free</p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-sm">
                <span className="text-green-600">✓</span>
                Unlimited notes
              </li>
              <li className="flex items-center gap-2 text-sm">
                <span className="text-green-600">✓</span>
                Chrome extension
              </li>
              <li className="flex items-center gap-2 text-sm">
                <span className="text-green-600">✓</span>
                Web app access
              </li>
              <li className="flex items-center gap-2 text-sm text-secondary">
                <span>−</span>
                Local storage only
              </li>
            </ul>
            <a href="/auth/register" className="btn-secondary w-full text-center block">
              Get Started
            </a>
          </div>

          {/* Pro Plan */}
          <div className="bg-white rounded-xl border-2 border-primary p-8 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs px-3 py-1 rounded-full">
              Pro
            </div>
            <h3 className="text-xl font-semibold mb-2">Pro</h3>
            <p className="text-3xl font-bold mb-4">$5<span className="text-base font-normal text-secondary">/mo</span></p>
            <p className="text-secondary text-sm mb-6">or $30 lifetime</p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-sm">
                <span className="text-green-600">✓</span>
                Everything in Free
              </li>
              <li className="flex items-center gap-2 text-sm">
                <span className="text-green-600">✓</span>
                Cloud sync
              </li>
              <li className="flex items-center gap-2 text-sm">
                <span className="text-green-600">✓</span>
                Access on any device
              </li>
              <li className="flex items-center gap-2 text-sm">
                <span className="text-green-600">✓</span>
                Automatic backup
              </li>
            </ul>
            {/* TODO: Replace with actual Stripe checkout */}
            <div className="bg-gray-100 rounded-lg p-4 text-center text-sm text-secondary">
              Payment integration coming soon
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

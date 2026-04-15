export default function Pricing() {
  return (
    <section className="py-16" id="pricing" style={{ backgroundColor: 'var(--surface)' }}>
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-4" style={{ color: 'var(--text-primary)' }}>
          Simple pricing
        </h2>
        <p className="text-center mb-12" style={{ color: 'var(--text-secondary)' }}>
          Start free. Upgrade when you need cloud sync.
        </p>
        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {/* Free Plan */}
          <div className="rounded-xl p-8" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Free</h3>
            <p className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>$0</p>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Forever free</p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                <span style={{ color: '#22c55e' }}>✓</span>
                Unlimited notes
              </li>
              <li className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                <span style={{ color: '#22c55e' }}>✓</span>
                Browser extension
              </li>
              <li className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                <span style={{ color: '#22c55e' }}>✓</span>
                Select to add
              </li>
              <li className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <span>−</span>
                Local storage only
              </li>
            </ul>
            <a href="/auth/register" className="block w-full px-6 py-2.5 rounded-full font-normal cursor-pointer transition-all text-center" style={{ backgroundColor: 'var(--surface-alt)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
              Get Extension
            </a>
          </div>

          {/* Pro Plan */}
          <div className="rounded-xl p-8 relative" style={{ backgroundColor: 'var(--bg)', border: '2px solid var(--accent-btn)' }}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--accent-btn)', color: 'var(--bg)' }}>
              Pro
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Pro</h3>
            <p className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>$5<span className="text-base font-normal" style={{ color: 'var(--text-secondary)' }}>/mo</span></p>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>or $30 lifetime</p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                <span style={{ color: '#22c55e' }}>✓</span>
                Everything in Free
              </li>
              <li className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                <span style={{ color: '#22c55e' }}>✓</span>
                Cloud sync
              </li>
              <li className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                <span style={{ color: '#22c55e' }}>✓</span>
                Access on any device
              </li>
              <li className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                <span style={{ color: '#22c55e' }}>✓</span>
                Automatic backup
              </li>
            </ul>
            <a href="/auth/register" className="block w-full px-8 py-3 rounded-full font-semibold cursor-pointer transition-opacity text-center" style={{ backgroundColor: 'var(--accent-btn)', color: 'var(--bg)' }}>
              Try 7 Days free trial 
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

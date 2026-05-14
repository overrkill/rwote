export default function Pricing() {
  return (
    <section className="py-16" id="pricing" style={{ backgroundColor: 'var(--surface)' }}>
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-4" style={{ color: 'var(--text-primary)' }}>
          Simple pricing
        </h2>
        <p className="text-center mb-12" style={{ color: 'var(--text-secondary)' }}>
          Free for everyone.
        </p>
        <div className="max-w-sm mx-auto">
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
                Chrome extension
              </li>
              <li className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                <span style={{ color: '#22c55e' }}>✓</span>
                Cloud sync
              </li>
              <li className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                <span style={{ color: '#22c55e' }}>✓</span>
                AI summarization
              </li>
            </ul>
            <a href="/auth/register" className="block w-full px-6 py-2.5 rounded-full font-normal cursor-pointer transition-all text-center" style={{ backgroundColor: 'var(--accent-btn)', color: 'var(--bg)' }}>
              Get Started Free
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

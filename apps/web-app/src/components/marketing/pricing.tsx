export default function Pricing() {
  return (
    <section className="py-16 bg-[#fafafa] dark:bg-[#0f0e0d]" id="pricing">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-4 text-[#1a1a1a] dark:text-[#f5f2ec]">
          Simple pricing
        </h2>
        <p className="text-[#555555] dark:text-[#a0a0a0] text-center mb-12">
          Start free. Upgrade when you need cloud sync.
        </p>
        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white dark:bg-[#1a1a19] rounded-xl border border-[#d8d8d8] dark:border-[#3a3a38] p-8">
            <h3 className="text-xl font-semibold mb-2 text-[#1a1a1a] dark:text-[#f5f2ec]">Free</h3>
            <p className="text-3xl font-bold mb-4 text-[#1a1a1a] dark:text-[#f5f2ec]">$0</p>
            <p className="text-[#555555] dark:text-[#a0a0a0] text-sm mb-6">Forever free</p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-sm text-[#1a1a1a] dark:text-[#f5f2ec]">
                <span className="text-green-600">✓</span>
                Unlimited notes
              </li>
              <li className="flex items-center gap-2 text-sm text-[#1a1a1a] dark:text-[#f5f2ec]">
                <span className="text-green-600">✓</span>
                Browser extension
              </li>
              <li className="flex items-center gap-2 text-sm text-[#1a1a1a] dark:text-[#f5f2ec]">
                <span className="text-green-600">✓</span>
                Select to add
              </li>
              <li className="flex items-center gap-2 text-sm text-[#555555] dark:text-[#a0a0a0]">
                <span>−</span>
                Local storage only
              </li>
            </ul>
            <a href="/auth/register" className="block w-full px-6 py-2.5 bg-[#f0f0f0] dark:bg-[#2a2a28] text-[#1a1a1a] dark:text-[#f5f2ec] border border-[#d8d8d8] dark:border-[#3a3a38] rounded-full font-normal cursor-pointer transition-all hover:border-[#a0a0a0] dark:hover:border-[#5a5a58] text-center">
              Get Extension
            </a>
          </div>

          {/* Pro Plan */}
          <div className="bg-white dark:bg-[#1a1a19] rounded-xl border-2 border-[#1a1a1a] dark:border-[#f5f2ec] p-8 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1a1a1a] dark:bg-[#f5f2ec] text-white dark:text-[#0f0e0d] text-xs px-3 py-1 rounded-full">
              Pro
            </div>
            <h3 className="text-xl font-semibold mb-2 text-[#1a1a1a] dark:text-[#f5f2ec]">Pro</h3>
            <p className="text-3xl font-bold mb-4 text-[#1a1a1a] dark:text-[#f5f2ec]">$5<span className="text-base font-normal text-[#555555] dark:text-[#a0a0a0]">/mo</span></p>
            <p className="text-[#555555] dark:text-[#a0a0a0] text-sm mb-6">or $30 lifetime</p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-sm text-[#1a1a1a] dark:text-[#f5f2ec]">
                <span className="text-green-600">✓</span>
                Everything in Free
              </li>
              <li className="flex items-center gap-2 text-sm text-[#1a1a1a] dark:text-[#f5f2ec]">
                <span className="text-green-600">✓</span>
                Cloud sync
              </li>
              <li className="flex items-center gap-2 text-sm text-[#1a1a1a] dark:text-[#f5f2ec]">
                <span className="text-green-600">✓</span>
                Access on any device
              </li>
              <li className="flex items-center gap-2 text-sm text-[#1a1a1a] dark:text-[#f5f2ec]">
                <span className="text-green-600">✓</span>
                Automatic backup
              </li>
            </ul>
            <a href="/auth/register" className="block w-full px-8 py-3 bg-[#1a1a1a] dark:bg-[#f5f2ec] text-white dark:text-[#0f0e0d] border-none rounded-full font-semibold cursor-pointer transition-opacity hover:opacity-85 text-center">
              Try 7 Days free trial 
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

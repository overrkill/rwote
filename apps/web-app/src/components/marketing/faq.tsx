export default function FAQ() {
  const faqs = [
    {
      q: 'How does the Chrome extension work?',
      a: 'Install the extension, select text on any webpage, right-click, and choose "Save to Rwote". Your insight is captured with the page context.',
    },
    {
      q: 'Is my data secure?',
      a: 'Yes. Free users data stays on your device. Pro users data is encrypted in transit and at rest on our servers.',
    },
    {
      q: 'Can I use it offline?',
      a: 'Yes. The Chrome extension works offline. Your notes are saved locally and sync when you reconnect.',
    },
    {
      q: 'How does cloud sync work?',
      a: 'Your notes are encrypted and stored in our cloud. They sync automatically across all your devices when you sign in.',
    },
  ]

  return (
    <section className="py-16" id="faq" style={{ backgroundColor: 'var(--surface)' }}>
      <div className="max-w-2xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12" style={{ color: 'var(--text-primary)' }}>
          FAQ
        </h2>
        <div className="space-y-6">
          {faqs.map((faq) => (
            <div key={faq.q} className="pb-6" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{faq.q}</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

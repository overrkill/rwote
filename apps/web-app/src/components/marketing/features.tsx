export default function Features() {
  const features = [
    {
      emoji: '⚡',
      title: 'Capture anywhere',
      description: 'Use the Chrome extension to save insights while browsing. Or use the web app anywhere.',
    },
    {
      emoji: '🏷️',
      title: 'Organize with tags',
      description: 'Tag your notes by topic. Filter and search to find what you need instantly.',
    },
    {
      emoji: '☁️',
      title: 'Sync across devices',
      description: 'Access your notes on any device with cloud sync. Never lose an insight.',
    },
  ]

  return (
    <section className="py-16 bg-surface">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          Everything you need to learn better
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="text-center p-6">
              <div className="text-4xl mb-4">{feature.emoji}</div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-secondary text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

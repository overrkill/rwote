export default function HowItWorks() {
  const steps = [
    {
      number: '1',
      title: 'Sign up',
      description: 'Create a free account in seconds.',
    },
    {
      number: '2',
      title: 'Start capturing',
      description: 'Use the Chrome extension or web app to save insights.',
    },
    {
      number: '3',
      title: 'Learn better',
      description: 'Find and review your insights anytime.',
    },
  ]

  return (
    <section id="how-it-works" className="py-16 bg-white dark:bg-[#1a1a19]">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-[#1a1a1a] dark:text-[#f5f2ec]">
          How it works
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#1a1a1a] dark:bg-[#f5f2ec] text-white dark:text-[#0f0e0d] flex items-center justify-center text-xl font-bold mx-auto mb-4">
                {step.number}
              </div>
              <h3 className="text-lg font-semibold mb-2 text-[#1a1a1a] dark:text-[#f5f2ec]">{step.title}</h3>
              <p className="text-[#555555] dark:text-[#a0a0a0] text-sm">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

import BrowserMockup from './browser-mockup'

export default function Hero() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
        {/* Text content */}
        <div className="animate-fadeUp">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight" style={{ color: 'var(--text-primary)' }}>
            Capture insights from your learning
          </h1>
          <p className="text-lg md:text-xl mb-10 max-w-xl" style={{ color: 'var(--text-secondary)' }}>
            A simple tool for capturing and organizing insights while you learn. 
            Works as a Chrome extension and web app.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a href="/auth/register" className="px-8 py-3 rounded-full font-semibold cursor-pointer transition-opacity hover:opacity-85 text-center" style={{ backgroundColor: 'var(--accent-btn)', color: 'var(--bg)' }}>
              Get Started Free
            </a>
            <a href="#how-it-works" className="px-8 py-3 rounded-full font-normal cursor-pointer transition-all text-center" style={{ backgroundColor: 'var(--surface-alt)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
              How It Works
            </a>
          </div>
        </div>
        
        {/* Browser mockup */}
        <div className="animate-fadeUp animation-delay-200 hidden md:block">
          <BrowserMockup />
        </div>
      </div>
    </section>
  )
}

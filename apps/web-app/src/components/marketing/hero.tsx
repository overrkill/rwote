import BrowserMockup from './browser-mockup'

export default function Hero() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
        {/* Text content */}
        <div className="animate-fadeUp">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary mb-6 leading-tight">
            Capture insights from your learning
          </h1>
          <p className="text-lg md:text-xl text-secondary mb-10 max-w-xl">
            A simple tool for capturing and organizing insights while you learn. 
            Works as a Chrome extension and web app.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a href="/auth/register" className="btn-primary text-base px-8 py-3">
              Get Started Free
            </a>
            <a href="#how-it-works" className="btn-secondary text-base px-8 py-3">
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

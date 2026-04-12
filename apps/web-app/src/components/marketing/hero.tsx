import BrowserMockup from './browser-mockup'

export default function Hero() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
        {/* Text content */}
        <div className="animate-fadeUp">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#1a1a1a] dark:text-[#f5f2ec] mb-6 leading-tight">
            Capture insights from your learning
          </h1>
          <p className="text-lg md:text-xl text-[#555555] dark:text-[#a0a0a0] mb-10 max-w-xl">
            A simple tool for capturing and organizing insights while you learn. 
            Works as a Chrome extension and web app.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a href="/auth/register" className="px-8 py-3 bg-[#1a1a1a] dark:bg-[#f5f2ec] text-white dark:text-[#0f0e0d] border-none rounded-full font-semibold cursor-pointer transition-opacity hover:opacity-85 text-center">
              Get Started Free
            </a>
            <a href="#how-it-works" className="px-8 py-3 bg-[#f0f0f0] dark:bg-[#2a2a28] text-[#1a1a1a] dark:text-[#f5f2ec] border border-[#d8d8d8] dark:border-[#3a3a38] rounded-full font-normal cursor-pointer transition-all hover:border-[#a0a0a0] dark:hover:border-[#5a5a58] text-center">
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

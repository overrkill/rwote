export default function Hero() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary mb-6 leading-tight">
          Capture insights from your learning
        </h1>
        <p className="text-lg md:text-xl text-secondary mb-10 max-w-2xl mx-auto">
          A simple tool for capturing and organizing insights while you learn. 
          Works as a Chrome extension and web app.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/auth/register" className="btn-primary text-base px-8 py-3">
            Get Started Free
          </a>
          <a href="#how-it-works" className="btn-secondary text-base px-8 py-3">
            How It Works
          </a>
        </div>
      </div>
    </section>
  )
}

import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import Hero from '@/components/marketing/hero'
import Features from '@/components/marketing/features'
import HowItWorks from '@/components/marketing/how-it-works'
import Pricing from '@/components/marketing/pricing'
import FAQ from '@/components/marketing/faq'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <Features />
        <HowItWorks />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </div>
  )
}

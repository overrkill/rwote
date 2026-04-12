import type { Metadata } from 'next'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'Rwote - Capture and organize insights from your learning',
  description: 'A Chrome extension and web app for capturing and organizing insights from learning sessions. Perfect for DSA preparation and technical interviews.',
  keywords: ['chrome extension', 'note taking', 'DSA', 'learning', 'technical interviews'],
  openGraph: {
    title: 'Rwote - Capture and organize insights from your learning',
    description: 'A Chrome extension and web app for capturing and organizing insights from learning sessions.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#0f0e0d" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Grand+Hotel&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-white text-primary antialiased">
        {children}
      </body>
    </html>
  )
}

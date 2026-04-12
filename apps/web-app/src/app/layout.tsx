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

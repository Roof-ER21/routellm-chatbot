import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SusanAI-21 | Roof-ER Assistant',
  description: 'SusanAI-21 - Your intelligent roofing assistant for damage assessment, insurance claims, and professional support',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SusanAI-21'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

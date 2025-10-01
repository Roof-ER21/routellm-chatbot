import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Susan AI-21 Chatbot',
  description: 'Chat with Susan AI - Your custom trained AI assistant',
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

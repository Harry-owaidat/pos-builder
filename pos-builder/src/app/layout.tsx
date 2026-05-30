import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'POS Builder — Multi-Tenant POS Platform',
  description: 'Build and manage your own POS system for restaurant, pharmacy, or retail store.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-100 min-h-screen">
        {children}
      </body>
    </html>
  )
}

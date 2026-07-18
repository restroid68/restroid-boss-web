import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { appearanceBootScript } from '@/lib/boss-appearance'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'RestroidBOSS',
  description: 'Restoran sahibi için operasyonel kontrol paneli',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#070B14',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr" className="bg-background" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: appearanceBootScript() }} />
      </head>
      <body className={`${inter.className} antialiased font-sans`}>
        {children}
      </body>
    </html>
  )
}

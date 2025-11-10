import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
})

export const metadata: Metadata = {
  title: 'IPTV Player - Watch Live TV Channels',
  description: 'Modern IPTV player with stunning Revolut-inspired design. Watch thousands of live TV channels from around the world.',
  keywords: 'IPTV, Live TV, Streaming, Television, Channels, Player, HLS, M3U8',
  authors: [{ name: 'IPTV Player' }],
  openGraph: {
    title: 'IPTV Player',
    description: 'Watch live TV channels with modern interface',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#9400D3',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className={`${inter.className} antialiased min-h-screen`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}

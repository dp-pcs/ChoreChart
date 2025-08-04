import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Chorbie - Smart Family Management',
  description: 'AI-powered family chore management with smart allowance tracking, behavioral insights, and Chorbie AI assistant for kids.',
  keywords: ['chores', 'family', 'kids', 'allowance', 'AI', 'parenting', 'behavior tracking'],
  authors: [{ name: 'Chorbie Team' }],
  creator: 'Chorbie',
  publisher: 'Chorbie',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Chorbie',
    startupImage: [
      '/apple-touch-startup-image-768x1004.png',
      '/apple-touch-startup-image-1536x2008.png',
    ],
  },
  openGraph: {
    type: 'website',
    siteName: 'Chorbie',
    title: 'Chorbie - Smart Family Management',
    description: 'AI-powered family chore management with Chorbie AI assistant for kids',
    images: [
      {
        url: 'https://chorbie.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Chorbie - Family Management App',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chorbie - Smart Family Management',
    description: 'AI-powered family chore management with Chorbie AI assistant for kids',
    images: ['https://chorbie.app/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#4CAF50' },
    { media: '(prefers-color-scheme: dark)', color: '#388E3C' },
  ],
  colorScheme: 'light',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}

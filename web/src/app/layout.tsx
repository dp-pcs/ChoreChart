import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Chorebit - Smart Family Management',
  description: 'AI-powered family chore management with smart allowance tracking, behavioral insights, and Chorbit AI assistant for kids.',
  keywords: ['chores', 'family', 'kids', 'allowance', 'AI', 'parenting', 'behavior tracking'],
  authors: [{ name: 'Chorebit Team' }],
  creator: 'Chorebit',
  publisher: 'Chorebit',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Chorebit',
    startupImage: [
      '/apple-touch-startup-image-768x1004.png',
      '/apple-touch-startup-image-1536x2008.png',
    ],
  },
  openGraph: {
    type: 'website',
    siteName: 'Chorebit',
    title: 'Chorebit - Smart Family Management',
    description: 'AI-powered family chore management with Chorbit AI assistant for kids',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Chorebit - Family Management App',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chorebit - Smart Family Management',
    description: 'AI-powered family chore management with Chorbit AI assistant for kids',
    images: ['/og-image.png'],
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
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}

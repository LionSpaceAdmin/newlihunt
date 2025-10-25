
import DynamicBackground from '@/components/DynamicBackground';
import { Analytics } from '@vercel/analytics/react';
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0A0A0A',
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lionsofzion.io';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Scam Hunter - AI-Powered Scam Detection',
    template: '%s | Scam Hunter',
  },
  description:
    'Protect yourself from online impersonation scams targeting supporters of Israel and the IDF with our advanced AI analysis platform.',
  keywords: [
    'scam detection',
    'AI security',
    'Israel support',
    'IDF',
    'fraud prevention',
    'online safety',
    'digital guardian',
    'Lions of Zion',
  ],
  authors: [{ name: 'Scam Hunter Team', url: siteUrl }],
  creator: 'Lions of Zion',
  publisher: 'Lions of Zion',
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'Scam Hunter',
    title: 'Scam Hunter - AI-Powered Scam Detection',
    description:
      'Protect yourself from online impersonation scams targeting supporters of Israel and the IDF with our advanced AI analysis platform.',
    images: [
      {
        url: '/lion-digital-guardian/social-card/social-share_v1_16x9.webp',
        width: 1536,
        height: 1024,
        alt: 'Scam Hunter - Digital Guardian protecting Israel supporters',
        type: 'image/webp',
      },
      {
        url: '/og-image.png',
        width: 1260,
        height: 630,
        alt: 'Scam Hunter - AI-Powered Scam Detection',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@LionsOfZion',
    creator: '@LionsOfZion',
    title: 'Scam Hunter - AI-Powered Scam Detection',
    description:
      'Protect yourself from online impersonation scams targeting supporters of Israel and the IDF with our advanced AI analysis platform.',
    images: [
      {
        url: '/lion-digital-guardian/social-card/social-share_v1_16x9.webp',
        alt: 'Scam Hunter - Digital Guardian protecting Israel supporters',
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <DynamicBackground />
        {children}
        <Analytics />

        {/* Buy Me a Coffee Widget Script - Only in Production */}
        {process.env.NODE_ENV === 'production' && (
          <script
            data-name="BMC-Widget"
            data-cfasync="false"
            src="https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js"
            data-id="danielhanukayeb"
            data-description="Support Our Mission!"
            data-message="🦁 Thank you for visiting! Your support helps us keep the digital front strong — exposing fake accounts and defending truth online. Join the pride. Roar for Israel. 🇮🇱🔥"
            data-color="#FF5F5F"
            data-position="Left"
            data-x_margin="18"
            data-y_margin="18"
            async
          />
        )}
      </body>
    </html>
  );
}


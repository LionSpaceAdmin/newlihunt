import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://lionsofzion.io'),
  title: "Scam Hunter - AI-Powered Scam Detection",
  description: "Protect yourself from online impersonation scams targeting supporters of Israel and the IDF with our advanced AI analysis platform.",
  keywords: "scam detection, AI security, Israel support, IDF, fraud prevention, online safety",
  authors: [{ name: "Scam Hunter Team" }],
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "Scam Hunter - AI-Powered Scam Detection",
    description: "Advanced AI platform for detecting online impersonation scams",
    images: ["/lion-digital-guardian/social-card/social-share_v1_16x9.webp"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Scam Hunter - AI-Powered Scam Detection",
    description: "Advanced AI platform for detecting online impersonation scams",
    images: ["/lion-digital-guardian/social-card/social-share_v1_16x9.webp"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

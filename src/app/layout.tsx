import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
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
    images: ["/og-image.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Scam Hunter - AI-Powered Scam Detection",
    description: "Advanced AI platform for detecting online impersonation scams",
    images: ["/og-image.png"],
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
        <Analytics />
        
        {/* Buy Me a Coffee Widget Script */}
        <script 
          data-name="BMC-Widget" 
          data-cfasync="false" 
          src="https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js" 
          data-id="danielhanukayeb" 
          data-description="Support me on Buy me a coffee!" 
          data-message="🦁 Thank you for visiting! Your support helps us keep the digital front strong — exposing fake accounts and defending truth online. Join the pride. Roar for Israel. 🇮🇱🔥" 
          data-color="#FF5F5F" 
          data-position="Right" 
          data-x_margin="18" 
          data-y_margin="18"
          async
        />
      </body>
    </html>
  );
}

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable React Compiler for better performance
  reactCompiler: true,

  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: [],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['@google/generative-ai'],
  },

  // Turbopack configuration (Next.js 16 default)
  turbopack: {
    // Specify the project root for Turbopack
    root: __dirname,
  },

  // Security headers
  async headers() {
    const isDevelopment = process.env.NODE_ENV === 'development';

    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' ${isDevelopment ? "'unsafe-eval'" : ''} https://vercel.live https://va.vercel-scripts.com https://cdnjs.buymeacoffee.com https://*.buymeacoffee.com`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: https: blob:",
      "media-src 'self' data: https:",
      `connect-src 'self' https: wss: ${isDevelopment ? "ws: http://localhost:*" : ''} https://*.buymeacoffee.com`,
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      ...(isDevelopment ? [] : ['upgrade-insecure-requests']),
      'block-all-mixed-content',
    ].join('; ');

    const permissionsPolicy = [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()',
      'ambient-light-sensor=()',
      'autoplay=()',
      'encrypted-media=()',
      'fullscreen=(self)',
      'picture-in-picture=()',
    ].join(', ');

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: permissionsPolicy,
          },
          {
            key: 'Content-Security-Policy',
            value: csp,
          },
        ],
      },
    ];
  },

  // Redirects for better SEO
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },

  // Environment variables validation
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Output configuration for deployment
  // output: 'standalone', // Removed for Vercel compatibility

  // Disable x-powered-by header
  poweredByHeader: false,

  // Compress responses
  compress: true,
};

export default nextConfig;

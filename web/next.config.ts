import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Never share a production build manifest with the development RSC bundler.
  // This prevents stale client-manifest entries after `next build` followed by `next dev`.
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: '127.0.0.1' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
  async rewrites() {
    const apiTarget = process.env.API_PROXY_URL;
    if (apiTarget) {
      return [
        {
          source: '/uploads/:path*',
          destination: `${apiTarget.replace(/\/$/, '')}/uploads/:path*`,
        },
      ];
    }
    return [];
  },
};
export default nextConfig;

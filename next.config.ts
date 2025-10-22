import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.ctfassets.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'red-academic-smelt-470.mypinata.cloud',
        port: '',
        pathname: '/**',
      },
    ],
  },
  turbopack: {
    rules: {
      // Handle SVG imports as React components with @svgr/webpack
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  serverExternalPackages: ['pino', 'pino-pretty'],
  reactStrictMode: false,
  cacheComponents: true,
  // Use default in-memory cache handler (suppresses connection warnings)
  cacheHandler: undefined,
  cacheMaxMemorySize: 50 * 1024 * 1024, // 50 MB (optional, default is 50MB)
}

export default nextConfig

import type { NextConfig } from 'next'
import bundleAnalyzer from '@next/bundle-analyzer'
// Relative import on purpose: next.config is loaded in plain Node, without the `@/` alias.
import { buildSecurityHeaders, getSecurityHeaderOptionsFromEnv } from './src/lib/config/securityHeaders'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Security headers (CSP, HSTS, XFO, ...) for every route — see src/lib/config/securityHeaders.ts.
  async headers() {
    return [{ source: '/:path*', headers: buildSecurityHeaders(getSecurityHeaderOptionsFromEnv()) }]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.ctfassets.net',
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
  experimental: {
    optimizePackageImports: ['lucide-react', '@solana/web3.js', '@solana/kit', '@solana/spl-token', '@solana/spl-token-metadata'],
  },
  serverExternalPackages: ['pino', 'pino-pretty'],
  reactStrictMode: false,
  cacheComponents: true,
  reactCompiler: true,
  // Use default in-memory cache handler (suppresses connection warnings)
  cacheHandler: undefined,
  cacheMaxMemorySize: 50 * 1024 * 1024, // 50 MB (optional, default is 50MB)
}

export default withBundleAnalyzer(nextConfig)

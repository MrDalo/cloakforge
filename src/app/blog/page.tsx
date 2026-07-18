import { Suspense } from 'react'
import { cacheLife, cacheTag } from 'next/cache'
import { getBlogPosts } from '@/lib/contentful/client'
import { BlogHero, BlogClient } from '@/components/pages/BlogPage'
import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog | CloakForge - Solana & Web3 Insights',
  description:
    'Stay updated with the latest in Solana blockchain, DeFi trends, token management, and Web3 development. Expert insights, tutorials, and guides for the decentralized future.',
  keywords:
    'CloakForge blog, Solana blockchain, Web3 development, DeFi tutorials, token management, cryptocurrency guides, blockchain insights, Solana tools, SPL tokens, decentralized finance',
  authors: [{ name: 'CloakForge Team' }],
  creator: 'CloakForge',
  publisher: 'CloakForge',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    title: 'CloakForge Blog - Solana & Web3 Insights',
    description:
      'Expert insights on Solana blockchain, token management, DeFi trends, and Web3 development. Stay ahead in the decentralized future with CloakForge.',
    url: 'https://cloakforge.app/blog',
    siteName: 'CloakForge',
    type: 'website',
    images: [
      {
        url: 'https://cloakforge.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CloakForge Blog - Solana & Web3 Insights',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@cloakforge',
    creator: '@cloakforge',
    title: 'CloakForge Blog - Solana & Web3 Insights',
    description:
      'Expert insights on Solana blockchain, token management, DeFi trends, and Web3 development. Stay ahead in the decentralized future.',
    images: [
      {
        url: 'https://cloakforge.app/og-image.png',
        alt: 'CloakForge Blog - Solana & Web3 Insights',
        width: 1200,
        height: 630,
      },
    ],
  },
  alternates: {
    canonical: 'https://cloakforge.app/blog',
  },
  other: {
    'og:section': 'Technology',
    'article:publisher': 'https://cloakforge.app',
  },
}

const BlogPage = async (): Promise<React.ReactElement> => {
  'use cache'
  cacheLife('weeks') // Cache for 1 day - blog posts rarely change, webhook revalidation on content updates
  cacheTag('blog-posts') // Tag for webhook revalidation when blog posts are updated

  const posts = await getBlogPosts()

  // Get unique categories from tags for stats
  const allTags = posts.flatMap((post) => post.tags)
  const uniqueTags = Array.from(new Set(allTags))

  return (
    <div className='bg-background relative min-h-screen'>
      <BlogHero totalPosts={posts.length} totalTags={uniqueTags.length} />
      <Suspense fallback={null}>
        <BlogClient posts={posts} />
      </Suspense>
    </div>
  )
}

export default BlogPage

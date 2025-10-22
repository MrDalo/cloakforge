import { cacheLife } from 'next/cache'
import { getBlogPost, getBlogPosts } from '@/lib/contentful/client'
import { RichTextRenderer } from '@/components/common/RichTextRenderer'
import { Badge } from '@/components/ui/badge'
import { Calendar, User, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const posts = await getBlogPosts()
  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPost(slug)

  if (!post) {
    return {
      title: 'Blog Post Not Found',
      description: 'The requested blog post could not be found.',
    }
  }

  const title = `${post.title} | CloakForge Blog`
  const description =
    post.excerpt || `Read about ${post.title} on CloakForge blog. Insights on Solana blockchain, token management, and Web3 development.`
  const publishedTime = new Date(post.publishedAt).toISOString()
  const imageUrl = post.coverImage ? `https:${post.coverImage.fields.file.url}` : 'https://cloakforge.app/og-image.png'
  const url = `https://cloakforge.app/blog/${slug}`

  return {
    title,
    description,
    keywords: ['CloakForge', 'Solana blockchain', 'Web3', 'cryptocurrency', 'token management', 'DeFi', ...post.tags].join(', '),
    authors: [{ name: post.author }],
    creator: post.author,
    publisher: 'CloakForge',
    robots: 'index, follow',
    openGraph: {
      title,
      description,
      url,
      siteName: 'CloakForge',
      type: 'article',
      publishedTime,
      authors: [post.author],
      tags: post.tags,
      images: [
        {
          url: imageUrl,
          width: post.coverImage ? post.coverImage.fields.file.details.image.width : 1200,
          height: post.coverImage ? post.coverImage.fields.file.details.image.height : 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@cloakforge',
      creator: '@cloakforge',
      title,
      description,
      images: [
        {
          url: imageUrl,
          alt: post.title,
          width: post.coverImage ? post.coverImage.fields.file.details.image.width : 1200,
          height: post.coverImage ? post.coverImage.fields.file.details.image.height : 630,
        },
      ],
    },
    alternates: {
      canonical: url,
    },
    other: {
      'article:published_time': publishedTime,
      'article:author': post.author,
      'article:section': 'Technology',
      'article:tag': post.tags.join(','),
    },
  }
}

interface BlogPostPageProps {
  params: Promise<{ slug: string }>
}

const BlogPostPage = async ({ params }: BlogPostPageProps): Promise<React.ReactElement> => {
  'use cache'
  cacheLife('hours') // Cache for 1 hour (same as previous revalidate: 3600)

  const { slug } = await params
  const post = await getBlogPost(slug)

  if (!post) {
    notFound()
  }

  return (
    <div className='bg-background relative'>
      <div className='mx-auto max-w-4xl px-4 py-16'>
        {/* Back Navigation */}
        <Link className='text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-2 transition-colors' href='/blog'>
          <ArrowLeft className='h-4 w-4' />
          Back to Blog
        </Link>

        {/* Featured Image */}
        {post.coverImage && (
          <div className='mb-8 aspect-video overflow-hidden rounded-lg'>
            <Image
              alt={post.title}
              className='h-full w-full object-cover'
              height={post.coverImage.fields.file.details.image.height}
              src={`https:${post.coverImage.fields.file.url}`}
              width={post.coverImage.fields.file.details.image.width}
            />
          </div>
        )}

        {/* Article Header */}
        <header className='mb-8'>
          <h1 className='mb-4 text-4xl font-bold tracking-tight sm:text-5xl'>{post.title}</h1>

          <div className='text-muted-foreground mb-4 flex items-center gap-6 text-sm'>
            <div className='flex items-center gap-2'>
              <Calendar className='h-4 w-4' />
              {new Date(post.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
            <div className='flex items-center gap-2'>
              <User className='h-4 w-4' />
              {post.author}
            </div>
          </div>

          {post.tags.length > 0 && (
            <div className='flex flex-wrap gap-2'>
              {post.tags.map((tag) => (
                <Badge key={tag} variant='secondary'>
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </header>

        {/* Article Content */}
        <article className='prose prose-lg prose-slate dark:prose-invert max-w-none'>
          {post.excerpt && <p className='text-muted-foreground text-lg italic'>{post.excerpt}</p>}

          <RichTextRenderer className='mt-6' content={post.content} />
        </article>

        {/* Back to Blog CTA */}
        <div className='mt-16 border-t pt-8'>
          <Link className='text-primary hover:text-primary/80 inline-flex items-center gap-2 font-medium transition-colors' href='/blog'>
            <ArrowLeft className='h-4 w-4' />
            Read more articles
          </Link>
        </div>
      </div>
    </div>
  )
}

export default BlogPostPage

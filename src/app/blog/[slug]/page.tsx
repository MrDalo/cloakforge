import { getBlogPost, getBlogPosts } from '@/lib/contentful/client'
import { RichTextRenderer } from '@/components/common/RichTextRenderer'
import { Badge } from '@/components/ui/badge'
import { Calendar, User, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'

export const revalidate = 3600 // Revalidate every hour

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const posts = await getBlogPosts()
  return posts.map((post) => ({
    slug: post.slug,
  }))
}

interface BlogPostPageProps {
  params: Promise<{ slug: string }>
}

const BlogPostPage = async ({ params }: BlogPostPageProps): Promise<React.ReactElement> => {
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

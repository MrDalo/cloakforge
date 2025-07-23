import { getBlogPosts } from '@/lib/contentful/client'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, User } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export const revalidate = 3600 // Revalidate every hour

const BlogPage = async (): Promise<React.ReactElement> => {
  const posts = await getBlogPosts()

  return (
    <div className='bg-background relative'>
      <div className='mx-auto max-w-6xl px-4 py-16'>
        {/* Hero Section */}
        <div className='mb-16 text-center'>
          <h1 className='mb-4 text-4xl font-bold tracking-tight sm:text-5xl'>Crypto Forge Blog</h1>
          <p className='text-muted-foreground mx-auto max-w-2xl text-lg'>
            Learn about Solana development, token creation, DeFi protocols, and the latest in web3 technology.
          </p>
        </div>

        {/* Blog Posts Grid */}
        {posts.length > 0 ? (
          <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
            {posts.map((post) => (
              <Link href={`/blog/${post.slug}`} key={post.slug}>
                <Card className='group cursor-pointer transition-all duration-200 hover:shadow-lg'>
                  {post.featuredImage && (
                    <div className='aspect-video overflow-hidden rounded-t-lg'>
                      <Image
                        alt={post.title}
                        className='h-full w-full object-cover transition-transform duration-200 group-hover:scale-105'
                        height={post.featuredImage.fields.file.details.image.height}
                        src={`https:${post.featuredImage.fields.file.url}`}
                        width={post.featuredImage.fields.file.details.image.width}
                      />
                    </div>
                  )}
                  <div className='p-6'>
                    <div className='text-muted-foreground mb-3 flex items-center gap-4 text-sm'>
                      <div className='flex items-center gap-1'>
                        <Calendar className='h-4 w-4' />
                        {new Date(post.publishedAt).toLocaleDateString()}
                      </div>
                      <div className='flex items-center gap-1'>
                        <User className='h-4 w-4' />
                        {post.author}
                      </div>
                    </div>

                    <h3 className='group-hover:text-primary mb-2 text-xl font-semibold transition-colors'>{post.title}</h3>

                    <p className='text-muted-foreground mb-4 line-clamp-3 text-sm'>{post.excerpt}</p>

                    {post.tags.length > 0 && (
                      <div className='flex flex-wrap gap-2'>
                        {post.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant='secondary'>
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className='py-16 text-center'>
            <h3 className='text-muted-foreground mb-2 text-xl'>No blog posts yet</h3>
            <p className='text-muted-foreground'>Check back soon for tutorials and insights!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default BlogPage

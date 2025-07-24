'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import type { BlogPost } from '@/lib/contentful/client'

interface BlogPostsGridProps {
  posts: BlogPost[]
  searchQuery: string
  selectedCategory: string
  onCategoryChange: (category: string) => void
}

const BlogPostsGrid = ({ posts, searchQuery, selectedCategory, onCategoryChange }: BlogPostsGridProps): React.ReactElement => {
  const filteredPosts = posts.filter((post) => {
    const matchesCategory = selectedCategory === 'all' || post.tags.includes(selectedCategory)
    const matchesSearch =
      searchQuery === '' ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesCategory && matchesSearch
  })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      className='px-6 py-16'
      initial={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      <div className='container mx-auto max-w-6xl'>
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className='mb-8 flex items-center justify-between'
          initial={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2 className='text-3xl md:text-4xl'>
            <span className='from-primary to-secondary bg-gradient-to-r bg-clip-text text-transparent'>
              {selectedCategory === 'all' ? 'Latest Articles' : `${selectedCategory} Articles`}
            </span>
          </h2>

          <div className='text-muted-foreground text-sm'>
            {filteredPosts.length} article{filteredPosts.length !== 1 ? 's' : ''} found
          </div>
        </motion.div>

        {filteredPosts.length > 0 ? (
          <motion.div animate='visible' className='grid gap-8 md:grid-cols-2 lg:grid-cols-3' initial='hidden' variants={containerVariants}>
            {filteredPosts.map((post, index) => (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                key={post.slug}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link href={`/blog/${post.slug}`}>
                  <Card className='border-border hover:border-primary/20 group h-full border-2 transition-all duration-300 hover:shadow-xl'>
                    {post.coverImage && (
                      <div className='aspect-video overflow-hidden rounded-t-lg'>
                        <Image
                          alt={post.title}
                          className='h-full w-full object-cover transition-transform duration-200 group-hover:scale-105'
                          height={post.coverImage.fields.file.details.image.height}
                          src={`https:${post.coverImage.fields.file.url}`}
                          width={post.coverImage.fields.file.details.image.width}
                        />
                      </div>
                    )}
                    <div className='p-6'>
                      <div className='text-muted-foreground mb-3 text-sm'>
                        📅 {new Date(post.publishedAt).toLocaleDateString()} • ✍️ {post.author}
                      </div>

                      <h3 className='group-hover:text-primary mb-3 line-clamp-2 text-xl font-semibold transition-colors'>{post.title}</h3>

                      <p className='text-muted-foreground mb-4 line-clamp-3 text-sm leading-relaxed'>{post.excerpt}</p>

                      {post.tags.length > 0 && (
                        <div className='flex flex-wrap gap-2'>
                          {post.tags.slice(0, 3).map((tag) => (
                            <Badge
                              className='hover:bg-primary/10 cursor-pointer text-xs'
                              key={tag}
                              onClick={(e) => {
                                e.preventDefault()
                                onCategoryChange(tag)
                              }}
                              variant='outline'
                            >
                              {tag}
                            </Badge>
                          ))}
                          {post.tags.length > 3 && (
                            <Badge className='text-xs' variant='outline'>
                              +{post.tags.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className='py-16 text-center'
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <BookOpen className='text-muted-foreground mx-auto mb-4 h-16 w-16' />
            <h3 className='mb-2 text-xl font-medium'>No articles found</h3>
            <p className='text-muted-foreground'>
              {searchQuery ? 'Try adjusting your search terms or' : ''}{' '}
              {selectedCategory !== 'all' ? 'Try selecting a different category or' : ''} check back soon for new content!
            </p>
          </motion.div>
        )}
      </div>
    </motion.section>
  )
}

export default BlogPostsGrid

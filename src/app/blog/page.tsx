import { getBlogPosts } from '@/lib/contentful/client'
import { BlogHero, BlogClient } from '@/components/pages/BlogPage'

export const revalidate = 3600 // Revalidate every hour

const BlogPage = async (): Promise<React.ReactElement> => {
  const posts = await getBlogPosts()

  // Get unique categories from tags for stats
  const allTags = posts.flatMap((post) => post.tags)
  const uniqueTags = Array.from(new Set(allTags))

  return (
    <div className='bg-background relative min-h-screen'>
      <BlogHero totalPosts={posts.length} totalTags={uniqueTags.length} />
      <BlogClient posts={posts} />
    </div>
  )
}

export default BlogPage

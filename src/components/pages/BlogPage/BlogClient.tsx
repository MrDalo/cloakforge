'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import BlogSearchAndFilter from './BlogSearchAndFilter'
import BlogPostsGrid from './BlogPostsGrid'
import type { BlogPost } from '@/lib/contentful/client'

interface BlogClientProps {
  posts: BlogPost[]
}

const BlogClient = ({ posts }: BlogClientProps): React.ReactElement => {
  const searchParams = useSearchParams()
  const [selectedCategory, setSelectedCategory] = useState('all')
  // Initialized from ?search= so shared/search-engine links (see WebSite JSON-LD
  // SearchAction in the root layout) land on a pre-filtered result, not the full list.
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') ?? '')

  // Get unique categories from tags
  const allTags = posts.flatMap((post) => post.tags)
  const uniqueTags = Array.from(new Set(allTags))

  const categories = [
    { value: 'all', label: 'All Posts', count: posts.length },
    ...uniqueTags.map((tag) => ({
      value: tag,
      label: tag,
      count: posts.filter((post) => post.tags.includes(tag)).length,
    })),
  ]

  return (
    <>
      <BlogSearchAndFilter
        categories={categories}
        onCategoryChange={setSelectedCategory}
        onSearchChange={setSearchQuery}
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
      />
      <BlogPostsGrid onCategoryChange={setSelectedCategory} posts={posts} searchQuery={searchQuery} selectedCategory={selectedCategory} />
    </>
  )
}

export default BlogClient

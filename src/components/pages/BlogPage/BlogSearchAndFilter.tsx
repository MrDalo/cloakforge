'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Filter } from 'lucide-react'
import { motion } from 'framer-motion'

interface Category {
  value: string
  label: string
  count: number
}

interface BlogSearchAndFilterProps {
  categories: Category[]
  onSearchChange: (query: string) => void
  onCategoryChange: (category: string) => void
  selectedCategory: string
  searchQuery: string
}

const BlogSearchAndFilter = ({
  categories,
  onSearchChange,
  onCategoryChange,
  selectedCategory,
  searchQuery,
}: BlogSearchAndFilterProps): React.ReactElement => (
  <motion.section
    animate={{ opacity: 1, y: 0 }}
    className='border-border border-b px-6 py-8'
    initial={{ opacity: 0, y: 20 }}
    transition={{ duration: 0.6, delay: 0.2 }}
  >
    <div className='container mx-auto max-w-6xl'>
      <div className='flex flex-col items-center justify-between gap-6 md:flex-row'>
        {/* Search Bar */}
        <motion.div
          animate={{ opacity: 1, x: 0 }}
          className='relative max-w-md flex-1'
          initial={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
          <Input className='pl-10' onChange={(e) => onSearchChange(e.target.value)} placeholder='Search articles...' value={searchQuery} />
        </motion.div>

        {/* Category Filter */}
        <motion.div
          animate={{ opacity: 1, x: 0 }}
          className='flex items-center space-x-4'
          initial={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Filter className='text-muted-foreground h-4 w-4' />
          <div className='flex flex-wrap gap-2'>
            {categories.map((category, index) => (
              <motion.div
                animate={{ opacity: 1, scale: 1 }}
                initial={{ opacity: 0, scale: 0.8 }}
                key={category.value}
                transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
              >
                <Button
                  className='text-sm'
                  onClick={() => onCategoryChange(category.value)}
                  size='sm'
                  variant={selectedCategory === category.value ? 'default' : 'outline'}
                >
                  {category.label} ({category.count})
                </Button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  </motion.section>
)

export default BlogSearchAndFilter

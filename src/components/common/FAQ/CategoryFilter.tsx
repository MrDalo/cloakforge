'use client'

import { Button } from '@/components/ui/button'

interface Category {
  id: string
  label: string
}

interface CategoryFilterProps {
  categories: Category[]
  selectedCategory: string
  onCategoryChange: (categoryId: string) => void
}

export const CategoryFilter = ({ categories, selectedCategory, onCategoryChange }: CategoryFilterProps): React.ReactNode => (
  <div className='mb-8 flex flex-wrap justify-center gap-2'>
    {categories.map((category) => (
      <Button
        key={category.id}
        onClick={() => onCategoryChange(category.id)}
        size='sm'
        variant={selectedCategory === category.id ? 'default' : 'outline'}
      >
        {category.label}
      </Button>
    ))}
  </div>
)

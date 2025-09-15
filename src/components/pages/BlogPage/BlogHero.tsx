'use client'

import { BookOpen, Star, TrendingUp, Users } from 'lucide-react'
import { motion } from 'framer-motion'

interface BlogHeroProps {
  totalPosts: number
  totalTags: number
}

const BlogHero = ({ totalPosts, totalTags }: BlogHeroProps): React.ReactElement => (
  <section className='from-background via-background to-muted relative overflow-hidden bg-gradient-to-br px-6 py-16 md:py-20'>
    <div className='encrypted-pattern absolute inset-0 opacity-5' />
    <div className='relative z-10 container mx-auto max-w-6xl'>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className='mb-12 text-center'
        initial={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.8 }}
      >
        {/* Feature Badge */}
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          className='bg-primary/10 text-primary mb-6 inline-flex items-center rounded-full px-4 py-2'
          initial={{ opacity: 0, scale: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <BookOpen className='mr-2 h-4 w-4' />
          <span className='text-sm'>Knowledge Hub</span>
        </motion.div>

        {/* Main Title */}
        <motion.h1
          animate={{ opacity: 1, y: 0 }}
          className='mb-6 text-4xl leading-tight md:text-5xl lg:text-6xl'
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <span className='from-primary to-secondary bg-gradient-to-r bg-clip-text text-transparent'>CloakForge Blog</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          animate={{ opacity: 1, y: 0 }}
          className='text-muted-foreground mx-auto mb-8 max-w-3xl text-lg md:text-xl'
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          Stay updated with the latest in Solana token management, DeFi trends, and Web3 security. Expert insights and tutorials for the
          decentralized future.
        </motion.p>

        {/* Key Stats */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className='mx-auto grid max-w-4xl gap-6 md:grid-cols-4'
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          {[
            { icon: BookOpen, title: 'Articles', value: `${totalPosts}+`, desc: 'Expert guides' },
            { icon: TrendingUp, title: 'Tools Covered', value: '8+', desc: 'Solana utilities' },
            { icon: Users, title: 'Topics', value: `${totalTags}+`, desc: 'Categories covered' },
            { icon: Star, title: 'Updated', value: 'Weekly', desc: 'Fresh content' },
          ].map((stat, index) => (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className='text-center'
              initial={{ opacity: 0, y: 20 }}
              key={stat.title}
              transition={{ delay: 0.6 + index * 0.1, duration: 0.6 }}
            >
              <div className='bg-primary/10 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl'>
                <stat.icon className='text-primary h-6 w-6' />
              </div>
              <div className='mb-1 text-2xl font-medium'>{stat.value}</div>
              <div className='text-muted-foreground mb-1 text-sm'>{stat.title}</div>
              <div className='text-muted-foreground text-xs'>{stat.desc}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  </section>
)

export default BlogHero

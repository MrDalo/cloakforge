'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { type NavigationTool } from './navigationData'

interface NavigationCardProps {
  tool: NavigationTool
  index: number
}

export const NavigationCard = ({ tool, index }: NavigationCardProps): React.ReactNode => (
  <motion.div
    animate={{ opacity: 1, y: 0 }}
    className='cursor-pointer'
    initial={{ opacity: 0, y: 20 }}
    transition={{ delay: 0.9 + index * 0.1, duration: 0.6 }}
    whileHover={{ y: -5 }}
  >
    <Card className='border-border hover:border-primary/20 h-full border-2 transition-all duration-300'>
      <CardContent className='p-6 text-center'>
        <div className={`h-12 w-12 rounded-xl bg-${tool.color}/10 mx-auto mb-4 flex items-center justify-center`}>
          <tool.icon className={`h-6 w-6 text-${tool.color}`} />
        </div>
        <h3 className='mb-2 text-lg font-medium'>{tool.title}</h3>
        <p className='text-muted-foreground text-sm'>{tool.description}</p>
        <div className='mt-4'>
          <Link className='text-primary hover:text-primary/80 text-sm font-medium transition-colors' href={tool.href}>
            Learn More →
          </Link>
        </div>
      </CardContent>
    </Card>
  </motion.div>
)

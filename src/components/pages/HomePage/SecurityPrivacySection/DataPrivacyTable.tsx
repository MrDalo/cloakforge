'use client'

import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { Eye } from 'lucide-react'
import { ProtectedDataList } from './ProtectedDataList'
import { MinimalDataList } from './MinimalDataList'
import { DataCollectionNote } from './DataCollectionNote'

export const DataPrivacyTable = (): React.ReactNode => (
  <motion.div
    className='mb-20'
    initial={{ opacity: 0, y: 30 }}
    transition={{ delay: 0.3, duration: 0.8 }}
    viewport={{ once: true }}
    whileInView={{ opacity: 1, y: 0 }}
  >
    <Card className='border-border bg-card border-2 shadow-xl'>
      <CardContent className='p-8'>
        <div className='mb-8 text-center'>
          <Eye className='text-primary mx-auto mb-4 h-12 w-12' />
          <h3 className='mb-4 text-2xl md:text-3xl'>What We Do & Don&apos;t Collect</h3>
          <p className='text-muted-foreground'>Complete transparency about data collection and usage</p>
        </div>

        <div className='grid grid-cols-1 gap-8 md:grid-cols-2'>
          <ProtectedDataList />
          <MinimalDataList />
        </div>

        <DataCollectionNote />
      </CardContent>
    </Card>
  </motion.div>
)

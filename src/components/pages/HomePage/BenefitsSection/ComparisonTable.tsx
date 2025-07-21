'use client'

import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { TableHeader } from './TableHeader'
import { ComparisonRowComponent } from './ComparisonRowComponent'
import { comparisonData } from './benefitsData'

export const ComparisonTable = (): React.ReactNode => (
  <motion.div
    className='mx-auto max-w-4xl'
    initial={{ opacity: 0, y: 30 }}
    transition={{ delay: 0.3, duration: 0.8 }}
    viewport={{ once: true }}
    whileInView={{ opacity: 1, y: 0 }}
  >
    <Card className='border-border bg-card border-2 shadow-xl'>
      <CardContent className='p-8'>
        <h3 className='mb-8 text-center text-2xl md:text-3xl'>Traditional vs. Web3 Approach</h3>

        <div className='overflow-x-auto'>
          <table className='w-full'>
            <TableHeader />
            <tbody>
              {comparisonData.map((row, index) => (
                <ComparisonRowComponent index={index} key={index} row={row} />
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  </motion.div>
)

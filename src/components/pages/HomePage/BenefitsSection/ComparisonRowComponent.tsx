'use client'

import { motion } from 'framer-motion'
import type { ComparisonRow } from './benefitsData'

interface ComparisonRowProps {
  row: ComparisonRow
  index: number
}

export const ComparisonRowComponent = ({ row, index }: ComparisonRowProps): React.ReactNode => (
  <motion.tr
    className='border-border/50 hover:bg-muted/20 border-b transition-colors duration-300'
    initial={{ opacity: 0, x: -20 }}
    transition={{ delay: 0.1 * index, duration: 0.4 }}
    viewport={{ once: true }}
    whileInView={{ opacity: 1, x: 0 }}
  >
    <td className='px-4 py-4 font-medium'>{row.feature}</td>
    <td className='text-muted-foreground px-4 py-4 text-center text-sm'>{row.traditional}</td>
    <td className='text-primary px-4 py-4 text-center text-sm'>{row.cryptoForge}</td>
    <td className='text-secondary px-4 py-4 text-center text-sm'>{row.benefit}</td>
  </motion.tr>
)

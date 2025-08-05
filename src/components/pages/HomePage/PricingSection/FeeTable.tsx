'use client'

import { motion } from 'framer-motion'
import { Calculator } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody } from '@/components/ui/table'
import { FeeTableHeader } from './FeeTableHeader'
import { ServiceRow } from './ServiceRow'
import { useServiceFees } from './useServiceFees'

export const FeeTable = (): React.ReactNode => {
  // Get service fees from client-side store
  const servicesFees = useServiceFees()

  return (
    <motion.div
      className='mb-16'
      initial={{ opacity: 0, y: 30 }}
      transition={{ delay: 0.3, duration: 0.8 }}
      viewport={{ once: true }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <Card className='border-border bg-card overflow-hidden border-2 shadow-xl'>
        <CardHeader className='from-primary/5 to-secondary/5 border-border border-b bg-gradient-to-r'>
          <CardTitle className='text-center'>
            <div className='flex items-center justify-center space-x-3'>
              <Calculator className='text-primary h-6 w-6' />
              <span>Service Fees Breakdown</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className='p-0'>
          <div className='overflow-x-auto'>
            <Table>
              <FeeTableHeader />
              <TableBody>
                {servicesFees.map((service, index) => (
                  <ServiceRow index={index} key={service.service} service={service} />
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

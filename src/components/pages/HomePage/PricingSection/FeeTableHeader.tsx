'use client'

import { TableHead, TableHeader, TableRow } from '@/components/ui/table'

export const FeeTableHeader = (): React.ReactNode => (
  <TableHeader>
    <TableRow className='border-border border-b-2'>
      <TableHead className='px-6 py-4 text-left font-medium'>Service</TableHead>
      <TableHead className='px-4 py-4 text-center font-medium'>Platform Fee</TableHead>
      <TableHead className='px-4 py-4 text-center font-medium'>Est. Network Fee</TableHead>
      <TableHead className='px-4 py-4 text-center font-medium'>Complexity</TableHead>
      <TableHead className='px-4 py-4 text-center font-medium'>Status</TableHead>
    </TableRow>
  </TableHeader>
)

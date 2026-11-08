import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { type PrivacyTableData } from './privacyData'

interface PrivacyTableProps {
  table: PrivacyTableData
}

/**
 * Scrollable reference table for the Privacy Policy (purposes and recipients).
 *
 * @param props.table - Caption, column headers and rows.
 * @returns Table element.
 */
export const PrivacyTable = ({ table }: PrivacyTableProps): React.ReactNode => (
  <Table className='text-muted-foreground min-w-[640px]'>
    <TableCaption>{table.caption}</TableCaption>
    <TableHeader>
      <TableRow>
        {table.columns.map((column) => (
          <TableHead key={column}>{column}</TableHead>
        ))}
      </TableRow>
    </TableHeader>
    <TableBody>
      {table.rows.map((row) => (
        <TableRow key={row[0]}>
          {row.map((cell, index) => (
            <TableCell className='align-top whitespace-normal' key={table.columns[index]}>
              {cell}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  </Table>
)

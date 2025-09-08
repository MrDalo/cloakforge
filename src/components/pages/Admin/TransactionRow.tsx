import { TableCell, TableRow } from '../../ui/table'
import { Button } from '../../ui/button'
import { ExternalLink } from 'lucide-react'
import { Badge } from '../../ui/badge'
import { formatServiceIdentifier, formatTimestamp, truncateAddress } from '@/lib/utils/transactionUtils'
import { TransactionData } from '@/hooks/queries/useAdminTransactionsQuery'

interface TransactionRowProps {
  transaction: TransactionData
}

const TransactionRow = ({ transaction }: TransactionRowProps): React.ReactNode => (
  <TableRow className='hover:bg-muted/50' key={transaction.signature}>
    <TableCell>
      <div className='flex items-center gap-2'>
        <code className='bg-muted rounded px-2 py-1 text-xs'>{truncateAddress(transaction.signature, 8, 8)}</code>
        <Button asChild className='h-6 w-6' size='icon' variant='ghost'>
          <a
            href={`https://explorer.solana.com/tx/${transaction.signature}`}
            rel='noopener noreferrer'
            target='_blank'
            title='View on Solana Explorer'
          >
            <ExternalLink className='h-3 w-3' />
          </a>
        </Button>
      </div>
    </TableCell>

    <TableCell>
      <div className='flex items-center gap-2'>
        <code className='bg-muted rounded px-2 py-1 text-xs'>{truncateAddress(transaction.payerPublicKey)}</code>
        <Button asChild className='h-6 w-6' size='icon' variant='ghost'>
          <a
            href={`https://explorer.solana.com/address/${transaction.payerPublicKey}`}
            rel='noopener noreferrer'
            target='_blank'
            title='View Payer on Solana Explorer'
          >
            <ExternalLink className='h-3 w-3' />
          </a>
        </Button>
      </div>
    </TableCell>

    <TableCell className='text-right font-medium'>
      <span className='text-green-600'>{parseFloat(transaction.serviceFeeSOL.toFixed(6)).toString()} SOL</span>
    </TableCell>

    <TableCell>
      {transaction.serviceIdentifier && (
        <Badge className='text-xs' variant='secondary'>
          {formatServiceIdentifier(transaction.serviceIdentifier)}
        </Badge>
      )}
    </TableCell>

    <TableCell className='text-muted-foreground text-sm'>{formatTimestamp(transaction.blockTime)}</TableCell>
  </TableRow>
)

export default TransactionRow

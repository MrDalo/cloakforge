import { TableCell, TableRow } from '../../ui/table'
import { Button } from '../../ui/button'
import { ExternalLink } from 'lucide-react'
import { Badge } from '../../ui/badge'
import { formatServiceIdentifier, formatTimestamp, truncateAddress } from '@/lib/utils/transactionUtils'
import { TransactionData } from '@/hooks/queries/useAdminTransactionsQuery'
import { type ServiceIdentifier } from '@/lib/solana/serviceMemo'

interface TransactionRowProps {
  transaction: TransactionData
}

/**
 * Service Badge Component with color coding
 */
const ServiceBadge = ({ serviceId }: { serviceId: ServiceIdentifier }): React.ReactNode => {
  const badgeProps = getServiceBadgeProps(serviceId)
  return (
    <Badge className={`text-xs ${badgeProps.className || ''}`} variant={badgeProps.variant}>
      {formatServiceIdentifier(serviceId)}
    </Badge>
  )
}
const getServiceBadgeProps = (
  serviceId: ServiceIdentifier
): { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string } => {
  const serviceStyleMap: Record<ServiceIdentifier, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
    'token-creator-service': {
      variant: 'default',
      className:
        'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
    },
    'burn-tokens-service': {
      variant: 'destructive',
      className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
    },
    'freeze-wallets-service': {
      variant: 'outline',
      className:
        'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
    },
    'unfreeze-wallets-service': {
      variant: 'secondary',
      className: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    },
    'authority-management-service': {
      variant: 'outline',
      className:
        'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
    },
    'transaction-multisender-service': {
      variant: 'secondary',
      className:
        'bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
    },
    'create-liquidity-service': {
      variant: 'default',
      className: 'bg-teal-100 text-teal-800 border-teal-200 hover:bg-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800',
    },
    'portfolio-tracker-service': {
      variant: 'outline',
      className: 'bg-cyan-100 text-cyan-800 border-cyan-200 hover:bg-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800',
    },
  }

  return serviceStyleMap[serviceId] || { variant: 'secondary' as const }
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
      {transaction.serviceIdentifier && <ServiceBadge serviceId={transaction.serviceIdentifier as ServiceIdentifier} />}
    </TableCell>

    <TableCell className='text-muted-foreground text-sm'>{formatTimestamp(transaction.blockTime)}</TableCell>
  </TableRow>
)

export default TransactionRow

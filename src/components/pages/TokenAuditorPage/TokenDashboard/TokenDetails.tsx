'use client'

import { motion } from 'framer-motion'
import { Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import type { TokenAuditReport } from '@/types/tokenAudit'
import { AddressValue } from './AddressValue'

interface TokenDetailsProps {
  report: TokenAuditReport
}

const metadataSourceLabels = {
  'token-2022': 'Token-2022 metadata extension',
  metaplex: 'Metaplex metadata account',
} as const

const DetailRow = ({ label, children }: { label: string; children: React.ReactNode }): React.ReactNode => (
  <div className='flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between'>
    <Label className='text-sm font-medium'>{label}</Label>
    <div className='min-w-0 text-sm break-all sm:text-right'>{children}</div>
  </div>
)

/** Metadata (as self-reported by the creator) and on-chain authorities. */
export const TokenDetails = ({ report }: TokenDetailsProps): React.ReactNode => {
  const { metadata, extensions } = report

  return (
    <motion.div animate={{ opacity: 1, x: 0 }} initial={{ opacity: 0, x: -30 }} transition={{ duration: 0.8 }}>
      <Card className='border-border h-full border-2'>
        <CardHeader className='from-primary/5 to-secondary/5 border-border border-b bg-gradient-to-r'>
          <CardTitle className='flex items-center space-x-2'>
            <Info className='text-primary h-5 w-5' />
            <span>Token Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4 p-6'>
          <p className='text-muted-foreground text-xs'>Name, symbol and URI are set by the token creator and are not verified.</p>
          <DetailRow label='Name'>{metadata?.name || <span className='text-muted-foreground'>Not set</span>}</DetailRow>
          <DetailRow label='Symbol'>{metadata?.symbol || <span className='text-muted-foreground'>Not set</span>}</DetailRow>
          <DetailRow label='Metadata source'>
            {metadata ? metadataSourceLabels[metadata.source] : <span className='text-muted-foreground'>None found</span>}
          </DetailRow>
          {metadata?.uri && (
            <DetailRow label='Metadata URI'>
              <span className='font-mono text-xs'>{metadata.uri}</span>
            </DetailRow>
          )}
          {metadata && (
            <DetailRow label='Metadata update authority'>
              <AddressValue address={metadata.isMutable ? metadata.updateAuthority : null} emptyLabel='Locked' />
            </DetailRow>
          )}
          {report.externalMetadataAddress && (
            <DetailRow label='External metadata account'>
              <AddressValue address={report.externalMetadataAddress} />
            </DetailRow>
          )}
          {extensions?.metadataPointer && (
            <DetailRow label='Metadata pointer authority'>
              <AddressValue address={extensions.metadataPointer.authority} />
            </DetailRow>
          )}
          <DetailRow label='Mint authority'>
            <AddressValue address={report.mintAuthority} />
          </DetailRow>
          <DetailRow label='Freeze authority'>
            <AddressValue address={report.freezeAuthority} />
          </DetailRow>
          {extensions && (
            <DetailRow label='Token-2022 extensions'>
              {extensions.present.length > 0 ? extensions.present.join(', ') : <span className='text-muted-foreground'>None</span>}
            </DetailRow>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

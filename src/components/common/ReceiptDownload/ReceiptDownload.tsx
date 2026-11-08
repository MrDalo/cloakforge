'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useComplianceStore } from '@/lib/compliance/consentStore'
import { downloadReceipt, getReceiptToolName } from '@/lib/compliance/receipt'

interface ReceiptDownloadProps {
  toolId: string
}

/**
 * Success-state block that offers the confirmation receipt (durable medium, CRD Art. 8(7)) once a
 * paid action has been confirmed on-chain. Renders nothing before that.
 */
export const ReceiptDownload = ({ toolId }: ReceiptDownloadProps): React.ReactNode => {
  const receipt = useComplianceStore((state) => state.receipts[toolId])
  const [isDownloading, setIsDownloading] = useState(false)

  if (!receipt) return null

  const handleDownload = async (): Promise<void> => {
    setIsDownloading(true)
    try {
      await downloadReceipt(receipt)
    } catch {
      toast.error('Could not create the confirmation file. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className='bg-success/10 border-success/30 space-y-3 rounded-lg border p-4' role='status'>
      <p className='text-sm font-medium'>
        {getReceiptToolName(toolId)} confirmed. Download your confirmation and keep it: it contains your transaction details, your consent
        and the full Terms of Service you accepted.
      </p>
      <Button disabled={isDownloading} onClick={handleDownload} size='sm' type='button' variant='outline'>
        <Download className='mr-2 h-4 w-4' />
        {isDownloading ? 'Preparing...' : 'Download confirmation'}
      </Button>
    </div>
  )
}

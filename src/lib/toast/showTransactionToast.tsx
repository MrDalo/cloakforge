'use client'
import { ExplorerLink } from '@/components/common/ExplorerLink'
import React from 'react'
import { toast } from 'sonner'

export const showTransactionToast = (signature: string): void => {
  toast.success(
    <div className='text-center'>
      <div className='text-lg'>Transaction sent</div>
      <ExplorerLink
        className='btn btn-xs btn-primary'
        label='View Transaction'
        path={`tx/${signature}`}
      />
    </div>
  )
}

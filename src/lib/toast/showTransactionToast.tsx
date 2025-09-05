'use client'
import { ExplorerLink } from '@/components/common/ExplorerLink'
import React from 'react'
import { toast } from 'sonner'

export const showTransactionToast = (signature: string, customMessage?: string): void => {
  toast.success(
    <div className='text-center'>
      <div className='text-lg'>{customMessage || 'Transaction sent'}</div>
      <ExplorerLink
        className='rounded-xl bg-white px-4 py-2 text-black hover:bg-gray-100'
        label='View Transaction'
        path={`tx/${signature}`}
      />
    </div>
  )
}

export const showTokenCreationToast = (signature: string, tokenName: string, mintAddress: string): void => {
  toast.success(
    <div className='space-y-2 text-center'>
      <div className='text-lg font-semibold'>Token &ldquo;{tokenName}&rdquo; created successfully! 🎉</div>
      <div className='flex flex-col space-y-2'>
        <ExplorerLink
          className='rounded-xl bg-white px-4 py-2 text-black hover:bg-gray-100'
          label='View Transaction'
          path={`tx/${signature}`}
        />
        <ExplorerLink
          className='rounded-xl bg-white px-4 py-2 text-black hover:bg-gray-100'
          label='View Token'
          path={`address/${mintAddress}`}
        />
      </div>
    </div>,
    {
      duration: 8000, // Show longer for token creation success
    }
  )
}

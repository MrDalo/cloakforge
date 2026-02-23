'use client'
import { ExplorerLink } from '@/components/common/ExplorerLink'
import { toast } from 'sonner'

export const showTransactionToast = (signature: string, customMessage?: string): void => {
  toast.success(
    <div className='flex w-full flex-1 flex-col gap-2 pr-1 text-center'>
      <div className='text-lg'>{customMessage || 'Transaction sent'}</div>
      <div className='flex w-full items-center justify-center'>
        <ExplorerLink
          className='border-border inline-flex items-center justify-center gap-2 rounded-lg border bg-white px-4 py-2.5 font-medium text-black shadow-sm transition-colors hover:bg-gray-100'
          label='🔗 View Transaction'
          path={`tx/${signature}`}
        />
      </div>
    </div>,
    {
      duration: 8000,
      className: '[&_[data-content]]:w-full',
      classNames: {
        title: 'w-full',
      },
    }
  )
}

export const showTokenCreationToast = (signature: string, tokenName: string, mintAddress: string): void => {
  toast.success(
    <div className='w-full space-y-3 text-center'>
      <div className='text-lg font-semibold'>Token &ldquo;{tokenName}&rdquo; created successfully! 🎉</div>
      <div className='flex flex-col space-y-2'>
        <ExplorerLink
          className='border-border inline-flex items-center justify-center gap-2 rounded-lg border bg-white px-4 py-2.5 font-medium text-black shadow-sm transition-colors hover:bg-gray-100'
          label='📋 View Transaction'
          path={`tx/${signature}`}
        />
        <ExplorerLink
          className='border-border inline-flex items-center justify-center gap-2 rounded-lg border bg-white px-4 py-2.5 font-medium text-black shadow-sm transition-colors hover:bg-gray-100'
          label='🪙 View Token'
          path={`address/${mintAddress}`}
        />
      </div>
    </div>,
    {
      duration: 8000,
      className: '[&_[data-content]]:w-full',
      classNames: {
        title: 'w-full',
      },
    }
  )
}

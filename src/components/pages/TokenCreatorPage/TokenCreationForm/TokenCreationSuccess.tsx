'use client'

import React, { useState } from 'react'
import { CheckCircle, Copy, Check, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import type { TokenCreatorResult } from '@/hooks/solana/useTokenCreatorUnified'

interface TokenCreationSuccessProps {
  result: TokenCreatorResult
  onCreateAnother: () => void
}

export const TokenCreationSuccess = ({ result, onCreateAnother }: TokenCreationSuccessProps): React.ReactNode => {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopyMintAddress = async (): Promise<void> => {
    if (!result.mintAddress) return

    try {
      await navigator.clipboard.writeText(result.mintAddress)
      setIsCopied(true)
      toast.success('Mint address copied to clipboard!')
      setTimeout(() => setIsCopied(false), 2000)
    } catch {
      toast.error('Failed to copy mint address')
    }
  }

  const copyToClipboard = async (text: string, label: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied to clipboard!`)
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  const openInExplorer = (type: 'transaction' | 'token', address: string): void => {
    const baseUrl = 'https://solscan.io'
    const path = type === 'transaction' ? 'tx' : 'token'
    window.open(`${baseUrl}/${path}/${address}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <Card className='border-border bg-white'>
      <CardHeader className='text-center'>
        <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900'>
          <CheckCircle className='h-8 w-8 text-green-600 dark:text-green-400' />
        </div>
        <CardTitle className='text-black'>Token Created Successfully!</CardTitle>
        <p className='text-black'>
          Your {result.tokenName} ({result.tokenSymbol}) token has been created on the Solana blockchain.
        </p>
      </CardHeader>

      <CardContent className='space-y-6'>
        {/* Token Address */}
        <div className='space-y-2'>
          <label className='text-sm font-medium text-black'>Token Mint Address</label>
          <div className='flex items-center gap-2'>
            <code className='bg-input/70 flex-1 rounded p-2 font-mono text-sm text-black'>{result.mintAddress}</code>
            <Button onClick={handleCopyMintAddress} size='sm' variant='outline'>
              {isCopied ? <Check className='h-4 w-4' /> : <Copy className='h-4 w-4' />}
            </Button>
            <Button onClick={() => openInExplorer('token', result.mintAddress)} size='sm' variant='outline'>
              <ExternalLink className='h-4 w-4' />
            </Button>
          </div>
        </div>

        {/* Transaction Signature */}
        <div className='space-y-2'>
          <label className='text-sm font-medium text-black'>Transaction Signature</label>
          <div className='flex items-center gap-2'>
            <code className='bg-input/70 flex-1 rounded p-2 font-mono text-sm text-black'>{result.transactionSignature}</code>
            <Button onClick={() => copyToClipboard(result.transactionSignature, 'Transaction signature')} size='sm' variant='outline'>
              <Copy className='h-4 w-4' />
            </Button>
            <Button onClick={() => openInExplorer('transaction', result.transactionSignature)} size='sm' variant='outline'>
              <ExternalLink className='h-4 w-4' />
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex flex-col gap-3 pt-4 sm:flex-row'>
          <Button className='flex-1' onClick={onCreateAnother} variant='outline'>
            Create Another Token
          </Button>
          <Button className='flex-1' onClick={() => openInExplorer('token', result.mintAddress)} variant='default'>
            View on Solscan
          </Button>
        </div>

        {/* Next Steps */}
        <div className='bg-success/80 rounded-lg p-4 dark:bg-green-900'>
          <h4 className='mb-2 font-medium text-green-800 dark:text-green-200'>Next Steps</h4>
          <ul className='space-y-1 text-sm text-green-700 dark:text-green-300'>
            <li>• Add your token to wallet using the mint address</li>
            <li>• Create liquidity pools on DEXs like Raydium or Orca</li>
            <li>• Share your token address with your community</li>
            <li>• Consider using our other tools for token management</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

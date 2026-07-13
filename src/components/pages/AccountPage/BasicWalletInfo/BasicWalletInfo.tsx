/* eslint-disable react/jsx-max-depth */
'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExternalLink, RefreshCw, Copy, Eye, Search } from 'lucide-react'
import type { WalletData } from '../types'
import { toast } from 'sonner'
import { copyAddress } from '@/lib/utils/walletUtils'

interface BasicWalletInfoProps {
  walletData: WalletData
  onRefresh?: () => void
}

const BasicWalletInfo: React.FC<BasicWalletInfoProps> = ({ walletData, onRefresh }) => {
  const [isLoading, setIsLoading] = React.useState(false)

  const handleRefresh = (): void => {
    if (onRefresh) {
      setIsLoading(true)
      onRefresh()
      // Reset loading state after a short delay to show feedback
      setTimeout(() => setIsLoading(false), 1000)
    }
  }

  const handleCopyAddress = (): void => {
    copyAddress(walletData.address)
      .then(() => toast.success('Address copied to clipboard'))
      .catch(() => toast.error('Failed to copy address'))
  }

  const explorerLinks = [
    {
      name: 'Solscan',
      url: `https://solscan.io/account/${walletData.address}`,
      icon: Search,
      description: 'View on Solscan Explorer',
    },
    {
      name: 'Solana Explorer',
      url: `https://explorer.solana.com/address/${walletData.address}`,
      icon: Eye,
      description: 'View on Official Solana Explorer',
    },
  ]

  return (
    <section className='px-6 py-16'>
      <div className='container mx-auto max-w-6xl'>
        <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 30 }} transition={{ delay: 0.4, duration: 0.8 }}>
          <div className='mb-6 flex items-center justify-between'>
            <h2 className='text-2xl font-bold'>Wallet Information</h2>
            <Button className='border-primary/20 hover:border-primary/40' disabled={isLoading} onClick={handleRefresh} variant='outline'>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            {/* Basic Info Card */}
            <Card className='hover:border-primary/20 border-2 transition-all duration-300'>
              <CardHeader>
                <CardTitle className='flex items-center space-x-2'>
                  <span>Account Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <p className='text-muted-foreground text-sm'>Wallet Address</p>
                  <div className='mt-1 flex items-center space-x-2'>
                    <code className='bg-muted flex-1 rounded px-2 py-1 font-mono text-sm'>{walletData.address}</code>
                    <Button onClick={handleCopyAddress} size='sm' variant='outline'>
                      <Copy className='h-4 w-4' />
                    </Button>
                  </div>
                </div>

                <div>
                  <p className='text-muted-foreground text-sm'>SOL Balance</p>
                  <p className='text-lg font-semibold'>{walletData.solBalance.toFixed(6)} SOL</p>
                  <p className='text-muted-foreground text-sm'>≈ ${walletData.totalValue.toFixed(2)} USD</p>
                </div>
              </CardContent>
            </Card>

            {/* Explorer Links Card */}
            <Card className='hover:border-primary/20 border-2 transition-all duration-300'>
              <CardHeader>
                <CardTitle className='flex items-center space-x-2'>
                  <span>Blockchain Explorers</span>
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <p className='text-muted-foreground text-sm'>
                  View detailed transaction history, token balances, and account activity on blockchain explorers.
                </p>

                {explorerLinks.map((explorer) => (
                  <Button asChild className='w-full justify-between' key={explorer.name} variant='outline'>
                    <a href={explorer.url} rel='noopener noreferrer' target='_blank'>
                      <div className='flex items-center space-x-2'>
                        <explorer.icon className='h-4 w-4' />
                        <div className='text-left'>
                          <p className='font-medium'>{explorer.name}</p>
                          <p className='text-muted-foreground text-xs'>{explorer.description}</p>
                        </div>
                      </div>
                      <ExternalLink className='h-4 w-4' />
                    </a>
                  </Button>
                ))}

                <div className='border-muted bg-muted/50 mt-4 rounded-lg border p-4'>
                  <h4 className='mb-2 text-sm font-medium'>Why use explorers?</h4>
                  <ul className='text-muted-foreground space-y-1 text-xs'>
                    <li>• View complete transaction history</li>
                    <li>• Check SPL token balances and metadata</li>
                    <li>• Monitor NFT collections and transfers</li>
                    <li>• Analyze DeFi protocol interactions</li>
                    <li>• Verify transaction status and details</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default BasicWalletInfo

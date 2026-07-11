'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, AlertCircle, ScanEye, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { isValidSolanaAddress } from '@/lib/solana'
import InfoTooltip from '@/components/common/InfoTooltip'

const FormHeader = (): React.ReactNode => (
  <CardHeader className='from-primary/5 to-secondary/5 border-border border-b bg-linear-to-r'>
    <CardTitle className='text-center'>
      <div className='flex items-center justify-center space-x-3'>
        <ScanEye className='text-primary h-6 w-6' />
        <span>Audit Token</span>
      </div>
    </CardTitle>
  </CardHeader>
)

interface FormFieldsProps {
  tokenAddress: string
  error: string
  isLoading: boolean
  onTokenAddressChange: (value: string) => void
  onKeyPress: (e: React.KeyboardEvent) => void
  onAudit: () => void
}

const FormFields = ({ tokenAddress, error, isLoading, onTokenAddressChange, onKeyPress, onAudit }: FormFieldsProps): React.ReactNode => (
  <div className='space-y-6'>
    <div className='space-y-2'>
      <Label className='flex items-center gap-2' htmlFor='tokenAddress'>
        <span>Token Address *</span>
        <InfoTooltip info_description='Paste the mint address of the token you want to audit. The auditor checks its authorities, metadata, and holder distribution for potential red flags.' />
      </Label>
      <Input
        className='bg-input-background focus:border-primary border-2 font-mono text-sm'
        disabled={isLoading}
        id='tokenAddress'
        onChange={(e) => onTokenAddressChange(e.target.value)}
        onKeyPress={onKeyPress}
        placeholder='Enter SPL token address (e.g., EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v)'
        value={tokenAddress}
      />
      {error && (
        <p className='text-destructive flex items-center space-x-1 text-sm'>
          <AlertCircle className='h-4 w-4' />
          <span>{error}</span>
        </p>
      )}
    </div>

    <Button
      className='bg-primary hover:bg-primary-hover text-primary-foreground w-full rounded-xl py-4 shadow-lg transition-all duration-300 hover:shadow-xl'
      disabled={isLoading}
      onClick={onAudit}
    >
      <Search className='mr-3 h-5 w-5' />
      {isLoading ? 'Redirecting...' : 'Start Audit'}
    </Button>

    <PrivacyNotice />
  </div>
)

const PrivacyNotice = (): React.ReactNode => (
  <div className='bg-secondary/10 border-secondary/20 rounded-lg border p-4'>
    <div className='flex items-start space-x-3'>
      <Shield className='text-secondary mt-0.5 h-5 w-5' />
      <div>
        <h4 className='text-secondary mb-1 font-medium'>Privacy Protected</h4>
        <p className='text-muted-foreground text-sm'>
          Your token searches are not stored, logged, or tracked. Complete privacy guaranteed.
        </p>
      </div>
    </div>
  </div>
)

export const TokenAuditForm = (): React.ReactNode => {
  const router = useRouter()
  const [tokenAddress, setTokenAddress] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const validateTokenAddress = (address: string): boolean => isValidSolanaAddress(address)

  const handleAudit = async (): Promise<void> => {
    const trimmedAddress = tokenAddress.trim()

    if (!trimmedAddress) {
      setError('Please enter a valid token address')
      return
    }

    if (!validateTokenAddress(trimmedAddress)) {
      setError('Please enter a valid Solana token address')
      return
    }

    setError('')
    setIsLoading(true)

    // Navigate to the dynamic route
    router.push(`/tools/token-auditor/${trimmedAddress}`)
  }

  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      void handleAudit()
    }
  }

  return (
    <section className='px-6 py-16'>
      <div className='container mx-auto max-w-2xl'>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <Card className='border-border bg-card border-2 shadow-xl'>
            <FormHeader />
            <CardContent className='p-8'>
              <FormFields
                error={error}
                isLoading={isLoading}
                onAudit={handleAudit}
                onKeyPress={handleKeyPress}
                onTokenAddressChange={setTokenAddress}
                tokenAddress={tokenAddress}
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}

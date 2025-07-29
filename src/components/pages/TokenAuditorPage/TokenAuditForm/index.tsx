'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, AlertCircle, ScanEye, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { mockTokenData, type TokenData } from '../tokenAuditorData'

interface TokenAuditFormProps {
  onTokenData: (data: TokenData | null) => void
  onLoading: (loading: boolean) => void
}

export const TokenAuditForm = ({ onTokenData, onLoading }: TokenAuditFormProps): React.ReactNode => {
  const [tokenAddress, setTokenAddress] = useState('')
  const [error, setError] = useState('')

  const handleAudit = async (): Promise<void> => {
    if (!tokenAddress.trim()) {
      setError('Please enter a valid token address')
      return
    }

    setError('')
    onLoading(true)

    // Simulate API call
    setTimeout(() => {
      onTokenData(mockTokenData)
      onLoading(false)
    }, 2000)
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
            <CardHeader className='from-primary/5 to-secondary/5 border-border border-b bg-gradient-to-r'>
              <CardTitle className='text-center'>
                <div className='flex items-center justify-center space-x-3'>
                  <ScanEye className='text-primary h-6 w-6' />
                  <span>Audit Token</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className='p-8'>
              <div className='space-y-6'>
                <div className='space-y-2'>
                  <Label htmlFor='tokenAddress'>Token Address *</Label>
                  <Input
                    className='bg-input-background focus:border-primary border-2 font-mono text-sm'
                    id='tokenAddress'
                    onChange={(e) => setTokenAddress(e.target.value)}
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
                  onClick={handleAudit}
                >
                  <Search className='mr-3 h-5 w-5' />
                  Start Audit
                </Button>

                {/* Privacy Notice */}
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
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}

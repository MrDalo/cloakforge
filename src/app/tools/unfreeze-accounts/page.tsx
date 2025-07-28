'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Unlock, CheckCircle, RefreshCw, Search, DollarSign, Shield, Eye, Users, Key, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'

const UnfreezeAccounts = (): React.ReactNode => {
  const [selectedToken, setSelectedToken] = useState('')
  const [targetAccount, setTargetAccount] = useState('')
  const [unfreezeMode, setUnfreezeMode] = useState('single')
  const [batchAccounts, setBatchAccounts] = useState('')
  const [confirmUnfreeze, setConfirmUnfreeze] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Mock token data
  const userTokens = [
    {
      address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      name: 'MyToken',
      symbol: 'MYT',
      balance: '1,000,000',
      frozen: 45,
      active: 155,
    },
    {
      address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
      name: 'DeFi Token',
      symbol: 'DFT',
      balance: '500,000',
      frozen: 12,
      active: 88,
    },
  ]

  const selectedTokenData = userTokens.find((token) => token.address === selectedToken)

  const calculateFees = (): { baseFee: number; networkFee: number; total: number; accountCount: number } => {
    const baseFee = 0.005 // SOL
    const networkFee = 0.000005 // SOL per signature
    const accountCount = unfreezeMode === 'batch' ? batchAccounts.split('\n').filter((line) => line.trim()).length : 1
    const totalNetworkFee = networkFee * accountCount

    return {
      baseFee,
      networkFee: totalNetworkFee,
      total: baseFee + totalNetworkFee,
      accountCount,
    }
  }

  const fees = calculateFees()

  return (
    <div className='bg-background relative min-h-screen'>
      {/* Hero Section */}
      <section className='from-background via-background to-muted relative overflow-hidden bg-gradient-to-br px-6 py-16 md:py-20'>
        <div className='encrypted-pattern absolute inset-0 opacity-5' />
        <div className='relative z-10 container mx-auto max-w-6xl'>
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className='mb-12 text-center'
            initial={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.8 }}
          >
            {/* Feature Badge */}
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              className='bg-secondary/10 text-secondary mb-6 inline-flex items-center rounded-full px-4 py-2'
              initial={{ opacity: 0, scale: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Unlock className='mr-2 h-4 w-4' />
              <span className='text-sm'>Account Restoration</span>
            </motion.div>

            {/* Main Title */}
            <motion.h1
              animate={{ opacity: 1, y: 0 }}
              className='mb-6 text-4xl leading-tight md:text-5xl lg:text-6xl'
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <span className='from-secondary to-primary bg-gradient-to-r bg-clip-text text-transparent'>Unfreeze Accounts</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className='text-muted-foreground mx-auto mb-8 max-w-3xl text-lg md:text-xl'
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              Restore full functionality to frozen accounts. Quickly unfreeze individual or multiple accounts to resume normal token
              operations and trading.
            </motion.p>

            {/* Key Features */}
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className='mx-auto grid max-w-4xl gap-6 md:grid-cols-4'
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              {[
                { icon: RefreshCw, title: 'Instant Restoration', desc: 'Immediate account reactivation' },
                { icon: Users, title: 'Batch Operations', desc: 'Unfreeze multiple accounts' },
                { icon: Eye, title: 'Status Monitoring', desc: 'Live account tracking' },
                { icon: CheckCircle, title: 'Full Control', desc: 'Complete operational flexibility' },
              ].map((feature, index) => (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className='text-center'
                  initial={{ opacity: 0, y: 20 }}
                  key={feature.title}
                  transition={{ delay: 0.6 + index * 0.1, duration: 0.6 }}
                >
                  <div className='bg-secondary/10 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl'>
                    <feature.icon className='text-secondary h-6 w-6' />
                  </div>
                  <h3 className='mb-2 font-medium'>{feature.title}</h3>
                  <p className='text-muted-foreground text-sm'>{feature.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Form Section */}
      <section className='px-6 py-16'>
        <div className='container mx-auto max-w-4xl'>
          <motion.div
            className='mb-12'
            initial={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <Card className='border-border hover:border-secondary/20 border-2 transition-all duration-300'>
              <CardHeader className='pb-6'>
                <div className='flex items-center space-x-3'>
                  <div className='bg-secondary/10 flex h-10 w-10 items-center justify-center rounded-xl'>
                    <Unlock className='text-secondary h-5 w-5' />
                  </div>
                  <div>
                    <CardTitle className='text-2xl'>Unfreeze Token Accounts</CardTitle>
                    <p className='text-muted-foreground mt-1'>Restore full functionality and resume token operations</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className='space-y-8'>
                {/* Important Notice */}
                <Alert className='border-secondary/20 bg-secondary/5'>
                  <CheckCircle className='text-secondary h-4 w-4' />
                  <AlertDescription className='text-secondary'>
                    <strong>Restoration Notice:</strong> Unfreezing accounts will immediately restore all transfer capabilities. Ensure
                    security issues have been resolved before unfreezing.
                  </AlertDescription>
                </Alert>

                {/* Token Selection */}
                <div className='space-y-4'>
                  <Label className='text-base'>Select Token to Manage</Label>
                  <Select onValueChange={setSelectedToken} value={selectedToken}>
                    <SelectTrigger className='h-12'>
                      <SelectValue placeholder='Choose a token from your connected wallet' />
                    </SelectTrigger>
                    <SelectContent>
                      {userTokens.map((token) => (
                        <SelectItem key={token.address} value={token.address}>
                          <div className='flex items-center space-x-3'>
                            <div className='bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full'>
                              <span className='text-primary text-xs font-medium'>{token.symbol.substring(0, 2)}</span>
                            </div>
                            <div>
                              <div className='font-medium'>
                                {token.name} ({token.symbol})
                              </div>
                              <div className='text-muted-foreground text-xs'>
                                {token.address.substring(0, 8)}...{token.address.substring(-8)}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedTokenData && (
                    <div className='bg-muted/30 grid gap-4 rounded-lg p-4 md:grid-cols-3'>
                      <div className='text-center'>
                        <div className='text-lg font-medium'>{selectedTokenData.balance}</div>
                        <div className='text-muted-foreground text-sm'>Total Supply</div>
                      </div>
                      <div className='text-center'>
                        <div className='text-secondary text-lg font-medium'>{selectedTokenData.active}</div>
                        <div className='text-muted-foreground text-sm'>Active Accounts</div>
                      </div>
                      <div className='text-center'>
                        <div className='text-warning text-lg font-medium'>{selectedTokenData.frozen}</div>
                        <div className='text-muted-foreground text-sm'>Frozen Accounts</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Unfreeze Mode Selection */}
                <div className='space-y-4'>
                  <Label className='text-base'>Unfreeze Mode</Label>
                  <div className='grid gap-4 md:grid-cols-2'>
                    <Card
                      className={`cursor-pointer transition-all duration-200 ${
                        unfreezeMode === 'single' ? 'border-secondary bg-secondary/5 shadow-lg' : 'border-border hover:border-secondary/30'
                      }`}
                      onClick={() => setUnfreezeMode('single')}
                    >
                      <CardContent className='p-4 text-center'>
                        <Unlock className='text-secondary mx-auto mb-2 h-8 w-8' />
                        <h3 className='mb-1 font-medium'>Single Account</h3>
                        <p className='text-muted-foreground text-sm'>Unfreeze one specific account</p>
                      </CardContent>
                    </Card>

                    <Card
                      className={`cursor-pointer transition-all duration-200 ${
                        unfreezeMode === 'batch' ? 'border-secondary bg-secondary/5 shadow-lg' : 'border-border hover:border-secondary/30'
                      }`}
                      onClick={() => setUnfreezeMode('batch')}
                    >
                      <CardContent className='p-4 text-center'>
                        <Users className='text-secondary mx-auto mb-2 h-8 w-8' />
                        <h3 className='mb-1 font-medium'>Batch Unfreeze</h3>
                        <p className='text-muted-foreground text-sm'>Unfreeze multiple accounts</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Account Input */}
                {unfreezeMode === 'single' ? (
                  <div className='space-y-4'>
                    <Label className='text-base'>Target Account Address</Label>
                    <div className='relative'>
                      <Input
                        className='h-12 pr-12'
                        onChange={(e) => setTargetAccount(e.target.value)}
                        placeholder='Enter frozen account address to unfreeze'
                        value={targetAccount}
                      />
                      <Button className='absolute top-1/2 right-2 -translate-y-1/2 transform' size='sm' variant='ghost'>
                        <Search className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className='space-y-4'>
                    <Label className='text-base'>Frozen Account Addresses (One per line)</Label>
                    <Textarea
                      className='min-h-32'
                      onChange={(e) => setBatchAccounts(e.target.value)}
                      placeholder='Paste frozen account addresses here, one per line...'
                      value={batchAccounts}
                    />
                    {batchAccounts && (
                      <div className='text-muted-foreground text-sm'>
                        {batchAccounts.split('\n').filter((line) => line.trim()).length} accounts to unfreeze
                      </div>
                    )}
                  </div>
                )}

                {/* Confirmation */}
                <div className='space-y-4'>
                  <div className='flex items-center space-x-3'>
                    <Switch checked={confirmUnfreeze} id='confirm-unfreeze' onCheckedChange={setConfirmUnfreeze} />
                    <Label className='text-base' htmlFor='confirm-unfreeze'>
                      I confirm that security issues have been resolved and these accounts are safe to unfreeze
                    </Label>
                  </div>
                </div>

                {/* Fee Calculation */}
                <Card className='bg-muted/30 border-primary/20'>
                  <CardContent className='p-6'>
                    <div className='mb-4 flex items-center space-x-3'>
                      <DollarSign className='text-primary h-5 w-5' />
                      <h3 className='font-medium'>Transaction Fees</h3>
                    </div>

                    <div className='space-y-3'>
                      <div className='flex items-center justify-between'>
                        <span className='text-muted-foreground'>Platform Fee</span>
                        <span className='font-medium'>{fees.baseFee} SOL</span>
                      </div>
                      <div className='flex items-center justify-between'>
                        <span className='text-muted-foreground'>
                          Network Fee ({fees.accountCount} account{fees.accountCount !== 1 ? 's' : ''})
                        </span>
                        <span className='font-medium'>{fees.networkFee.toFixed(6)} SOL</span>
                      </div>
                      <Separator />
                      <div className='flex items-center justify-between text-lg'>
                        <span className='font-medium'>Total Cost</span>
                        <span className='text-primary font-medium'>{fees.total.toFixed(6)} SOL</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Button */}
                <Button
                  className='bg-secondary hover:bg-secondary/90 text-secondary-foreground h-12 w-full'
                  disabled={
                    !selectedToken ||
                    (!targetAccount && unfreezeMode === 'single') ||
                    (!batchAccounts && unfreezeMode === 'batch') ||
                    !confirmUnfreeze ||
                    isLoading
                  }
                  onClick={() => setIsLoading(true)}
                  size='lg'
                >
                  {isLoading ? (
                    <div className='flex items-center space-x-2'>
                      <div className='border-secondary-foreground/30 border-t-secondary-foreground h-4 w-4 animate-spin rounded-full border-2' />
                      <span>Unfreezing Accounts...</span>
                    </div>
                  ) : (
                    <div className='flex items-center space-x-2'>
                      <Unlock className='h-5 w-5' />
                      <span>Unfreeze Account{unfreezeMode === 'batch' ? 's' : ''}</span>
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className='bg-muted/30 px-6 py-16'>
        <div className='container mx-auto max-w-4xl'>
          <motion.div
            className='mb-12 text-center'
            initial={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <h2 className='mb-4 text-3xl md:text-4xl'>
              <span className='from-secondary to-primary bg-gradient-to-r bg-clip-text text-transparent'>Frequently Asked Questions</span>
            </h2>
            <p className='text-muted-foreground mx-auto max-w-2xl text-lg'>
              Learn more about account unfreezing and restoring normal token operations
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <Accordion className='space-y-4' collapsible type='single'>
              {[
                {
                  id: 'what-is-unfreezing',
                  question: 'What happens when I unfreeze an account?',
                  answer:
                    'Unfreezing immediately restores all transfer capabilities for the account. The account holder can then send and receive tokens normally. This reverses the effects of account freezing completely.',
                },
                {
                  id: 'security-verification',
                  question: 'Should I verify security before unfreezing?',
                  answer:
                    'Yes, always ensure that any security issues that led to the original freeze have been resolved. Verify that compromised keys have been changed and that the account is secure before restoration.',
                },
                {
                  id: 'immediate-effect',
                  question: 'Do changes take effect immediately?',
                  answer:
                    'Yes, unfreezing takes effect immediately once the transaction is confirmed on the blockchain. The account will be able to participate in transfers right away.',
                },
                {
                  id: 'batch-efficiency',
                  question: 'Is batch unfreezing more efficient?',
                  answer:
                    'Batch unfreezing is significantly more cost-effective for multiple accounts. You pay lower network fees per account and can restore many accounts in a single operation.',
                },
                {
                  id: 'who-can-unfreeze',
                  question: 'Who has permission to unfreeze accounts?',
                  answer:
                    'Only the designated freeze authority can unfreeze accounts. This is the same authority that has the power to freeze accounts and is set during token creation.',
                },
                {
                  id: 'monitoring-unfrozen',
                  question: 'How can I monitor unfrozen accounts?',
                  answer:
                    'You can track account status in real-time through our dashboard. Monitor transaction activity and account states to ensure everything is functioning normally after unfreezing.',
                },
              ].map((faq, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  key={faq.id}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  viewport={{ once: true }}
                  whileInView={{ opacity: 1, y: 0 }}
                >
                  <AccordionItem className='border-border bg-card rounded-lg border-2 px-6' value={faq.id}>
                    <AccordionTrigger className='py-6 hover:no-underline'>
                      <span className='text-left font-medium'>{faq.question}</span>
                    </AccordionTrigger>
                    <AccordionContent className='text-muted-foreground pb-6 leading-relaxed'>{faq.answer}</AccordionContent>
                  </AccordionItem>
                </motion.div>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className='px-6 py-16'>
        <div className='container mx-auto max-w-6xl'>
          <motion.div
            className='mb-16 text-center'
            initial={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <h2 className='mb-4 text-3xl md:text-4xl'>
              <span className='from-secondary to-primary bg-gradient-to-r bg-clip-text text-transparent'>
                Why Choose Crypto Forge for Account Restoration
              </span>
            </h2>
            <p className='text-muted-foreground mx-auto max-w-3xl text-lg'>
              Professional tools for complete account lifecycle management and operational flexibility
            </p>
          </motion.div>

          <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
            {[
              {
                icon: RefreshCw,
                title: 'Instant Restoration',
                description:
                  'Immediately restore frozen accounts to full operational status. Quick response times for urgent account recovery needs.',
                color: 'secondary',
              },
              {
                icon: Users,
                title: 'Batch Efficiency',
                description:
                  'Unfreeze multiple accounts simultaneously with optimized batch operations. Perfect for large-scale account management.',
                color: 'primary',
              },
              {
                icon: Shield,
                title: 'Secure Operations',
                description:
                  'Built-in safety checks and confirmation requirements ensure accounts are only unfrozen when appropriate and secure.',
                color: 'secondary',
              },
              {
                icon: Eye,
                title: 'Real-time Monitoring',
                description:
                  'Track account status changes instantly. Monitor unfrozen accounts to ensure smooth transition back to normal operations.',
                color: 'primary',
              },
              {
                icon: Key,
                title: 'Authority Management',
                description: 'Full control over freeze authority operations. Comprehensive tools for responsible account state management.',
                color: 'secondary',
              },
              {
                icon: Zap,
                title: 'Rapid Response',
                description:
                  'Fast account restoration for time-sensitive situations. Minimize downtime and restore normal operations quickly.',
                color: 'primary',
              },
            ].map((benefit, index) => (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                key={benefit.title}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <Card className='border-border hover:border-primary/20 h-full border-2 transition-all duration-300'>
                  <CardContent className='p-8 text-center'>
                    <div className={`h-16 w-16 bg-${benefit.color}/10 mx-auto mb-6 flex items-center justify-center rounded-2xl`}>
                      <benefit.icon className={`h-8 w-8 text-${benefit.color}`} />
                    </div>
                    <h3 className='mb-4 text-xl font-medium'>{benefit.title}</h3>
                    <p className='text-muted-foreground leading-relaxed'>{benefit.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Trust Section */}
          <motion.div
            className='mt-16'
            initial={{ opacity: 0, y: 30 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <Card className='from-secondary/5 to-primary/5 border-secondary/10 border-2 bg-gradient-to-r'>
              <CardContent className='p-8 text-center md:p-12'>
                <CheckCircle className='text-secondary mx-auto mb-6 h-16 w-16' />
                <h3 className='mb-6 text-2xl font-medium md:text-3xl'>Complete Account Lifecycle Management</h3>
                <p className='text-muted-foreground mx-auto mb-8 max-w-3xl text-lg'>
                  From initial freezing to full restoration, Crypto Forge provides comprehensive tools for responsible account management.
                  Maintain security while preserving operational flexibility.
                </p>
                <div className='text-muted-foreground flex items-center justify-center space-x-2 text-sm'>
                  <Unlock className='h-4 w-4' />
                  <span>Crypto Forge - Flexible • Secure • Reliable</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default UnfreezeAccounts

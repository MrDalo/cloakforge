'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Shield,
  ShieldOff,
  Unlock,
  Lock,
  AlertTriangle,
  Wallet,
  Calculator,
  CheckCircle,
  Search,
  DollarSign,
  Sparkles,
  Code,
  Users,
  Heart,
  Key,
  HelpCircle,
  Eye,
  Zap,
  Award,
  Globe,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Alert, AlertDescription } from '@/components/ui/alert'

const features = [
  {
    icon: DollarSign,
    title: 'Lowest fees on the market',
    description: 'Just 0.015 SOL platform fee + network costs',
  },
  {
    icon: Shield,
    title: 'Build ultimate trust',
    description: 'Permanently give up freeze control to your community',
  },
  {
    icon: Sparkles,
    title: 'Instant execution',
    description: 'Revoke freeze authority in a single transaction',
  },
  {
    icon: Eye,
    title: 'Privacy-first: no tracking',
    description: 'No cookies, no analytics, no personal data stored',
  },
  {
    icon: Code,
    title: 'Simulation/devnet support',
    description: 'Test your revocation safely before mainnet execution',
  },
]

const faqData = [
  {
    question: 'What does freeze authority mean?',
    answer:
      'Freeze authority allows the token creator to freeze individual token accounts, preventing them from transferring tokens. This is typically used for compliance or security purposes.',
  },
  {
    question: 'Why would I want to revoke freeze authority?',
    answer:
      'Revoking freeze authority builds trust with your community by permanently giving up the ability to freeze token accounts. This demonstrates commitment to decentralization and user freedom.',
  },
  {
    question: 'Can I restore freeze authority after revoking it?',
    answer:
      'No, revoking freeze authority is completely irreversible. Once revoked, you will never be able to freeze any token accounts again, including your own.',
  },
  {
    question: 'Will this affect currently frozen accounts?',
    answer:
      'No, accounts that are already frozen will remain frozen. Revoking freeze authority only prevents you from freezing additional accounts in the future.',
  },
  {
    question: 'What are the fees for revoking freeze authority?',
    answer:
      'Our platform charges 0.015 SOL plus standard Solana network fees (typically ~0.003 SOL). There are no hidden fees or percentages.',
  },
  {
    question: 'Do I need to be the freeze authority to revoke it?',
    answer:
      'Yes, you must be the current freeze authority holder to revoke it. The transaction must be signed by the wallet that holds the freeze authority.',
  },
  {
    question: 'Can I test this on devnet first?',
    answer:
      'Absolutely! We highly recommend testing your freeze authority revocation on devnet first to ensure everything works as expected.',
  },
  {
    question: "Will this affect my token's mint authority?",
    answer:
      'No, revoking freeze authority is completely separate from mint authority. You can still mint new tokens if you retain mint authority.',
  },
]

const valueProps = [
  {
    icon: Heart,
    title: 'Build trust',
    description: 'Demonstrate commitment to your community and decentralization',
    highlight: 'Community First',
  },
  {
    icon: DollarSign,
    title: 'Lowest fees',
    description: 'Transparent pricing with no hidden costs or percentages',
    highlight: '0.015 SOL',
  },
  {
    icon: Zap,
    title: 'Instant execution',
    description: 'Revoke authority in a single, irreversible transaction',
    highlight: 'One-click',
  },
  {
    icon: Code,
    title: 'Devnet testing',
    description: 'Test thoroughly before mainnet execution',
    highlight: 'Test first',
  },
  {
    icon: Award,
    title: 'Verified process',
    description: 'Industry-standard security and best practices',
    highlight: 'Secure',
  },
]

const trustReasons = [
  {
    icon: Users,
    title: 'Community Confidence',
    description: 'Show your community you believe in decentralized principles',
  },
  {
    icon: Globe,
    title: 'Regulatory Clarity',
    description: 'Reduce regulatory concerns by giving up centralized control',
  },
  {
    icon: TrendingUp,
    title: 'Market Value',
    description: 'Tokens without freeze authority often have higher market confidence',
  },
]

const RevokeFreezeAuthorityPage = (): React.ReactNode => {
  const [formData, setFormData] = useState({
    tokenAddress: '',
    confirmRevoke: false,
    isValidToken: false,
    tokenInfo: null as unknown,
    understandIrreversible: false,
  })

  const [isConnected, setIsConnected] = useState(false)

  const calculateFees = (): { platform: number; network: number; total: number; originalPrice: number; savings: number } => {
    const platformFee = 0.015
    const networkFee = 0.003
    const total = platformFee + networkFee

    return {
      platform: platformFee,
      network: networkFee,
      total,
      originalPrice: 0.025, // Show crossed-out higher price
      savings: 0.007,
    }
  }

  const fees = calculateFees()

  return (
    <div className='bg-background relative'>
      {/* Hero Section */}
      <section className='from-background via-background to-muted relative overflow-hidden bg-gradient-to-br px-6 py-16 md:py-20'>
        {/* Background Elements */}
        <div className='absolute inset-0 overflow-hidden'>
          <motion.div
            animate={{
              x: [0, 60, 0],
              y: [0, -30, 0],
              rotate: [0, 15, 0],
            }}
            className='border-secondary/20 absolute top-20 left-20 flex h-16 w-16 items-center justify-center rounded-lg border-2'
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          >
            <Unlock className='text-secondary/40 h-6 w-6' />
          </motion.div>

          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.5, 0.2],
            }}
            className='bg-secondary/10 absolute right-1/4 bottom-20 h-32 w-32 rounded-full blur-xl'
            transition={{ duration: 6, repeat: Infinity }}
          />
        </div>

        <div className='relative z-10 container mx-auto max-w-6xl'>
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className='mb-12 text-center'
            initial={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.8 }}
          >
            {/* Page Title */}
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              className='bg-secondary/10 text-secondary mb-6 inline-flex items-center rounded-full px-4 py-2'
              initial={{ opacity: 0, scale: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <ShieldOff className='mr-2 h-4 w-4' />
              <span className='text-sm'>Freeze Authority</span>
            </motion.div>

            <motion.h1
              animate={{ opacity: 1, y: 0 }}
              className='mb-6 text-3xl leading-tight md:text-5xl lg:text-6xl'
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <span className='from-secondary to-primary bg-gradient-to-r bg-clip-text text-transparent'>Revoke Freeze Authority</span>
            </motion.h1>

            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className='text-muted-foreground mx-auto mb-8 max-w-3xl text-lg md:text-xl'
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              Build ultimate trust with your community by permanently giving up the ability to freeze token accounts. Demonstrate your
              commitment to decentralization and user freedom.
            </motion.p>
          </motion.div>

          {/* Feature Highlights */}
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className='mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5'
            initial={{ opacity: 0, y: 30 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className='group'
                  initial={{ opacity: 0, y: 20 }}
                  key={index}
                  transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                >
                  <Card className='hover:border-secondary/30 h-full border-2 text-center transition-all duration-300 hover:shadow-xl'>
                    <CardContent className='p-6'>
                      <motion.div
                        className='bg-secondary/10 group-hover:bg-secondary/20 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300'
                        transition={{ duration: 0.3 }}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <Icon className='text-secondary h-6 w-6' />
                      </motion.div>
                      <h3 className='group-hover:text-secondary mb-2 font-medium transition-colors duration-300'>{feature.title}</h3>
                      <p className='text-muted-foreground text-sm'>{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>

          {/* Trust Reasons */}
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className='grid grid-cols-1 gap-6 md:grid-cols-3'
            initial={{ opacity: 0, y: 30 }}
            transition={{ delay: 0.7, duration: 0.8 }}
          >
            {trustReasons.map((reason, index) => {
              const Icon = reason.icon
              return (
                <motion.div className='text-center' key={index} whileHover={{ scale: 1.02 }}>
                  <Card className='hover:border-primary/30 border-2 transition-all duration-300'>
                    <CardContent className='p-6'>
                      <Icon className='text-primary mx-auto mb-3 h-8 w-8' />
                      <h4 className='mb-2 font-medium'>{reason.title}</h4>
                      <p className='text-muted-foreground text-sm'>{reason.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* Revoke Authority Form */}
      <section className='px-6 py-16'>
        <div className='container mx-auto max-w-4xl'>
          <motion.div
            className='mb-12'
            initial={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <Card className='border-border bg-card border-2 shadow-xl'>
              <CardHeader className='from-secondary/5 to-primary/5 border-border border-b bg-gradient-to-r'>
                <CardTitle className='text-center'>
                  <div className='flex items-center justify-center space-x-3'>
                    <ShieldOff className='text-secondary h-6 w-6' />
                    <span className='font-medium'>Revoke Freeze Authority</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className='p-8'>
                <div className='space-y-8'>
                  {/* Warning Alert */}
                  <Alert className='border-warning/50 bg-warning/5'>
                    <AlertTriangle className='text-warning h-4 w-4' />
                    <AlertDescription className='text-warning'>
                      <strong>Important:</strong> Revoking freeze authority is permanent and irreversible. You will never be able to freeze
                      token accounts again, even your own.
                    </AlertDescription>
                  </Alert>

                  {/* Token Selection */}
                  <div className='space-y-6'>
                    <h3 className='flex items-center space-x-2 text-lg font-medium'>
                      <Search className='text-secondary h-5 w-5' />
                      <span>Token Selection</span>
                    </h3>

                    <div className='space-y-4'>
                      <div className='space-y-2'>
                        <Label htmlFor='tokenAddress'>Token Address *</Label>
                        <Input
                          className='bg-input-background focus:border-secondary border-2 font-mono text-sm'
                          id='tokenAddress'
                          onChange={(e) => setFormData((prev) => ({ ...prev, tokenAddress: e.target.value }))}
                          placeholder='Enter SPL token mint address'
                          value={formData.tokenAddress}
                        />
                        <p className='text-muted-foreground text-xs'>
                          Enter the mint address of the SPL token where you want to revoke freeze authority
                        </p>
                      </div>

                      {formData.tokenAddress && (
                        <motion.div
                          animate={{ opacity: 1, height: 'auto' }}
                          className='bg-muted/50 rounded-lg border p-4'
                          initial={{ opacity: 0, height: 0 }}
                        >
                          <div className='flex items-center space-x-3'>
                            <div className='bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full'>
                              <CheckCircle className='text-primary h-4 w-4' />
                            </div>
                            <div>
                              <p className='text-sm font-medium'>Token Found</p>
                              <p className='text-muted-foreground text-xs'>
                                Current Freeze Authority: Your wallet • Supply: 1,000,000 tokens
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Authority Status */}
                  <div className='space-y-6'>
                    <h3 className='flex items-center space-x-2 text-lg font-medium'>
                      <Key className='text-secondary h-5 w-5' />
                      <span>Authority Status</span>
                    </h3>

                    <div className='space-y-4'>
                      <Card className='bg-secondary/5 border-secondary/20'>
                        <CardContent className='p-6'>
                          <div className='space-y-3'>
                            <div className='flex items-center justify-between'>
                              <div className='flex items-center space-x-3'>
                                <Lock className='text-secondary h-5 w-5' />
                                <span className='font-medium'>Current Freeze Authority</span>
                              </div>
                              <Badge className='bg-secondary/10 text-secondary' variant='secondary'>
                                Active
                              </Badge>
                            </div>
                            <p className='text-muted-foreground text-sm'>
                              You currently have the ability to freeze and unfreeze token accounts
                            </p>

                            <div className='bg-background mt-4 rounded-lg border p-3'>
                              <div className='text-muted-foreground mb-1 text-xs'>Authority Address:</div>
                              <div className='font-mono text-sm break-all'>
                                {formData.tokenAddress ? '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU' : 'Connect wallet to view'}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <motion.div
                        animate={{ opacity: 1, height: 'auto' }}
                        className='bg-secondary/5 border-secondary/20 rounded-lg border p-4'
                        initial={{ opacity: 0, height: 0 }}
                      >
                        <div className='space-y-2'>
                          <div className='flex items-center space-x-2'>
                            <Unlock className='text-secondary h-4 w-4' />
                            <span className='text-sm font-medium'>After Revocation:</span>
                          </div>
                          <ul className='text-muted-foreground ml-6 space-y-1 text-sm'>
                            <li>• No one can freeze new token accounts</li>
                            <li>• Currently frozen accounts remain frozen</li>
                            <li>• Freeze authority will be set to null forever</li>
                            <li>• This action cannot be undone</li>
                          </ul>
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  {/* Confirmation */}
                  <div className='space-y-4'>
                    <h3 className='flex items-center space-x-2 text-lg font-medium'>
                      <Shield className='text-secondary h-5 w-5' />
                      <span>Confirmation</span>
                    </h3>

                    <TooltipProvider>
                      <div className='space-y-4'>
                        <div className='bg-warning/5 border-warning/20 flex items-center justify-between rounded-lg border p-4'>
                          <div className='flex items-center space-x-3'>
                            <div>
                              <Label className='text-warning cursor-pointer' htmlFor='understandIrreversible'>
                                I understand this action is irreversible
                              </Label>
                              <p className='text-muted-foreground text-sm'>Freeze authority cannot be restored once revoked</p>
                            </div>
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className='text-muted-foreground h-4 w-4' />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className='max-w-xs'>
                                  Revoking freeze authority permanently removes the ability to freeze any token accounts. This action builds
                                  trust but cannot be undone.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Switch
                            checked={formData.understandIrreversible}
                            id='understandIrreversible'
                            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, understandIrreversible: checked }))}
                          />
                        </div>

                        <div className='bg-secondary/5 border-secondary/20 flex items-center justify-between rounded-lg border p-4'>
                          <div className='flex items-center space-x-3'>
                            <div>
                              <Label className='text-secondary cursor-pointer' htmlFor='confirmRevoke'>
                                I want to build trust with my community
                              </Label>
                              <p className='text-muted-foreground text-sm'>Confirm you want to revoke freeze authority</p>
                            </div>
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className='text-muted-foreground h-4 w-4' />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className='max-w-xs'>
                                  By revoking freeze authority, you demonstrate commitment to decentralization and build trust with your
                                  token holders.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Switch
                            checked={formData.confirmRevoke}
                            id='confirmRevoke'
                            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, confirmRevoke: checked }))}
                          />
                        </div>
                      </div>
                    </TooltipProvider>
                  </div>

                  {/* Fee Breakdown */}
                  <div className='space-y-4'>
                    <h3 className='flex items-center space-x-2 text-lg font-medium'>
                      <Calculator className='text-secondary h-5 w-5' />
                      <span>Fee Breakdown</span>
                    </h3>

                    <Card className='from-secondary/5 to-primary/5 border-secondary/20 border-2 bg-gradient-to-r'>
                      <CardContent className='p-6'>
                        <div className='space-y-4'>
                          <div className='flex items-center justify-between'>
                            <span>Platform Fee:</span>
                            <span className='font-medium'>{fees.platform} SOL</span>
                          </div>
                          <div className='flex items-center justify-between'>
                            <span>Network Fee (estimated):</span>
                            <span className='font-medium'>{fees.network} SOL</span>
                          </div>
                          <div className='border-secondary/20 border-t pt-4'>
                            <div className='flex items-center justify-between'>
                              <span>Total Cost:</span>
                              <div className='text-right'>
                                <div className='text-muted-foreground text-sm line-through'>{fees.originalPrice} SOL</div>
                                <div className='text-secondary text-xl font-medium'>{fees.total} SOL</div>
                                <div className='text-primary text-sm'>Save {fees.savings} SOL</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Action Buttons */}
                  <div className='space-y-4'>
                    {!isConnected ? (
                      <Button
                        className='bg-primary hover:bg-primary-hover text-primary-foreground w-full rounded-xl py-4 shadow-lg transition-all duration-300 hover:shadow-xl'
                        onClick={() => setIsConnected(true)}
                        size='lg'
                      >
                        <Wallet className='mr-3 h-5 w-5' />
                        Connect Wallet to Continue
                      </Button>
                    ) : (
                      <div className='space-y-3'>
                        <Button
                          className='bg-secondary hover:bg-secondary/90 text-secondary-foreground w-full rounded-xl py-4 shadow-lg transition-all duration-300 hover:shadow-xl'
                          disabled={!formData.tokenAddress || !formData.confirmRevoke || !formData.understandIrreversible}
                          size='lg'
                        >
                          <ShieldOff className='mr-3 h-5 w-5' />
                          Revoke Freeze Authority ({fees.total} SOL)
                        </Button>

                        <Button
                          className='hover:bg-accent w-full rounded-xl border-2 py-4 transition-all duration-300'
                          size='lg'
                          variant='outline'
                        >
                          <Code className='mr-3 h-5 w-5' />
                          Test on Devnet (Free)
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className='from-muted/20 to-background bg-gradient-to-br px-6 py-16'>
        <div className='container mx-auto max-w-4xl'>
          <motion.div
            className='mb-12 text-center'
            initial={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <h2 className='mb-6 text-3xl md:text-4xl'>Frequently Asked Questions</h2>
            <p className='text-muted-foreground text-lg'>Everything you need to know about revoking freeze authority</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <Card className='border-border border-2 shadow-xl'>
              <CardContent className='p-0'>
                <Accordion className='w-full' collapsible type='single'>
                  {faqData.map((faq, index) => (
                    <AccordionItem className='px-6' key={index} value={`item-${index}`}>
                      <AccordionTrigger className='hover:text-secondary text-left transition-colors duration-300 hover:no-underline'>
                        <div className='flex items-center space-x-3'>
                          <HelpCircle className='text-secondary h-5 w-5 flex-shrink-0' />
                          <span>{faq.question}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className='text-muted-foreground pb-6 leading-relaxed'>{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Why Use Our Tool */}
      <section className='px-6 py-16'>
        <div className='container mx-auto max-w-6xl'>
          <motion.div
            className='mb-16 text-center'
            initial={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <h2 className='mb-6 text-3xl md:text-4xl'>
              Why Choose <span className='from-secondary to-primary bg-gradient-to-r bg-clip-text text-transparent'>Crypto Forge</span> for
              Authority Revocation?
            </h2>
            <p className='text-muted-foreground mx-auto max-w-3xl text-lg'>
              The most trusted way to give up freeze authority and build ultimate community trust
            </p>
          </motion.div>

          <div className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5'>
            {valueProps.map((prop, index) => {
              const Icon = prop.icon
              return (
                <motion.div
                  className='group'
                  initial={{ opacity: 0, y: 30 }}
                  key={index}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  whileInView={{ opacity: 1, y: 0 }}
                >
                  <Card className='hover:border-secondary/30 h-full border-2 text-center transition-all duration-300 hover:shadow-xl'>
                    <CardContent className='p-6'>
                      <motion.div
                        className='bg-secondary/10 group-hover:bg-secondary/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300'
                        transition={{ duration: 0.3 }}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <Icon className='text-secondary h-8 w-8' />
                      </motion.div>

                      <Badge className='mb-3 text-xs' variant='secondary'>
                        {prop.highlight}
                      </Badge>

                      <h3 className='group-hover:text-secondary mb-3 font-medium transition-colors duration-300'>{prop.title}</h3>
                      <p className='text-muted-foreground text-sm'>{prop.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>

          {/* Bottom CTA */}
          <motion.div
            className='mt-16 text-center'
            initial={{ opacity: 0, y: 30 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <Card className='from-secondary/10 to-primary/10 border-secondary/20 border-2 bg-gradient-to-r'>
              <CardContent className='p-8'>
                <Heart className='text-secondary mx-auto mb-4 h-12 w-12' />
                <h3 className='mb-4 text-2xl'>Ready to Build Ultimate Trust?</h3>
                <p className='text-muted-foreground mx-auto mb-6 max-w-2xl'>
                  Join projects that trust Crypto Forge for secure authority management. Professional tools, transparent fees, maximum
                  community confidence.
                </p>
                <Button
                  className='bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-xl px-8 py-3 shadow-lg transition-all duration-300 hover:shadow-xl'
                  size='lg'
                >
                  Revoke Freeze Authority
                  <ShieldOff className='ml-2 h-5 w-5' />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default RevokeFreezeAuthorityPage

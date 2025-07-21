'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Flame,
  Shield,
  Zap,
  AlertTriangle,
  Wallet,
  Calculator,
  CheckCircle,
  Search,
  DollarSign,
  Sparkles,
  Code,
  TrendingDown,
  Lock,
  Users,
  BarChart3,
  HelpCircle,
  Eye,
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
    description: 'Just 0.02 SOL platform fee + network costs',
  },
  {
    icon: Sparkles,
    title: 'Batch burning support',
    description: 'Burn multiple token amounts in a single transaction',
  },
  {
    icon: Shield,
    title: 'Safe & secure operations',
    description: 'Built-in safeguards and confirmation steps',
  },
  {
    icon: Eye,
    title: 'Privacy-first: no tracking',
    description: 'No cookies, no analytics, no personal data stored',
  },
  {
    icon: Code,
    title: 'Simulation/devnet support',
    description: 'Test your burns safely before mainnet execution',
  },
]

const faqData = [
  {
    question: 'What does burning tokens mean?',
    answer:
      'Token burning is the permanent removal of tokens from circulation by sending them to an unrecoverable wallet address. This reduces the total supply and is completely irreversible.',
  },
  {
    question: 'Why would I want to burn tokens?',
    answer:
      'Token burning can increase scarcity and potentially value of remaining tokens, demonstrate commitment to tokenomics, remove excess supply, or fulfill deflationary mechanics in your project.',
  },
  {
    question: 'Can I recover burned tokens?',
    answer:
      'No, token burning is completely irreversible. Once tokens are burned, they are permanently removed from circulation and cannot be recovered by anyone, including the original owner.',
  },
  {
    question: 'Do I need to own the tokens to burn them?',
    answer: 'Yes, you can only burn tokens that you own in your connected wallet. You cannot burn tokens belonging to other addresses.',
  },
  {
    question: 'What are the fees for burning tokens?',
    answer:
      'Our platform charges 0.02 SOL plus standard Solana network fees (typically ~0.003 SOL). There are no hidden fees or percentages taken from your tokens.',
  },
  {
    question: 'Can I burn tokens on devnet first?',
    answer:
      'Absolutely! We highly recommend testing your burn operations on devnet first to ensure everything works as expected before burning tokens on mainnet.',
  },
  {
    question: "Will burning affect my token's metadata?",
    answer:
      "No, burning tokens only reduces the circulating supply. Your token's metadata, name, symbol, and other properties remain unchanged.",
  },
  {
    question: 'Can I burn tokens in batches?',
    answer:
      'Yes, our tool supports batch burning operations, allowing you to burn multiple amounts or even multiple different tokens in a single transaction to save on fees.',
  },
]

const valueProps = [
  {
    icon: DollarSign,
    title: 'Lowest fees',
    description: 'Transparent pricing with no hidden costs or percentages',
    highlight: '0.02 SOL',
  },
  {
    icon: Shield,
    title: 'Safety first',
    description: 'Multiple confirmations and safeguards against mistakes',
    highlight: 'Safe & Secure',
  },
  {
    icon: Zap,
    title: 'Batch operations',
    description: 'Burn multiple tokens or amounts in single transaction',
    highlight: 'Save fees',
  },
  {
    icon: Code,
    title: 'Devnet testing',
    description: 'Test thoroughly before mainnet execution',
    highlight: 'Test first',
  },
  {
    icon: BarChart3,
    title: 'Supply analytics',
    description: 'Real-time supply tracking and burn history',
    highlight: 'Track impact',
  },
]

const burnReasons = [
  {
    icon: TrendingDown,
    title: 'Reduce Supply',
    description: 'Decrease total token supply to increase scarcity',
  },
  {
    icon: Users,
    title: 'Community Trust',
    description: 'Demonstrate commitment to tokenomics and community',
  },
  {
    icon: Lock,
    title: 'Deflationary Mechanics',
    description: 'Implement deflationary features in your token economy',
  },
]

const BurnTokenPage = (): React.ReactNode => {
  const [formData, setFormData] = useState({
    tokenAddress: '',
    burnAmount: '',
    confirmBurn: false,
    isValidToken: false,
    tokenInfo: null as unknown,
  })

  const [isConnected, setIsConnected] = useState(false)

  const calculateFees = (): { platform: number; network: number; total: number; originalPrice: number; savings: number } => {
    const platformFee = 0.02
    const networkFee = 0.003
    const total = platformFee + networkFee

    return {
      platform: platformFee,
      network: networkFee,
      total,
      originalPrice: 0.03, // Show crossed-out higher price
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
              x: [0, 80, 0],
              y: [0, -40, 0],
              rotate: [0, 180, 360],
            }}
            className='border-destructive/20 absolute top-20 left-20 flex h-16 w-16 items-center justify-center rounded-full border-2'
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          >
            <Flame className='text-destructive/40 h-6 w-6' />
          </motion.div>

          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            className='bg-destructive/10 absolute right-1/4 bottom-20 h-32 w-32 rounded-full blur-xl'
            transition={{ duration: 4, repeat: Infinity }}
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
              className='bg-destructive/10 text-destructive mb-6 inline-flex items-center rounded-full px-4 py-2'
              initial={{ opacity: 0, scale: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Flame className='mr-2 h-4 w-4' />
              <span className='text-sm'>Token Burner</span>
            </motion.div>

            <motion.h1
              animate={{ opacity: 1, y: 0 }}
              className='mb-6 text-3xl leading-tight md:text-5xl lg:text-6xl'
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <span className='from-destructive to-warning bg-gradient-to-r bg-clip-text text-transparent'>Solana Token Burner</span>
            </motion.h1>

            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className='text-muted-foreground mx-auto mb-8 max-w-3xl text-lg md:text-xl'
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              Permanently remove tokens from circulation with the lowest fees and maximum security. Reduce supply, build trust, and
              implement deflationary tokenomics safely.
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
                  <Card className='hover:border-destructive/30 h-full border-2 text-center transition-all duration-300 hover:shadow-xl'>
                    <CardContent className='p-6'>
                      <motion.div
                        className='bg-destructive/10 group-hover:bg-destructive/20 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300'
                        transition={{ duration: 0.3 }}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <Icon className='text-destructive h-6 w-6' />
                      </motion.div>
                      <h3 className='group-hover:text-destructive mb-2 font-medium transition-colors duration-300'>{feature.title}</h3>
                      <p className='text-muted-foreground text-sm'>{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>

          {/* Burn Reasons */}
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className='grid grid-cols-1 gap-6 md:grid-cols-3'
            initial={{ opacity: 0, y: 30 }}
            transition={{ delay: 0.7, duration: 0.8 }}
          >
            {burnReasons.map((reason, index) => {
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

      {/* Token Burning Form */}
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
              <CardHeader className='from-destructive/5 to-warning/5 border-border border-b bg-gradient-to-r'>
                <CardTitle className='text-center'>
                  <div className='flex items-center justify-center space-x-3'>
                    <Flame className='text-destructive h-6 w-6' />
                    <span>Burn Your Tokens</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className='p-8'>
                <div className='space-y-8'>
                  {/* Warning Alert */}
                  <Alert className='border-destructive/50 bg-destructive/5'>
                    <AlertTriangle className='text-destructive h-4 w-4' />
                    <AlertDescription className='text-destructive'>
                      <strong>Warning:</strong> Token burning is permanent and irreversible. Once burned, tokens cannot be recovered. Please
                      double-check all details before proceeding.
                    </AlertDescription>
                  </Alert>

                  {/* Token Selection */}
                  <div className='space-y-6'>
                    <h3 className='flex items-center space-x-2 text-lg font-medium'>
                      <Search className='text-destructive h-5 w-5' />
                      <span>Token Selection</span>
                    </h3>

                    <div className='space-y-4'>
                      <div className='space-y-2'>
                        <Label htmlFor='tokenAddress'>Token Address *</Label>
                        <Input
                          className='bg-input-background focus:border-destructive border-2 font-mono text-sm'
                          id='tokenAddress'
                          onChange={(e) => setFormData((prev) => ({ ...prev, tokenAddress: e.target.value }))}
                          placeholder='Enter SPL token mint address'
                          value={formData.tokenAddress}
                        />
                        <p className='text-muted-foreground text-xs'>Enter the mint address of the SPL token you want to burn</p>
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
                              <p className='text-muted-foreground text-xs'>Balance: 1,000,000 tokens • Decimals: 9</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Burn Amount */}
                  <div className='space-y-6'>
                    <h3 className='flex items-center space-x-2 text-lg font-medium'>
                      <Flame className='text-destructive h-5 w-5' />
                      <span>Burn Amount</span>
                    </h3>

                    <div className='space-y-4'>
                      <div className='space-y-2'>
                        <Label htmlFor='burnAmount'>Amount to Burn *</Label>
                        <div className='relative'>
                          <Input
                            className='bg-input-background focus:border-destructive border-2 pr-20'
                            id='burnAmount'
                            onChange={(e) => setFormData((prev) => ({ ...prev, burnAmount: e.target.value }))}
                            placeholder='0'
                            type='number'
                            value={formData.burnAmount}
                          />
                          <div className='absolute top-1/2 right-3 flex -translate-y-1/2 space-x-2'>
                            <Button
                              onClick={() => setFormData((prev) => ({ ...prev, burnAmount: '500000' }))}
                              size='sm'
                              type='button'
                              variant='outline'
                            >
                              50%
                            </Button>
                            <Button
                              onClick={() => setFormData((prev) => ({ ...prev, burnAmount: '1000000' }))}
                              size='sm'
                              type='button'
                              variant='outline'
                            >
                              MAX
                            </Button>
                          </div>
                        </div>
                        <p className='text-muted-foreground text-xs'>Enter the number of tokens to permanently burn</p>
                      </div>

                      {formData.burnAmount && (
                        <motion.div
                          animate={{ opacity: 1, height: 'auto' }}
                          className='bg-destructive/5 border-destructive/20 rounded-lg border p-4'
                          initial={{ opacity: 0, height: 0 }}
                        >
                          <div className='space-y-2'>
                            <div className='flex justify-between text-sm'>
                              <span>Amount to burn:</span>
                              <span className='font-medium'>{Number(formData.burnAmount).toLocaleString()} tokens</span>
                            </div>
                            <div className='flex justify-between text-sm'>
                              <span>Remaining supply:</span>
                              <span className='font-medium'>{(1000000 - Number(formData.burnAmount || 0)).toLocaleString()} tokens</span>
                            </div>
                            <div className='flex justify-between text-sm'>
                              <span>Supply reduction:</span>
                              <span className='text-destructive font-medium'>
                                -{((Number(formData.burnAmount || 0) / 1000000) * 100).toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Confirmation */}
                  <div className='space-y-4'>
                    <h3 className='flex items-center space-x-2 text-lg font-medium'>
                      <Shield className='text-destructive h-5 w-5' />
                      <span>Confirmation</span>
                    </h3>

                    <TooltipProvider>
                      <div className='bg-destructive/5 border-destructive/20 flex items-center justify-between rounded-lg border p-4'>
                        <div className='flex items-center space-x-3'>
                          <div>
                            <Label className='text-destructive cursor-pointer' htmlFor='confirmBurn'>
                              I understand this action is irreversible
                            </Label>
                            <p className='text-muted-foreground text-sm'>Burned tokens cannot be recovered by anyone</p>
                          </div>
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className='text-muted-foreground h-4 w-4' />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className='max-w-xs'>
                                Token burning sends tokens to a burn address where they become permanently inaccessible. This action cannot
                                be undone.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Switch
                          checked={formData.confirmBurn}
                          id='confirmBurn'
                          onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, confirmBurn: checked }))}
                        />
                      </div>
                    </TooltipProvider>
                  </div>

                  {/* Fee Breakdown */}
                  <div className='space-y-4'>
                    <h3 className='flex items-center space-x-2 text-lg font-medium'>
                      <Calculator className='text-destructive h-5 w-5' />
                      <span>Fee Breakdown</span>
                    </h3>

                    <Card className='from-destructive/5 to-warning/5 border-destructive/20 border-2 bg-gradient-to-r'>
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
                          <div className='border-destructive/20 border-t pt-4'>
                            <div className='flex items-center justify-between'>
                              <span>Total Cost:</span>
                              <div className='text-right'>
                                <div className='text-muted-foreground text-sm line-through'>{fees.originalPrice} SOL</div>
                                <div className='text-destructive text-xl font-medium'>{fees.total} SOL</div>
                                <div className='text-secondary text-sm'>Save {fees.savings} SOL</div>
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
                          className='bg-destructive hover:bg-destructive/90 text-destructive-foreground w-full rounded-xl py-4 shadow-lg transition-all duration-300 hover:shadow-xl'
                          disabled={!formData.tokenAddress || !formData.burnAmount || !formData.confirmBurn}
                          size='lg'
                        >
                          <Flame className='mr-3 h-5 w-5' />
                          Burn Tokens ({fees.total} SOL)
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
            <p className='text-muted-foreground text-lg'>Everything you need to know about burning SPL tokens</p>
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
                      <AccordionTrigger className='hover:text-destructive text-left transition-colors duration-300 hover:no-underline'>
                        <div className='flex items-center space-x-3'>
                          <HelpCircle className='text-destructive h-5 w-5 flex-shrink-0' />
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
              Why Choose <span className='from-destructive to-warning bg-gradient-to-r bg-clip-text text-transparent'>Crypto Forge</span>{' '}
              for Token Burning?
            </h2>
            <p className='text-muted-foreground mx-auto max-w-3xl text-lg'>
              The safest and most cost-effective way to permanently reduce your token supply
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
                  <Card className='hover:border-destructive/30 h-full border-2 text-center transition-all duration-300 hover:shadow-xl'>
                    <CardContent className='p-6'>
                      <motion.div
                        className='bg-destructive/10 group-hover:bg-destructive/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300'
                        transition={{ duration: 0.3 }}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <Icon className='text-destructive h-8 w-8' />
                      </motion.div>

                      <Badge className='mb-3 text-xs' variant='secondary'>
                        {prop.highlight}
                      </Badge>

                      <h3 className='group-hover:text-destructive mb-3 font-medium transition-colors duration-300'>{prop.title}</h3>
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
            <Card className='from-destructive/10 to-warning/10 border-destructive/20 border-2 bg-gradient-to-r'>
              <CardContent className='p-8'>
                <Flame className='text-destructive mx-auto mb-4 h-12 w-12' />
                <h3 className='mb-4 text-2xl'>Ready to Reduce Your Token Supply?</h3>
                <p className='text-muted-foreground mx-auto mb-6 max-w-2xl'>
                  Join projects that trust Crypto Forge for safe, irreversible token burning. Professional tools, transparent fees, maximum
                  security.
                </p>
                <Button
                  className='bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl px-8 py-3 shadow-lg transition-all duration-300 hover:shadow-xl'
                  size='lg'
                >
                  Start Burning Tokens
                  <Flame className='ml-2 h-5 w-5' />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default BurnTokenPage

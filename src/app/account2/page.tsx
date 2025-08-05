/* eslint-disable react/jsx-max-depth */
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Wallet,
  Shield,
  Eye,
  TrendingUp,
  TrendingDown,
  Copy,
  ExternalLink,
  RefreshCw,
  Clock,
  Coins,
  BarChart3,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Download,
  DollarSign,
  Activity,
  Star,
  CheckCircle,
  Zap,
  CreditCard,
  XCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface WalletData {
  address: string
  solBalance: number
  totalValue: number
  valueChange24h: number
  transactionCount: number
  splTokens: SPLToken[]
  recentTransactions: Transaction[]
  nftCount: number
  stakingRewards: number
}

interface SPLToken {
  address: string
  name: string
  symbol: string
  balance: number
  value: number
  change24h: number
  logo?: string
  decimals: number
}

interface Transaction {
  signature: string
  type: 'send' | 'receive' | 'swap' | 'stake' | 'mint' | 'burn'
  amount: number
  token: string
  timestamp: number
  status: 'success' | 'failed' | 'pending'
  fee: number
  from?: string
  to?: string
}

const AccountInfoPage = () => {
  const [isConnected, setIsConnected] = useState(true) // Simulate connected wallet
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h')
  const [transactionFilter, setTransactionFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Mock wallet data
  const walletData: WalletData = {
    address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    solBalance: 156.847392,
    totalValue: 8247.32,
    valueChange24h: 5.7,
    transactionCount: 1247,
    nftCount: 23,
    stakingRewards: 12.45,
    splTokens: [
      {
        address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        name: 'USD Coin',
        symbol: 'USDC',
        balance: 2847.392847,
        value: 2847.39,
        change24h: 0.02,
        logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
        decimals: 6,
      },
      {
        address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
        name: 'Tether',
        symbol: 'USDT',
        balance: 1567.892345,
        value: 1567.89,
        change24h: -0.01,
        logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png',
        decimals: 6,
      },
      {
        address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
        name: 'Bonk',
        symbol: 'BONK',
        balance: 1247392847.29,
        value: 234.78,
        change24h: 15.7,
        logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263/logo.png',
        decimals: 5,
      },
    ],
    recentTransactions: [
      {
        signature: '5VfYmGjjUxt6j8VKyqFW...',
        type: 'receive',
        amount: 25.5,
        token: 'SOL',
        timestamp: Date.now() - 3600000,
        status: 'success',
        fee: 0.000005,
        from: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
      },
      {
        signature: '3KmGhYvPQet5d2WKyqFW...',
        type: 'send',
        amount: 100,
        token: 'USDC',
        timestamp: Date.now() - 7200000,
        status: 'success',
        fee: 0.000005,
        to: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      },
      {
        signature: '8HnFiYmBbkg7ZTbNMqUx...',
        type: 'swap',
        amount: 50,
        token: 'SOL → USDC',
        timestamp: Date.now() - 10800000,
        status: 'success',
        fee: 0.000025,
      },
      {
        signature: '4LmGhYvPQet6d2WKyqFW...',
        type: 'mint',
        amount: 1000000,
        token: 'MTKN',
        timestamp: Date.now() - 14400000,
        status: 'success',
        fee: 0.01,
      },
    ],
  }

  const features = [
    {
      icon: Wallet,
      title: 'Portfolio overview',
      description: 'Complete view of your Solana assets',
    },
    {
      icon: Shield,
      title: 'Real-time balances',
      description: 'Live blockchain data with instant updates',
    },
    {
      icon: Activity,
      title: 'Transaction history',
      description: 'Detailed record of all your activities',
    },
    {
      icon: Eye,
      title: 'Privacy protected',
      description: 'No tracking, no data stored permanently',
    },
    {
      icon: BarChart3,
      title: 'Portfolio analytics',
      description: 'Track performance and growth over time',
    },
  ]

  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 1000)
  }

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address)
  }

  const formatNumber = (num: number, decimals: number = 2) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(decimals)}B`
    if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`
    if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`
    return num.toFixed(decimals)
  }

  const formatCurrency = (num: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num)

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'receive':
        return ArrowDownLeft
      case 'send':
        return ArrowUpRight
      case 'swap':
        return RefreshCw
      case 'stake':
        return Star
      case 'mint':
        return Coins
      case 'burn':
        return Zap
      default:
        return Activity
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'receive':
        return 'text-secondary'
      case 'send':
        return 'text-destructive'
      case 'swap':
        return 'text-primary'
      case 'stake':
        return 'text-warning'
      case 'mint':
        return 'text-secondary'
      case 'burn':
        return 'text-destructive'
      default:
        return 'text-muted-foreground'
    }
  }

  const filteredTransactions = walletData.recentTransactions.filter((tx) => {
    const matchesFilter = transactionFilter === 'all' || tx.type === transactionFilter
    const matchesSearch =
      searchQuery === '' ||
      tx.signature.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.token.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  if (!isConnected) {
    return (
      <div className='bg-background relative flex min-h-screen items-center justify-center'>
        <Card className='mx-6 w-full max-w-md'>
          <CardContent className='p-8 text-center'>
            <Wallet className='text-muted-foreground mx-auto mb-6 h-16 w-16' />
            <h3 className='mb-4 text-xl font-medium'>Connect Your Wallet</h3>
            <p className='text-muted-foreground mb-6'>
              Connect your Solana wallet to view your account information and manage your assets.
            </p>
            <Button className='bg-primary hover:bg-primary-hover text-primary-foreground w-full' onClick={() => setIsConnected(true)}>
              <Wallet className='mr-2 h-4 w-4' />
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='bg-background relative min-h-screen'>
      {/* Hero Section */}
      <section className='from-background via-background to-muted relative overflow-hidden bg-gradient-to-br px-6 py-16 md:py-20'>
        {/* Background Elements */}
        <div className='absolute inset-0 overflow-hidden'>
          <motion.div
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
              rotate: [0, 180, 360],
            }}
            className='border-primary/20 absolute top-20 left-20 flex h-16 w-16 items-center justify-center rounded-full border-2'
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            <Wallet className='text-primary/40 h-6 w-6' />
          </motion.div>

          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            className='bg-primary/10 absolute right-1/4 bottom-20 h-32 w-32 rounded-full blur-xl'
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
              className='bg-primary/10 text-primary mb-6 inline-flex items-center rounded-full px-4 py-2'
              initial={{ opacity: 0, scale: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <CreditCard className='mr-2 h-4 w-4' />
              <span className='text-sm'>Account Overview</span>
            </motion.div>

            <motion.h1
              animate={{ opacity: 1, y: 0 }}
              className='mb-6 text-3xl leading-tight md:text-5xl lg:text-6xl'
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <span className='crypto-text-gradient'>My Portfolio</span>
            </motion.h1>

            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className='text-muted-foreground mb-8 flex items-center justify-center space-x-2'
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <span className='font-mono text-sm'>{walletData.address}</span>
              <Button className='h-6 w-6 p-0' onClick={() => copyAddress(walletData.address)} size='sm' variant='ghost'>
                <Copy className='h-3 w-3' />
              </Button>
              <Button className='h-6 w-6 p-0' size='sm' variant='ghost'>
                <ExternalLink className='h-3 w-3' />
              </Button>
            </motion.div>

            {/* Portfolio Value */}
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className='mb-8 text-center'
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <div className='mb-2 text-4xl font-medium md:text-5xl'>{formatCurrency(walletData.totalValue)}</div>
              <div
                className={`flex items-center justify-center space-x-1 ${walletData.valueChange24h >= 0 ? 'text-secondary' : 'text-destructive'}`}
              >
                {walletData.valueChange24h >= 0 ? <TrendingUp className='h-4 w-4' /> : <TrendingDown className='h-4 w-4' />}
                <span>
                  {walletData.valueChange24h >= 0 ? '+' : ''}
                  {walletData.valueChange24h.toFixed(2)}% (24h)
                </span>
              </div>
            </motion.div>
          </motion.div>

          {/* Feature Highlights */}
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className='mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5'
            initial={{ opacity: 0, y: 30 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className='group'
                  initial={{ opacity: 0, y: 20 }}
                  key={index}
                  transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                >
                  <Card className='hover:border-primary/30 h-full border-2 text-center transition-all duration-300 hover:shadow-xl'>
                    <CardContent className='p-6'>
                      <motion.div
                        className='bg-primary/10 group-hover:bg-primary/20 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300'
                        transition={{ duration: 0.3 }}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <Icon className='text-primary h-6 w-6' />
                      </motion.div>
                      <h3 className='group-hover:text-primary mb-2 font-medium transition-colors duration-300'>{feature.title}</h3>
                      <p className='text-muted-foreground text-sm'>{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* Portfolio Overview */}
      <section className='px-6 py-16'>
        <div className='container mx-auto max-w-6xl'>
          {/* Quick Stats */}
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className='mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'
            initial={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.8 }}
          >
            {[
              {
                icon: Coins,
                title: 'SOL Balance',
                value: `${walletData.solBalance.toFixed(6)} SOL`,
                subtitle: formatCurrency(walletData.solBalance * 52.34), // Mock SOL price
              },
              {
                icon: DollarSign,
                title: 'SPL Tokens',
                value: walletData.splTokens.length.toString(),
                subtitle: formatCurrency(walletData.splTokens.reduce((sum, token) => sum + token.value, 0)),
              },
              {
                icon: Activity,
                title: 'Transactions',
                value: walletData.transactionCount.toLocaleString(),
                subtitle: 'All time',
              },
              {
                icon: Star,
                title: 'Staking Rewards',
                value: `${walletData.stakingRewards.toFixed(2)} SOL`,
                subtitle: 'Total earned',
              },
            ].map((stat, index) => (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                key={stat.title}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <Card className='hover:border-primary/20 border-2 transition-all duration-300'>
                  <CardContent className='p-6'>
                    <div className='mb-3 flex items-center space-x-3'>
                      <div className='bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg'>
                        <stat.icon className='text-primary h-5 w-5' />
                      </div>
                      <div className='flex-1'>
                        <p className='text-muted-foreground text-sm'>{stat.title}</p>
                        <p className='text-xl font-medium'>{stat.value}</p>
                        <p className='text-muted-foreground text-xs'>{stat.subtitle}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Main Content Tabs */}
          <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 30 }} transition={{ delay: 0.4, duration: 0.8 }}>
            <Tabs className='space-y-6' defaultValue='tokens'>
              <div className='flex items-center justify-between'>
                <TabsList className='grid w-full max-w-md grid-cols-3'>
                  <TabsTrigger value='tokens'>SPL Tokens</TabsTrigger>
                  <TabsTrigger value='transactions'>Transactions</TabsTrigger>
                  <TabsTrigger value='analytics'>Analytics</TabsTrigger>
                </TabsList>

                <Button
                  className='border-primary/20 hover:border-primary/40'
                  disabled={isLoading}
                  onClick={handleRefresh}
                  variant='outline'
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {/* SPL Tokens Tab */}
              <TabsContent className='space-y-6' value='tokens'>
                <Card className='border-border border-2'>
                  <CardHeader className='from-primary/5 to-secondary/5 border-border border-b bg-gradient-to-r'>
                    <CardTitle className='flex items-center space-x-2'>
                      <Coins className='text-primary h-5 w-5' />
                      <span>SPL Token Holdings</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='p-0'>
                    <div className='overflow-x-auto'>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Token</TableHead>
                            <TableHead className='text-right'>Balance</TableHead>
                            <TableHead className='text-right'>Value</TableHead>
                            <TableHead className='text-right'>24h Change</TableHead>
                            <TableHead className='text-right'>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {walletData.splTokens.map((token) => (
                            <TableRow className='hover:bg-muted/50' key={token.address}>
                              <TableCell>
                                <div className='flex items-center space-x-3'>
                                  {token.logo && (
                                    <Avatar className='h-8 w-8'>
                                      <AvatarImage alt={token.symbol} src={token.logo} />
                                      <AvatarFallback>{token.symbol.substring(0, 2)}</AvatarFallback>
                                    </Avatar>
                                  )}
                                  <div>
                                    <div className='font-medium'>{token.symbol}</div>
                                    <div className='text-muted-foreground text-sm'>{token.name}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className='text-right'>
                                <div className='font-medium'>{formatNumber(token.balance, token.decimals > 2 ? 2 : token.decimals)}</div>
                                <div className='text-muted-foreground text-sm'>{token.symbol}</div>
                              </TableCell>
                              <TableCell className='text-right font-medium'>{formatCurrency(token.value)}</TableCell>
                              <TableCell className='text-right'>
                                <div
                                  className={`flex items-center justify-end space-x-1 ${
                                    token.change24h >= 0 ? 'text-secondary' : 'text-destructive'
                                  }`}
                                >
                                  {token.change24h >= 0 ? <TrendingUp className='h-3 w-3' /> : <TrendingDown className='h-3 w-3' />}
                                  <span>
                                    {token.change24h >= 0 ? '+' : ''}
                                    {token.change24h.toFixed(2)}%
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className='text-right'>
                                <div className='flex items-center justify-end space-x-2'>
                                  <Button className='h-7' size='sm' variant='outline'>
                                    <ArrowUpRight className='mr-1 h-3 w-3' />
                                    Send
                                  </Button>
                                  <Button className='h-7 w-7 p-0' onClick={() => copyAddress(token.address)} size='sm' variant='ghost'>
                                    <Copy className='h-3 w-3' />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Transactions Tab */}
              <TabsContent className='space-y-6' value='transactions'>
                {/* Transaction Filters */}
                <Card className='border-border border-2'>
                  <CardContent className='p-6'>
                    <div className='flex flex-col items-start justify-between gap-4 md:flex-row md:items-center'>
                      <div className='flex items-center space-x-4'>
                        <div className='relative'>
                          <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
                          <Input
                            className='w-64 pl-10'
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder='Search transactions...'
                            value={searchQuery}
                          />
                        </div>
                        <Select onValueChange={setTransactionFilter} value={transactionFilter}>
                          <SelectTrigger className='w-40'>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='all'>All Types</SelectItem>
                            <SelectItem value='send'>Send</SelectItem>
                            <SelectItem value='receive'>Receive</SelectItem>
                            <SelectItem value='swap'>Swap</SelectItem>
                            <SelectItem value='stake'>Stake</SelectItem>
                            <SelectItem value='mint'>Mint</SelectItem>
                            <SelectItem value='burn'>Burn</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button className='border-primary/20 hover:border-primary/40' variant='outline'>
                        <Download className='mr-2 h-4 w-4' />
                        Export
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Transaction Table */}
                <Card className='border-border border-2'>
                  <CardHeader className='from-primary/5 to-secondary/5 border-border border-b bg-gradient-to-r'>
                    <CardTitle className='flex items-center space-x-2'>
                      <Activity className='text-primary h-5 w-5' />
                      <span>Recent Transactions</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='p-0'>
                    <div className='overflow-x-auto'>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Transaction</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className='text-right'>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead className='text-right'>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTransactions.map((tx) => {
                            const TransactionIcon = getTransactionIcon(tx.type)
                            return (
                              <TableRow className='hover:bg-muted/50' key={tx.signature}>
                                <TableCell>
                                  <div className='flex items-center space-x-3'>
                                    <div
                                      className={`bg-muted/50 flex h-8 w-8 items-center justify-center rounded-full ${getTransactionColor(tx.type)}`}
                                    >
                                      <TransactionIcon className='h-4 w-4' />
                                    </div>
                                    <div>
                                      <div className='font-mono text-sm'>{tx.signature}</div>
                                      <div className='text-muted-foreground text-xs'>Fee: {tx.fee} SOL</div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className='capitalize' variant='outline'>
                                    {tx.type}
                                  </Badge>
                                </TableCell>
                                <TableCell className='text-right'>
                                  <div className={`font-medium ${getTransactionColor(tx.type)}`}>
                                    {tx.type === 'receive' ? '+' : tx.type === 'send' ? '-' : ''}
                                    {formatNumber(tx.amount)} {tx.token}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className='flex items-center space-x-1'>
                                    {tx.status === 'success' && <CheckCircle className='text-secondary h-4 w-4' />}
                                    {tx.status === 'failed' && <XCircle className='text-destructive h-4 w-4' />}
                                    {tx.status === 'pending' && <Clock className='text-warning h-4 w-4' />}
                                    <span className='text-sm capitalize'>{tx.status}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className='text-sm'>{new Date(tx.timestamp).toLocaleDateString()}</div>
                                  <div className='text-muted-foreground text-xs'>{new Date(tx.timestamp).toLocaleTimeString()}</div>
                                </TableCell>
                                <TableCell className='text-right'>
                                  <Button className='h-7 w-7 p-0' onClick={() => copyAddress(tx.signature)} size='sm' variant='ghost'>
                                    <Copy className='h-3 w-3' />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent className='space-y-6' value='analytics'>
                <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
                  {/* Portfolio Composition */}
                  <Card className='border-border border-2'>
                    <CardHeader className='from-primary/5 to-secondary/5 border-border border-b bg-gradient-to-r'>
                      <CardTitle className='flex items-center space-x-2'>
                        <BarChart3 className='text-primary h-5 w-5' />
                        <span>Portfolio Composition</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='p-6'>
                      <div className='space-y-4'>
                        {walletData.splTokens.map((token, index) => {
                          const percentage = (token.value / walletData.totalValue) * 100
                          return (
                            <div key={token.address}>
                              <div className='mb-2 flex items-center justify-between'>
                                <div className='flex items-center space-x-2'>
                                  {token.logo && (
                                    <Avatar className='h-6 w-6'>
                                      <AvatarImage alt={token.symbol} src={token.logo} />
                                      <AvatarFallback>{token.symbol.substring(0, 2)}</AvatarFallback>
                                    </Avatar>
                                  )}
                                  <span className='font-medium'>{token.symbol}</span>
                                </div>
                                <span className='text-muted-foreground text-sm'>{percentage.toFixed(1)}%</span>
                              </div>
                              <Progress className='h-2' value={percentage} />
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Performance Summary */}
                  <Card className='border-border border-2'>
                    <CardHeader className='from-primary/5 to-secondary/5 border-border border-b bg-gradient-to-r'>
                      <CardTitle className='flex items-center space-x-2'>
                        <TrendingUp className='text-primary h-5 w-5' />
                        <span>Performance Summary</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='p-6'>
                      <div className='space-y-6'>
                        <div className='grid grid-cols-2 gap-4'>
                          <div className='text-center'>
                            <div className='text-secondary text-2xl font-medium'>+{walletData.valueChange24h.toFixed(2)}%</div>
                            <p className='text-muted-foreground text-sm'>24h Change</p>
                          </div>
                          <div className='text-center'>
                            <div className='text-2xl font-medium'>{formatCurrency(walletData.totalValue)}</div>
                            <p className='text-muted-foreground text-sm'>Total Value</p>
                          </div>
                        </div>

                        <div className='space-y-3'>
                          <div className='flex items-center justify-between'>
                            <span className='text-sm'>All-time High</span>
                            <span className='font-medium'>{formatCurrency(walletData.totalValue * 1.15)}</span>
                          </div>
                          <div className='flex items-center justify-between'>
                            <span className='text-sm'>Best Performer</span>
                            <span className='text-secondary font-medium'>BONK (+15.7%)</span>
                          </div>
                          <div className='flex items-center justify-between'>
                            <span className='text-sm'>Total Transactions</span>
                            <span className='font-medium'>{walletData.transactionCount.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </section>

      {/* Privacy Notice */}
      <section className='bg-muted/30 px-6 py-16'>
        <div className='container mx-auto max-w-4xl'>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <Card className='from-secondary/5 to-primary/5 border-secondary/10 border-2 bg-gradient-to-r'>
              <CardContent className='p-8 text-center'>
                <Shield className='text-secondary mx-auto mb-6 h-16 w-16' />
                <h3 className='mb-6 text-2xl font-medium md:text-3xl'>Your Privacy is Protected</h3>
                <p className='text-muted-foreground mx-auto mb-6 max-w-2xl text-lg'>
                  Your wallet data is fetched directly from the blockchain in real-time. We don't store, track, or log any of your personal
                  information or transaction history.
                </p>
                <div className='text-muted-foreground flex items-center justify-center space-x-2 text-sm'>
                  <Eye className='h-4 w-4' />
                  <span>No tracking • No cookies • No data storage • Complete privacy</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default AccountInfoPage

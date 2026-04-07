'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Step1MarketForm } from './LiquidityCreationForm/Step1MarketForm'
import { Step2PoolForm } from './LiquidityCreationForm/Step2PoolForm'

export const LiquidityWizard = () => {
  const [currentStep, setCurrentStep] = useState('market')
  const [marketId, setMarketId] = useState<string | null>(null)
  const [baseMint, setBaseMint] = useState<string | null>(null)
  const [quoteMint, setQuoteMint] = useState<string | null>(null)

  const handleMarketCreated = (id: string, base: string, quote: string) => {
    setMarketId(id)
    setBaseMint(base)
    setQuoteMint(quote)
    setCurrentStep('pool')
  }

  return (
    <Card className='w-full'>
      <CardHeader>
        <CardTitle>Create Liquidity Pool</CardTitle>
        <CardDescription>Follow the steps to launch your token on Raydium.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs className='w-full' onValueChange={setCurrentStep} value={currentStep}>
          <TabsList className='mb-8 grid w-full grid-cols-2'>
            <TabsTrigger disabled={currentStep === 'pool' && !marketId} value='market'>
              Step 1: Create Market
            </TabsTrigger>
            <TabsTrigger disabled={!marketId} value='pool'>
              Step 2: Initialize Pool
            </TabsTrigger>
          </TabsList>

          <TabsContent value='market'>
            <Step1MarketForm onSuccess={handleMarketCreated} />
          </TabsContent>

          <TabsContent value='pool'>
            <Step2PoolForm baseMint={baseMint} marketId={marketId} quoteMint={quoteMint} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

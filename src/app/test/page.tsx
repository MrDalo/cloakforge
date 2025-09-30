'use client'

import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL, TransactionInstruction } from '@solana/web3.js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { WalletConnectionButton } from '@/components/common/WalletConnectionButton'
import getConfig from '@/lib/config/getConfig'
import { getLogger } from '@/lib/logger/logger'

const logger = getLogger({ context: 'test-page' })

const TestPage: React.FC = () => {
  const { publicKey, signTransaction } = useWallet()
  const [isClientTesting, setIsClientTesting] = useState(false)
  const [isServerTesting, setIsServerTesting] = useState(false)
  const [clientResult, setClientResult] = useState<string>('')
  const [serverResult, setServerResult] = useState<string>('')

  const FEE_WALLET_ADDRESS = 'J9Ak6AdHyqSbmJgTR3LmwusCMB68a3gsvFA5VTiLTx67' // From .env.local

  const testClientSideTransaction = async (): Promise<void> => {
    if (!publicKey || !signTransaction) {
      setClientResult('❌ Wallet not connected')
      return
    }

    setIsClientTesting(true)
    setClientResult('🔄 Creating client-side transaction...')

    try {
      const config = getConfig()
      // Create a fresh connection each time to avoid cache issues
      const connection = new Connection(config.rpcPublicEndpoint, {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000,
      })

      logger.info('Starting client-side transaction test', {
        wallet: publicKey.toString(),
        feeWallet: FEE_WALLET_ADDRESS,
        rpcEndpoint: config.rpcPublicEndpoint,
      })

      // Add timestamp to make transaction unique
      const timestamp = Date.now()
      const randomFactor = Math.floor(Math.random() * 100000) // Larger random factor
      const uniqueAmount = Math.floor(0.001 * LAMPORTS_PER_SOL) + (timestamp % 10000) + randomFactor // Much more unique

      // Wait a moment to ensure fresh state
      setClientResult('🔄 Waiting for fresh state...')
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Get fresh blockhash with latest commitment
      setClientResult('🔄 Getting fresh blockhash...')
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized')

      // Create transaction with fresh blockhash
      const transaction = new Transaction({
        feePayer: publicKey,
        recentBlockhash: blockhash,
      })

      // Add memo instruction for absolute uniqueness
      const memoData = `CLIENT-TEST-${timestamp}-${randomFactor}-${Date.now()}`
      const memoInstruction = new TransactionInstruction({
        keys: [],
        programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'), // Memo program
        data: Buffer.from(memoData, 'utf8'),
      })

      // Add transfer instruction with unique amount
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: new PublicKey(FEE_WALLET_ADDRESS),
        lamports: uniqueAmount,
      })

      transaction.add(memoInstruction)
      transaction.add(transferInstruction)

      logger.info('Client-side transaction created', {
        instructions: transaction.instructions.length,
        feePayer: transaction.feePayer?.toString(),
        recentBlockhash: transaction.recentBlockhash,
        uniqueAmount,
        timestamp,
        memoData,
        lastValidBlockHeight,
      })

      // Simulate transaction BEFORE signing
      setClientResult('🔄 Simulating client-side transaction...')
      const simulation = await connection.simulateTransaction(transaction)

      logger.info('Client-side simulation result', {
        success: !simulation.value.err,
        error: simulation.value.err,
        logs: simulation.value.logs,
      })

      if (simulation.value.err) {
        setClientResult(`❌ Client simulation failed: ${JSON.stringify(simulation.value.err)}`)
        return
      }

      // Sign transaction
      setClientResult('🔄 Signing client-side transaction...')
      const signedTransaction = await signTransaction(transaction)

      logger.info('Client-side transaction signed successfully')

      // Send transaction
      setClientResult('🔄 Sending client-side transaction...')

      try {
        const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        })

        logger.info('Client-side transaction sent', { signature })

        // Confirm transaction
        const confirmation = await connection.confirmTransaction(signature, 'confirmed')

        if (confirmation.value.err) {
          setClientResult(`❌ Client transaction failed: ${JSON.stringify(confirmation.value.err)}`)
        } else {
          setClientResult(`✅ Client transaction successful: ${signature}`)
        }
      } catch (sendError: unknown) {
        logger.error('Client-side send error', sendError)

        if (sendError && typeof sendError === 'object' && 'name' in sendError && sendError.name === 'SendTransactionError') {
          const logs = 'getLogs' in sendError && typeof sendError.getLogs === 'function' ? sendError.getLogs() : []
          const message = 'message' in sendError && typeof sendError.message === 'string' ? sendError.message : 'Unknown error'
          setClientResult(`❌ Client send error: ${message}\nLogs: ${JSON.stringify(logs, null, 2)}`)
        } else {
          const message = sendError instanceof Error ? sendError.message : 'Unknown send error'
          setClientResult(`❌ Client send error: ${message}`)
        }
        return
      }
    } catch (error) {
      logger.error('Client-side transaction error', error)
      setClientResult(`❌ Client error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsClientTesting(false)
    }
  }

  const testServerSideTransaction = async (): Promise<void> => {
    if (!publicKey || !signTransaction) {
      setServerResult('❌ Wallet not connected')
      return
    }

    setIsServerTesting(true)
    setServerResult('🔄 Creating server-side transaction...')

    try {
      logger.info('Starting server-side transaction test', {
        wallet: publicKey.toString(),
        feeWallet: FEE_WALLET_ADDRESS,
      })

      // Add timestamp to make transaction unique
      const timestamp = Date.now()
      const randomFactor = Math.floor(Math.random() * 10000)
      const uniqueAmount = 0.001 + ((timestamp % 10000) + randomFactor) / 1000000 // Add microseconds for uniqueness

      // Call server API to create transaction
      const response = await fetch('/api/test/create-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          recipientAddress: FEE_WALLET_ADDRESS,
          amount: uniqueAmount,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        setServerResult(`❌ Server API error: ${errorText}`)
        return
      }

      const { serializedTransaction } = await response.json()

      logger.info('Server-side transaction received', {
        transactionLength: serializedTransaction.length,
      })

      // Deserialize transaction
      setServerResult('🔄 Deserializing server-side transaction...')
      const transaction = Transaction.from(Buffer.from(serializedTransaction, 'base64'))

      logger.info('Server-side transaction deserialized', {
        instructions: transaction.instructions.length,
        feePayer: transaction.feePayer?.toString(),
        recentBlockhash: transaction.recentBlockhash,
      })

      // Simulate transaction BEFORE signing
      setServerResult('🔄 Simulating server-side transaction...')
      const config = getConfig()
      const connection = new Connection(config.rpcPublicEndpoint)
      const simulation = await connection.simulateTransaction(transaction)

      logger.info('Server-side simulation result', {
        success: !simulation.value.err,
        error: simulation.value.err,
        logs: simulation.value.logs,
      })

      if (simulation.value.err) {
        setServerResult(`❌ Server simulation failed: ${JSON.stringify(simulation.value.err)}`)
        return
      }

      // Sign transaction
      setServerResult('🔄 Signing server-side transaction...')
      const signedTransaction = await signTransaction(transaction)

      logger.info('Server-side transaction signed successfully')

      // Send transaction
      setServerResult('🔄 Sending server-side transaction...')
      const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      })

      logger.info('Server-side transaction sent', { signature })

      // Confirm transaction
      const confirmation = await connection.confirmTransaction(signature, 'confirmed')

      if (confirmation.value.err) {
        setServerResult(`❌ Server transaction failed: ${JSON.stringify(confirmation.value.err)}`)
      } else {
        setServerResult(`✅ Server transaction successful: ${signature}`)
      }
    } catch (error) {
      logger.error('Server-side transaction error', error)
      setServerResult(`❌ Server error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsServerTesting(false)
    }
  }

  return (
    <div className='container mx-auto space-y-6 p-8'>
      <div className='space-y-4 text-center'>
        <h1 className='text-3xl font-bold'>Transaction Construction Test</h1>
        <p className='text-muted-foreground'>Test client-side vs server-side transaction construction with Phantom wallet</p>

        {!publicKey && (
          <div className='flex justify-center'>
            <WalletConnectionButton />
          </div>
        )}
      </div>

      {publicKey && (
        <div className='grid gap-6 md:grid-cols-2'>
          {/* Client-Side Test */}
          <Card>
            <CardHeader>
              <CardTitle className='text-green-600'>Client-Side Transaction</CardTitle>
              <CardDescription>Constructs transaction entirely on the client using @solana/web3.js</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <Button onClick={testClientSideTransaction} disabled={isClientTesting} className='w-full'>
                {isClientTesting ? 'Testing...' : 'Test Client-Side (0.001 SOL)'}
              </Button>

              <div className='bg-muted min-h-20 rounded-lg p-4'>
                <p className='font-mono text-sm whitespace-pre-wrap'>{clientResult || 'No test run yet'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Server-Side Test */}
          <Card>
            <CardHeader>
              <CardTitle className='text-blue-600'>Server-Side Transaction</CardTitle>
              <CardDescription>Constructs transaction on the server and signs on client</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <Button onClick={testServerSideTransaction} disabled={isServerTesting} className='w-full' variant='outline'>
                {isServerTesting ? 'Testing...' : 'Test Server-Side (0.001 SOL)'}
              </Button>

              <div className='bg-muted min-h-20 rounded-lg p-4'>
                <p className='font-mono text-sm whitespace-pre-wrap'>{serverResult || 'No test run yet'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className='space-y-2 text-center'>
        <p className='text-muted-foreground text-sm'>Fee Wallet: {FEE_WALLET_ADDRESS}</p>
        <p className='text-muted-foreground text-xs'>
          Both tests send ~0.001 SOL to the fee wallet with unique amounts to prevent conflicts
        </p>
        <p className='text-xs text-orange-600'>💡 Wait a few seconds between tests to ensure fresh blockhashes</p>
        <div className='flex justify-center gap-2'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => {
              setClientResult('')
              setServerResult('')
            }}
          >
            Clear Results
          </Button>
        </div>
      </div>
    </div>
  )
}

export default TestPage

import { type NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL, TransactionInstruction } from '@solana/web3.js'
import { z } from 'zod'
import { getLogger } from '@/lib/logger/logger'

const logger = getLogger({ context: 'test-api' })

const requestSchema = z.object({
  walletAddress: z.string(),
  recipientAddress: z.string(),
  amount: z.number().min(0.001).max(2), // Between 0.001 and 2 SOL to allow for unique amounts
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { walletAddress, recipientAddress, amount } = requestSchema.parse(body)

    logger.info('Creating test transaction', {
      walletAddress,
      recipientAddress,
      amount,
    })

    // Use private RPC endpoint for server-side operations
    const rpcEndpoint = process.env.RPC_PRIVATE_ENDPOINT || 'https://api.devnet.solana.com'
    const connection = new Connection(rpcEndpoint)

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash('finalized')

    // Create transaction
    const transaction = new Transaction({
      feePayer: new PublicKey(walletAddress),
      recentBlockhash: blockhash,
    })

    // Add memo instruction for absolute uniqueness
    const timestamp = Date.now()
    const randomFactor = Math.floor(Math.random() * 10000)
    const memoData = `SERVER-TEST-${timestamp}-${randomFactor}-${amount}`
    const memoInstruction = new TransactionInstruction({
      keys: [],
      programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'), // Memo program
      data: Buffer.from(memoData, 'utf8'),
    })

    // Add transfer instruction
    const transferInstruction = SystemProgram.transfer({
      fromPubkey: new PublicKey(walletAddress),
      toPubkey: new PublicKey(recipientAddress),
      lamports: Math.floor(amount * LAMPORTS_PER_SOL),
    })

    transaction.add(memoInstruction)
    transaction.add(transferInstruction)

    logger.info('Server-side transaction created', {
      instructions: transaction.instructions.length,
      feePayer: transaction.feePayer?.toString(),
      recentBlockhash: transaction.recentBlockhash,
      memoData,
      timestamp,
      randomFactor,
    })

    // Simulate transaction on server
    const simulation = await connection.simulateTransaction(transaction)

    logger.info('Server-side simulation result', {
      success: !simulation.value.err,
      error: simulation.value.err,
      logs: simulation.value.logs?.slice(0, 5), // Only first 5 logs
    })

    if (simulation.value.err) {
      logger.error('Server-side simulation failed', { error: simulation.value.err })
      return NextResponse.json({ error: 'Transaction simulation failed', details: simulation.value.err }, { status: 400 })
    }

    // Serialize transaction
    const serializedTransaction = Buffer.from(transaction.serialize({ requireAllSignatures: false })).toString('base64')

    logger.info('Transaction serialized successfully', {
      serializedLength: serializedTransaction.length,
    })

    return NextResponse.json({
      success: true,
      serializedTransaction,
      simulationLogs: simulation.value.logs?.slice(0, 3), // Include some logs for debugging
    })
  } catch (error) {
    logger.error('Test transaction creation failed', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Failed to create transaction', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

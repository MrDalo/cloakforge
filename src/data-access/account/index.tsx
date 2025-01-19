/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { useTransactionToast } from '@/components/ui/useTransactionToast'
import { createLogger } from '@/lib/logger/logger'
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  TransactionSignature,
  VersionedTransaction,
} from '@solana/web3.js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'sonner'

const logger = createLogger({
  action: 'Account data access functions',
  file: 'data-access/account/index.tsx',
})

export const useGetBalanceQuery = ({ address }: { address: PublicKey }) => {
  const { connection } = useConnection()

  return useQuery({
    queryKey: ['get-balance', { endpoint: connection.rpcEndpoint, address }],
    queryFn: async () => {
      const balance = await connection.getBalance(address)
      const solanaPrice = await getSolanaPrice()
      return {
        balance,
        solanaPrice,
      }
    },
  })
}

export const useGetSignaturesQuery = ({ address }: { address: PublicKey }) => {
  const { connection } = useConnection()

  return useQuery({
    queryKey: ['get-signatures', { endpoint: connection.rpcEndpoint, address }],
    queryFn: () => connection.getSignaturesForAddress(address),
  })
}

export const useGetTokenAccountsQuery = ({
  address,
}: {
  address: PublicKey
}) => {
  const { connection } = useConnection()

  return useQuery({
    queryKey: [
      'get-token-accounts',
      { endpoint: connection.rpcEndpoint, address },
    ],
    queryFn: async () => {
      const [tokenAccounts, token2022Accounts] = await Promise.all([
        connection.getParsedTokenAccountsByOwner(address, {
          programId: TOKEN_PROGRAM_ID,
        }),
        connection.getParsedTokenAccountsByOwner(address, {
          programId: TOKEN_2022_PROGRAM_ID,
        }),
      ])
      return [...tokenAccounts.value, ...token2022Accounts.value]
    },
  })
}

export const useTransferSolMutation = ({ address }: { address: PublicKey }) => {
  const { connection } = useConnection()
  const transactionToast = useTransactionToast()
  const wallet = useWallet()
  const client = useQueryClient()

  return useMutation({
    mutationKey: [
      'transfer-sol',
      { endpoint: connection.rpcEndpoint, address },
    ],
    mutationFn: async (input: { destination: PublicKey; amount: number }) => {
      let signature: TransactionSignature = ''
      try {
        const { transaction, latestBlockhash } = await createTransaction({
          publicKey: address,
          destination: input.destination,
          amount: input.amount,
          connection,
        })

        // Send transaction and await for signature
        signature = await wallet.sendTransaction(transaction, connection)

        // Send transaction and await for signature
        await connection.confirmTransaction(
          { signature, ...latestBlockhash },
          'confirmed'
        )

        return signature
      } catch (error: unknown) {
        logger.error(`Transaction failed! ${error}`, signature)

        return
      }
    },
    onSuccess: (signature) => {
      if (signature) {
        transactionToast(signature)
      }
      return Promise.all([
        client.invalidateQueries({
          queryKey: [
            'get-balance',
            { endpoint: connection.rpcEndpoint, address },
          ],
        }),
        client.invalidateQueries({
          queryKey: [
            'get-signatures',
            { endpoint: connection.rpcEndpoint, address },
          ],
        }),
      ])
    },
    onError: (error) => {
      toast.error(`Transaction failed! ${error}`)
    },
  })
}

export const useRequestAirdropMutation = ({
  address,
}: {
  address: PublicKey
}) => {
  const { connection } = useConnection()
  const transactionToast = useTransactionToast()
  const client = useQueryClient()

  return useMutation({
    mutationKey: ['airdrop', { endpoint: connection.rpcEndpoint, address }],
    mutationFn: async (amount: number = 1) => {
      const [latestBlockhash, signature] = await Promise.all([
        connection.getLatestBlockhash(),
        connection.requestAirdrop(address, amount * LAMPORTS_PER_SOL),
      ])

      await connection.confirmTransaction(
        { signature, ...latestBlockhash },
        'confirmed'
      )
      return signature
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      return Promise.all([
        client.invalidateQueries({
          queryKey: [
            'get-balance',
            { endpoint: connection.rpcEndpoint, address },
          ],
        }),
        client.invalidateQueries({
          queryKey: [
            'get-signatures',
            { endpoint: connection.rpcEndpoint, address },
          ],
        }),
      ])
    },
  })
}

export const getSolanaPrice = async (): Promise<number> => {
  try {
    const response = await axios.get('https://api.coincap.io/v2/rates/solana')
    return response.data.data.rateUsd
  } catch (error) {
    logger.error('Failed to fetch Solana price:', error)
    return 0
  }
}

async function createTransaction({
  publicKey,
  destination,
  amount,
  connection,
}: {
  publicKey: PublicKey
  destination: PublicKey
  amount: number
  connection: Connection
}): Promise<{
  transaction: VersionedTransaction
  latestBlockhash: { blockhash: string; lastValidBlockHeight: number }
}> {
  // Get the latest blockhash to use in our transaction
  const latestBlockhash = await connection.getLatestBlockhash()

  // Create instructions to send, in this case a simple transfer
  const instructions = [
    SystemProgram.transfer({
      fromPubkey: publicKey,
      toPubkey: destination,
      lamports: amount * LAMPORTS_PER_SOL,
    }),
  ]

  // Create a new TransactionMessage with version and compile it to legacy
  const messageLegacy = new TransactionMessage({
    payerKey: publicKey,
    recentBlockhash: latestBlockhash.blockhash,
    instructions,
  }).compileToLegacyMessage()

  // Create a new VersionedTransaction which supports legacy and v0
  const transaction = new VersionedTransaction(messageLegacy)

  return {
    transaction,
    latestBlockhash,
  }
}

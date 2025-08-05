/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { getLogger } from '@/lib/logger/logger'
import { createTransaction } from '@/lib/solana/utils'
import { showTransactionToast } from '@/lib/toast/showTransactionToast'
import getStatusCodeFromError from '@/lib/utils/getStatusCodeFromError'
import getUserErrorMessageFromStatusCode from '@/lib/utils/getUserErrorMessageFromStatusCode'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, TransactionSignature } from '@solana/web3.js'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export const useTransferSolMutation = ({ address }: { address: PublicKey }) => {
  const logger = getLogger({
    file: 'useTransferSolMutation.ts',
  })

  const { connection } = useConnection()
  const wallet = useWallet()
  const client = useQueryClient()

  return useMutation({
    mutationKey: ['transfer-sol', { endpoint: connection.rpcEndpoint, address }],
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
        await connection.confirmTransaction({ signature, ...latestBlockhash }, 'confirmed')

        return signature
      } catch (error: unknown) {
        logger.error('Transaction failed:', error, { signature })
        return
      }
    },
    onSuccess: (signature) => {
      if (signature) {
        showTransactionToast(signature)
      }
      return Promise.all([
        client.invalidateQueries({
          queryKey: ['get-balance', { endpoint: connection.rpcEndpoint, address }],
        }),
        client.invalidateQueries({
          queryKey: ['get-signatures', { endpoint: connection.rpcEndpoint, address }],
        }),
      ])
    },
    onError: (error) => {
      const statusCode = getStatusCodeFromError(error)
      const userFriendlyMessage = getUserErrorMessageFromStatusCode(statusCode)

      logger.error('Transfer mutation error:', error)
      toast.error(userFriendlyMessage)
    },
  })
}

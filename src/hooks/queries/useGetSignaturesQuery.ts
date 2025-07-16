/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { TransactionData } from '@/components/pages/AccountPage/TransactionTable/types'
import { createLogger } from '@/lib/logger/logger'
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { useConnection } from '@solana/wallet-adapter-react'
import { PublicKey, SystemProgram, ParsedInstruction } from '@solana/web3.js'
import { keepPreviousData, useQuery } from '@tanstack/react-query'

const logger = createLogger({
  action: 'useGetTransactionsQuery',
  file: 'useGetTransactionsQuery.tsx',
})

export const useGetTransactionsQuery = ({
  address,
  page,
  limit = 10,
}: {
  address: PublicKey
  page: number
  limit?: number
}) => {
  const { connection } = useConnection()

  return useQuery({
    queryKey: [
      'get-transactions',
      { endpoint: connection.rpcEndpoint, address, page, limit },
    ],
    queryFn: async () => {
      if (!address) throw new Error('Address is required')

      try {
        const beforeSignature =
          page > 1
            ? (
                await connection.getSignaturesForAddress(address, {
                  limit: (page - 1) * limit,
                })
              ).pop()?.signature
            : undefined

        const signatures = await connection.getSignaturesForAddress(address, {
          limit,
          before: beforeSignature,
        })

        if (!signatures.length) {
          return { transactions: [], totalPages: 0 }
        }

        const transactionDetails = await Promise.all(
          signatures.map(async (signatureInfo) => {
            const tx = await connection.getParsedTransaction(
              signatureInfo.signature,
              {
                commitment: 'confirmed',
                maxSupportedTransactionVersion: 0,
              }
            )
            if (!tx || !tx.meta) return null

            const { meta, transaction } = tx
            const transferInstruction = transaction.message.instructions.find(
              (inst): inst is ParsedInstruction =>
                inst.programId.equals(SystemProgram.programId) ||
                inst.programId.equals(TOKEN_PROGRAM_ID) ||
                inst.programId.equals(TOKEN_2022_PROGRAM_ID)
            )

            const amountFromInstruction = transferInstruction?.parsed?.info
              ?.lamports
              ? transferInstruction.parsed.info.lamports / 1e9
              : null
            const amount =
              amountFromInstruction ??
              (meta.postBalances[0] - meta.preBalances[0]) / 1e9

            const source = transferInstruction?.parsed?.info?.source || null
            const destination =
              transferInstruction?.parsed?.info?.destination || null
            const isIncoming =
              destination === address.toBase58() &&
              source !== address.toBase58()
            const status = signatureInfo.confirmationStatus as
              | 'processed'
              | 'confirmed'
              | 'finalized'
            const isSuccess = status === 'finalized' ? meta.err === null : null

            return {
              signature: transaction.signatures[0],
              block: tx.slot,
              time: tx.blockTime,
              source,
              destination,
              fee: meta.fee / 1e9,
              amount,
              isIncoming,
              status,
              isSuccess,
            }
          })
        )

        const totalSignatures =
          await connection.getSignaturesForAddress(address)
        const totalPages = Math.ceil(totalSignatures.length / limit)

        return {
          transactions: transactionDetails.filter(Boolean) as TransactionData[],
          totalPages,
        }
      } catch (error) {
        logger.error(`Error fetching transactions: ${error}`)
        throw error
      }
    },
    enabled: !!address,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    staleTime: Infinity, // Prevents data from being marked stale
    gcTime: Infinity, // Prevents data from being garbage collected
  })
}

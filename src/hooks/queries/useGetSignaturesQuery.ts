/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { TransactionData } from '@/components/account-page/transaction-table/types'
import { createLogger } from '@/lib/logger/logger'
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { useConnection } from '@solana/wallet-adapter-react'
import { PublicKey, SystemProgram, ParsedInstruction } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'

const logger = createLogger({
  action: 'useGetTransactionsQuery',
  file: 'useGetTransactionsQuery.tsx',
})

export const useGetTransactionsQuery = ({
  address,
}: {
  address: PublicKey
}) => {
  const { connection } = useConnection()

  return useQuery({
    queryKey: [
      'get-transactions',
      { endpoint: connection.rpcEndpoint, address },
    ],
    queryFn: async () => {
      if (!address) throw new Error('Address is required')

      try {
        // Fetch signatures for the given address
        const signatures = await connection.getSignaturesForAddress(address)

        logger.info(
          `Fetched ${signatures.length} signatures: ${JSON.stringify(signatures)}`
        )
        // Fetch and parse transaction details for each signature
        const transactionDetails = await Promise.all(
          signatures.map(async (signatureInfo) => {
            const tx = await connection.getParsedTransaction(
              signatureInfo.signature,
              'confirmed'
            )
            if (!tx || !tx.meta) return null

            const { meta, transaction } = tx

            // Extract transfer instruction
            const transferInstruction = transaction.message.instructions.find(
              (inst): inst is ParsedInstruction =>
                inst.programId.equals(SystemProgram.programId) || // System Program
                inst.programId.equals(TOKEN_PROGRAM_ID) || // SPL Token Program
                inst.programId.equals(TOKEN_2022_PROGRAM_ID) // Token 2022 Program
            )

            // Attempt to get the transferred amount from the parsed instruction
            const amountFromInstruction = transferInstruction?.parsed?.info
              ?.lamports
              ? transferInstruction.parsed.info.lamports / 1e9 // Convert lamports to SOL
              : null

            // Fallback to balance differences if instruction data is not available
            const amount =
              amountFromInstruction ??
              (meta.postBalances[0] - meta.preBalances[0]) / 1e9 // Net change in SOL

            // Get the source and destination from the instruction, if available
            const source = transferInstruction?.parsed?.info?.source || null
            const destination =
              transferInstruction?.parsed?.info?.destination || null

            // Determine if the transaction is incoming
            const isIncoming =
              destination === address.toBase58() &&
              source !== address.toBase58()

            // Get the confirmation status
            const status = signatureInfo.confirmationStatus as
              | 'processed'
              | 'confirmed'
              | 'finalized'

            // Determine if the transaction was successful (only for finalized transactions)
            const isSuccess = status === 'finalized' ? meta.err === null : null

            return {
              signature: transaction.signatures[0], // Transaction signature
              block: tx.slot, // Slot/block number
              time: tx.blockTime, // Block time (timestamp)
              source, // Source account
              destination, // Destination account
              fee: meta.fee / 1e9, // Transaction fee in SOL
              amount, // Transferred amount in SOL
              isIncoming, // Whether the transaction is incoming
              status, // Confirmation status of the transaction
              isSuccess, // Whether the transaction was successful (null for pending)
            }
          })
        )
        logger.info(
          `Fetched ${transactionDetails.length} transactions: ${JSON.stringify(transactionDetails)}`
        )

        // Filter out null transactions
        return transactionDetails.filter(Boolean) as TransactionData[]
      } catch (error) {
        logger.error(`Error fetching transactions: ${error}`)
        throw error
      }
    },
    enabled: !!address,
  })
}

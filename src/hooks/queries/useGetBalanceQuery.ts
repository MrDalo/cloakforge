import { getSolanaPrice } from '@/lib/solana'
import { useConnection } from '@solana/wallet-adapter-react'
import { type PublicKey } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'

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
    enabled: !!address,
    staleTime: 2 * 60 * 1000, // 2 minutes - longer cache for price data
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnReconnect: false, // Don't refetch on network reconnect
    retry: 1, // Only retry once on failure
  })
}

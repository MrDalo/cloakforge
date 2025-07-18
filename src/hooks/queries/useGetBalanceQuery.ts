/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { getSolanaPrice } from '@/lib/solana/utils'
import { useConnection } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
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
	})
}

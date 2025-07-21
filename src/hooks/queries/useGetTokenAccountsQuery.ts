/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { PublicKey } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'
import { RouteHandlerResponseBaseType } from '@/types/global'
import { TokenAccountsReponseType } from '@/app/api/solana/token-accounts/route-commented'
import { getLogger } from '@/lib/logger/logger'

export const useGetTokenAccountsQuery = ({ walletaddress }: { walletaddress: PublicKey }) =>
  useQuery({
    queryKey: ['get-token-accounts', { walletaddress }],
    queryFn: async (): Promise<TokenAccountsReponseType[]> => {
      const logger = getLogger({
        file: 'useGetTokenAccountsQuery.tsx',
      })

      const response = await fetch('/api/solana/token-accounts', {
        method: 'POST',
        body: JSON.stringify({ walletAddress: walletaddress.toBase58() }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        logger.error('Failed to fetch token accounts')
        throw new Error('Failed to fetch token accounts')
      }

      const data: RouteHandlerResponseBaseType<TokenAccountsReponseType[]> = await response.json()

      if (!data.success) {
        logger.error('Failed to fetch token accounts. Status success false')
        throw new Error('Failed to fetch token accounts')
      }

      return data.data
    },
    enabled: !!walletaddress,
  })

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { PublicKey } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'
import { TokenAccountsReponseType } from '@/app/api/solana/token-accounts/route'
import { getLogger } from '@/lib/logger/logger'
import { handleApiResponse } from '@/lib/utils/handleApiResponse'
import type { ApiResponseBase } from '@/types/error'

export const useGetTokenAccountsQuery = ({ walletaddress }: { walletaddress: PublicKey }) =>
  useQuery({
    queryKey: ['get-token-accounts', { walletaddress }],
    queryFn: async (): Promise<TokenAccountsReponseType[]> => {
      const logger = getLogger({
        context: 'query',
        hook: 'useGetTokenAccountsQuery',
        walletAddress: walletaddress.toBase58(),
      })

      logger.info('Fetching token accounts', { walletAddress: walletaddress.toBase58() })

      const response = await fetch('/api/solana/token-accounts', {
        method: 'POST',
        body: JSON.stringify({ walletAddress: walletaddress.toBase58() }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data: ApiResponseBase<TokenAccountsReponseType[]> = await response.json()

      // Use handleApiResponse to process the response and throw user-friendly errors
      const result = handleApiResponse(data)

      logger.info('Successfully fetched token accounts', {
        walletAddress: walletaddress.toBase58(),
        tokenCount: result.length,
      })

      return result
    },
    enabled: !!walletaddress,
  })

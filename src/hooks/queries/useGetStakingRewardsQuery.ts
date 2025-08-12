/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { PublicKey } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'
import { StakingRewardsResponseType } from '@/app/api/solana/stake-accounts/route'
import { getLogger } from '@/lib/logger/logger'
import { handleApiResponse } from '@/lib/utils/handleApiResponse'
import type { ApiResponseBase } from '@/types/error'

export const useGetStakingRewardsQuery = ({ walletAddress }: { walletAddress: PublicKey }) =>
  useQuery({
    queryKey: ['get-staking-rewards', { walletAddress: walletAddress.toBase58() }],
    queryFn: async (): Promise<StakingRewardsResponseType> => {
      const logger = getLogger({
        context: 'query',
        hook: 'useGetStakingRewardsQuery',
        walletAddress: walletAddress.toBase58(),
      })

      logger.info('Fetching staking rewards', { walletAddress: walletAddress.toBase58() })

      const response = await fetch('/api/solana/stake-accounts', {
        method: 'POST',
        body: JSON.stringify({ walletAddress: walletAddress.toBase58() }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data: ApiResponseBase<StakingRewardsResponseType> = await response.json()

      // Use handleApiResponse to process the response and throw user-friendly errors
      const result = handleApiResponse(data)

      logger.info('Successfully fetched staking rewards', {
        walletAddress: walletAddress.toBase58(),
        totalStaked: result.total_staked,
        totalRewards: result.total_rewards,
        stakeAccountsCount: result.stake_accounts.length,
      })

      return result
    },
    enabled: !!walletAddress,
  })

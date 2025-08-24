import { NextResponse } from 'next/server'
import { Connection, PublicKey, LAMPORTS_PER_SOL, StakeProgram } from '@solana/web3.js'
import getConfig from '@/lib/config/config'
import { getLogger } from '@/lib/logger/logger'
import { APP_ERROR_CODES } from '@/lib/utils/appErrorCodes'
import { SOLANA_ERROR_CODES } from '@/lib/utils/solanaErrorCodes'
import getUserErrorMessageFromError from '@/lib/utils/getUserErrorMessageFromError'
import getStatusCodeFromError from '@/lib/utils/getStatusCodeFromError'
import type { ApiResponseBase } from '@/types/error'

const logger = getLogger({
  context: 'api',
  route: '/api/solana/stake-accounts',
  method: 'POST',
})

export type StakeAccountResponseType = {
  stake_account_address: string
  validator_address: string | null
  validator_name: string | null
  stake_amount: number // in SOL
  rewards_earned: number // in SOL
  activation_epoch: number | null
  deactivation_epoch: number | null
  status: 'active' | 'inactive' | 'activating' | 'deactivating'
  last_reward_epoch: number | null
}

export type StakingRewardsResponseType = {
  total_staked: number // in SOL
  total_rewards: number // in SOL
  active_stake_accounts: number
  inactive_stake_accounts: number
  stake_accounts: StakeAccountResponseType[]
}

export async function POST(request: Request): Promise<NextResponse<ApiResponseBase<StakingRewardsResponseType>>> {
  try {
    const { walletAddress } = await request.json()

    if (!walletAddress) {
      logger.error('Missing wallet address')
      return NextResponse.json(
        {
          status: 'error',
          status_code: 400,
          error_message: 'Missing wallet address',
          error_code: APP_ERROR_CODES.MISSING_REQUIRED_FIELD,
          data: {} as StakingRewardsResponseType,
        },
        { status: 400 }
      )
    }

    const { rpcEndpoint } = getConfig()
    const connection = new Connection(rpcEndpoint)

    let walletPubkey: PublicKey
    try {
      walletPubkey = new PublicKey(walletAddress)
    } catch (error) {
      logger.error('Invalid wallet address format', error, { walletAddress })
      return NextResponse.json(
        {
          status: 'error',
          status_code: 400,
          error_message: 'Invalid wallet address format',
          error_code: SOLANA_ERROR_CODES.INVALID_WALLET_ADDRESS,
          data: {} as StakingRewardsResponseType,
        },
        { status: 400 }
      )
    }

    // Find all stake accounts owned by this wallet
    const stakeAccounts = await connection.getParsedProgramAccounts(StakeProgram.programId, {
      filters: [
        {
          memcmp: {
            offset: 12, // Offset for stake authority in stake account
            bytes: walletPubkey.toBase58(),
          },
        },
      ],
    })

    if (stakeAccounts.length === 0) {
      return NextResponse.json({
        status: 'success',
        status_code: 200,
        error_message: '',
        data: {
          total_staked: 0,
          total_rewards: 0,
          active_stake_accounts: 0,
          inactive_stake_accounts: 0,
          stake_accounts: [],
        },
      })
    }

    // Get current epoch for status determination
    const epochInfo = await connection.getEpochInfo()
    const currentEpoch = epochInfo.epoch

    // Process each stake account
    const processedStakeAccounts: StakeAccountResponseType[] = []
    let totalStaked = 0
    let totalRewards = 0
    let activeCount = 0
    let inactiveCount = 0

    for (const stakeAccount of stakeAccounts) {
      try {
        const accountData = stakeAccount.account.data
        if (accountData && 'parsed' in accountData) {
          const parsedData = accountData.parsed
          const stakeAccountAddress = stakeAccount.pubkey.toBase58()

          // Extract stake information
          const stakeInfo = parsedData.info?.stake
          const metaInfo = parsedData.info?.meta

          if (!stakeInfo || !metaInfo) {
            logger.warn('Invalid stake account data', { stakeAccountAddress })
            continue
          }

          const delegatedStake = stakeInfo.delegation
          const stakeAmount = (metaInfo.rentExemptReserve + (delegatedStake?.stake || 0)) / LAMPORTS_PER_SOL

          // Calculate rewards (current balance - original stake)
          const currentBalance = stakeAccount.account.lamports / LAMPORTS_PER_SOL
          const rewards = Math.max(0, currentBalance - stakeAmount)

          // Determine status
          let status: StakeAccountResponseType['status'] = 'inactive'
          if (delegatedStake) {
            const activationEpoch = delegatedStake.activationEpoch
            const deactivationEpoch = delegatedStake.deactivationEpoch

            if (activationEpoch && activationEpoch <= currentEpoch) {
              if (deactivationEpoch && deactivationEpoch <= currentEpoch) {
                status = 'deactivating'
              } else if (deactivationEpoch === null || deactivationEpoch > currentEpoch) {
                status = 'active'
              }
            } else if (activationEpoch && activationEpoch > currentEpoch) {
              status = 'activating'
            }
          }

          // Get validator info (if delegated)
          let validatorAddress: string | null = null
          let validatorName: string | null = null
          if (delegatedStake?.voter) {
            validatorAddress = delegatedStake.voter
            // Note: Getting validator names requires additional API calls to validator registries
            // For now, we'll just use the validator address
            if (validatorAddress) {
              validatorName = `Validator ${validatorAddress.slice(0, 8)}...`
            }
          }

          const stakeAccountInfo: StakeAccountResponseType = {
            stake_account_address: stakeAccountAddress,
            validator_address: validatorAddress,
            validator_name: validatorName,
            stake_amount: stakeAmount,
            rewards_earned: rewards,
            activation_epoch: delegatedStake?.activationEpoch || null,
            deactivation_epoch: delegatedStake?.deactivationEpoch || null,
            status,
            last_reward_epoch: currentEpoch - 1, // Rewards are distributed each epoch
          }

          processedStakeAccounts.push(stakeAccountInfo)

          // Update totals
          totalStaked += stakeAmount
          totalRewards += rewards
          if (status === 'active') {
            activeCount++
          } else {
            inactiveCount++
          }
        }
      } catch (error) {
        logger.error('Error processing stake account', error, {
          stakeAccountAddress: stakeAccount.pubkey.toBase58(),
        })
        continue
      }
    }

    const stakingData: StakingRewardsResponseType = {
      total_staked: totalStaked,
      total_rewards: totalRewards,
      active_stake_accounts: activeCount,
      inactive_stake_accounts: inactiveCount,
      stake_accounts: processedStakeAccounts,
    }

    return NextResponse.json({
      status: 'success',
      status_code: 200,
      error_message: '',
      data: stakingData,
    })
  } catch (error) {
    logger.error('Failed to fetch stake accounts', error, {
      action: 'fetchStakeAccounts',
    })

    const statusCode = getStatusCodeFromError(error)
    const errorMessage = getUserErrorMessageFromError(error, SOLANA_ERROR_CODES.RPC_ERROR)

    return NextResponse.json(
      {
        status: 'error',
        status_code: statusCode,
        error_message: errorMessage,
        error_code: SOLANA_ERROR_CODES.RPC_ERROR,
        data: {} as StakingRewardsResponseType,
      },
      { status: statusCode }
    )
  }
}

import type { AdditionalFeeConfig } from '@/hooks/solana/useFeeCalculation'

/**
 * Pre-defined additional fee configurations for common tool features
 */
const commonAdditionalFees = {
  // Token Creator fees
  revokeMintAuthority: (): AdditionalFeeConfig => ({
    fieldName: 'revokeMintAuthority',
    label: 'Revoke Mint Authority',
    description: 'Permanently revoke the ability to mint additional tokens',
    fee: 0.05, // 0.05 SOL
  }),

  revokeFreezeAuthority: (): AdditionalFeeConfig => ({
    fieldName: 'revokeFreezeAuthority',
    label: 'Revoke Freeze Authority',
    description: 'Permanently revoke the ability to freeze token accounts',
    fee: 0.05, // 0.05 SOL
  }),
}

/**
 * Tool-specific fee configurations
 * Maps tool IDs to functions that return their available additional fees based on form data
 */
export const toolFeeConfigs = {
  'token-creator': (): AdditionalFeeConfig[] => [commonAdditionalFees.revokeMintAuthority(), commonAdditionalFees.revokeFreezeAuthority()],

  'transaction-multisender': (): AdditionalFeeConfig[] => [],

  'burn-tokens': (): AdditionalFeeConfig[] => [], // No additional fees for this tool - only base fees apply

  'revoke-mint-authority': (): AdditionalFeeConfig[] => [], // No additional fees for this tool - only base fees apply

  'revoke-freeze-authority': (): AdditionalFeeConfig[] => [], // No additional fees for this tool - only base fees apply

  'revoke-metadata-authority': (): AdditionalFeeConfig[] => [], // No additional fees for this tool - only base fees apply

  'update-metadata': (): AdditionalFeeConfig[] => [], // No additional fees for this tool - only base fees apply

  'liquidity-provider': (): AdditionalFeeConfig[] => [],

  'freeze-wallets': (): AdditionalFeeConfig[] => [],

  'unfreeze-wallets': (): AdditionalFeeConfig[] => [],

  'token-auditor': (): AdditionalFeeConfig[] => [], // No additional fees for this tool - only base fees apply
} as const

export type ToolId = keyof typeof toolFeeConfigs

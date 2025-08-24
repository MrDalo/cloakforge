import type { AdditionalFeeConfig } from '@/hooks/useFeeCalculation'

/**
 * Pre-defined additional fee configurations for common tool features
 */
export const commonAdditionalFees = {
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

  // Transaction Multisender fees
  bulkSend: (recipients: number): AdditionalFeeConfig => ({
    fieldName: 'bulkSend',
    label: 'Bulk Send Processing',
    description: `Processing fee for ${recipients} recipients`,
    fee: Math.max(0.001 * recipients, 0.01), // 0.001 SOL per recipient, minimum 0.01 SOL
  }),

  // Burn Tokens fees
  burnAll: (): AdditionalFeeConfig => ({
    fieldName: 'burnAll',
    label: 'Burn All Tokens',
    description: 'Burn entire token supply',
    fee: 0.05, // 0.05 SOL
  }),

  // Liquidity Pool fees
  createMetadata: (): AdditionalFeeConfig => ({
    fieldName: 'createMetadata',
    label: 'Create Pool Metadata',
    description: 'Create metadata for liquidity pool',
    fee: 0.05, // 0.05 SOL
  }),

  // Priority fees
  priorityProcessing: (level: 'low' | 'medium' | 'high' = 'medium'): AdditionalFeeConfig => {
    const priorityFees = {
      low: 0.001,
      medium: 0.005,
      high: 0.01,
    }

    return {
      fieldName: 'priorityProcessing',
      label: `Priority Processing (${level.toUpperCase()})`,
      description: `${level.charAt(0).toUpperCase() + level.slice(1)} priority for faster transaction processing`,
      fee: priorityFees[level],
    }
  },
}

/**
 * Tool-specific fee configurations
 * Maps tool IDs to functions that return their available additional fees based on form data
 */
export const toolFeeConfigs = {
  'token-creator': (): AdditionalFeeConfig[] => [commonAdditionalFees.revokeMintAuthority(), commonAdditionalFees.revokeFreezeAuthority()],

  'transaction-multisender': (formData?: Record<string, unknown>): AdditionalFeeConfig[] => {
    const recipients = (formData?.recipients as string[]) || []
    const recipientCount = recipients.length

    if (recipientCount > 0) {
      return [commonAdditionalFees.bulkSend(recipientCount)]
    }
    return []
  },

  'burn-tokens': (): AdditionalFeeConfig[] => [commonAdditionalFees.burnAll()],

  'revoke-mint-authority': (): AdditionalFeeConfig[] => [], // No additional fees for this tool - only base fees apply

  'revoke-freeze-authority': (): AdditionalFeeConfig[] => [], // No additional fees for this tool - only base fees apply

  'create-liquidity': (formData?: Record<string, unknown>): AdditionalFeeConfig[] => {
    const fees: AdditionalFeeConfig[] = [commonAdditionalFees.createMetadata()]

    // Add priority fee if specified
    const priorityLevel = formData?.priorityFee as 'low' | 'medium' | 'high' | undefined
    if (priorityLevel) {
      fees.push(commonAdditionalFees.priorityProcessing(priorityLevel))
    }

    return fees
  },

  'freeze-accounts': (): AdditionalFeeConfig[] => [], // No additional fees for this tool - only base fees apply

  'unfreeze-accounts': (): AdditionalFeeConfig[] => [], // No additional fees for this tool - only base fees apply

  'token-auditor': (): AdditionalFeeConfig[] => [], // No additional fees for this tool - only base fees apply
} as const

export type ToolId = keyof typeof toolFeeConfigs

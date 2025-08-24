import type { AdditionalFeeConfig } from '@/hooks/useFeeCalculation'

/**
 * Pre-defined additional fee configurations for common tool features
 */
export const commonAdditionalFees = {
  // Token Creator fees
  revokeMintAuthority: (isEnabled: boolean): AdditionalFeeConfig => ({
    fieldName: 'revokeMintAuthority',
    label: 'Revoke Mint Authority',
    description: 'Permanently revoke the ability to mint additional tokens',
    fee: 0.05, // 0.05 SOL
    isEnabled,
  }),

  revokeFreezeAuthority: (isEnabled: boolean): AdditionalFeeConfig => ({
    fieldName: 'revokeFreezeAuthority',
    label: 'Revoke Freeze Authority',
    description: 'Permanently revoke the ability to freeze token accounts',
    fee: 0.05, // 0.05 SOL
    isEnabled,
  }),

  // Transaction Multisender fees
  bulkSend: (isEnabled: boolean, recipients: number): AdditionalFeeConfig => ({
    fieldName: 'bulkSend',
    label: 'Bulk Send Processing',
    description: `Processing fee for ${recipients} recipients`,
    fee: Math.max(0.001 * recipients, 0.01), // 0.001 SOL per recipient, minimum 0.01 SOL
    isEnabled,
  }),

  // Burn Tokens fees
  burnAll: (isEnabled: boolean): AdditionalFeeConfig => ({
    fieldName: 'burnAll',
    label: 'Burn All Tokens',
    description: 'Burn entire token supply',
    fee: 0.05, // 0.05 SOL
    isEnabled,
  }),

  // Liquidity Pool fees
  createMetadata: (isEnabled: boolean): AdditionalFeeConfig => ({
    fieldName: 'createMetadata',
    label: 'Create Pool Metadata',
    description: 'Create metadata for liquidity pool',
    fee: 0.05, // 0.05 SOL
    isEnabled,
  }),

  // Priority fees
  priorityProcessing: (isEnabled: boolean, level: 'low' | 'medium' | 'high' = 'medium'): AdditionalFeeConfig => {
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
      isEnabled,
    }
  },
}

/**
 * Helper function to create tool-specific fee configurations
 */
export const createToolFeeConfig = {
  tokenCreator: (formData: { revokeMintAuthority?: boolean; revokeFreezeAuthority?: boolean }): AdditionalFeeConfig[] => [
    commonAdditionalFees.revokeMintAuthority(formData.revokeMintAuthority || false),
    commonAdditionalFees.revokeFreezeAuthority(formData.revokeFreezeAuthority || false),
  ],

  multisender: (formData: { recipients?: string[] }): AdditionalFeeConfig[] => {
    const recipientCount = formData.recipients?.length || 0
    return [commonAdditionalFees.bulkSend(recipientCount > 0, recipientCount)]
  },

  burnTokens: (formData: { burnAll?: boolean }): AdditionalFeeConfig[] => [commonAdditionalFees.burnAll(formData.burnAll || false)],

  createLiquidity: (formData: { createMetadata?: boolean; priorityFee?: 'low' | 'medium' | 'high' }): AdditionalFeeConfig[] => {
    const fees: AdditionalFeeConfig[] = []

    if (formData.createMetadata) {
      fees.push(commonAdditionalFees.createMetadata(formData.createMetadata))
    }

    if (formData.priorityFee) {
      fees.push(commonAdditionalFees.priorityProcessing(true, formData.priorityFee))
    }

    return fees
  },
}

/**
 * Type-safe helper to get fee configuration for any tool
 */
export type ToolFeeConfigKey = keyof typeof createToolFeeConfig

export const getToolFeeConfig = <T extends ToolFeeConfigKey>(
  toolType: T,
  formData: Parameters<(typeof createToolFeeConfig)[T]>[0]
): AdditionalFeeConfig[] => createToolFeeConfig[toolType](formData)

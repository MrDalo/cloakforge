import { useMemo } from 'react'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { getLogger } from '@/lib/logger/logger'
import { useToolConfig } from '@/stores/toolConfigStore'
import { toolFeeConfigs, type ToolId } from '@/lib/utils/feeConfigs'

export interface AdditionalFeeConfig {
  fieldName: string
  label: string
  description?: string
  fee: number // in SOL
}

export interface FeeCalculationConfig {
  toolId: ToolId
  formData: Record<string, unknown>
  enablePriorityFee?: boolean
}

export interface FeeBreakdownItem {
  name: string
  amount: number // in SOL
  description?: string
}

export interface FeeCalculationResult {
  totalFeeLamports: number
  totalFeeSOL: number
  baseFeeSOL: number
  networkFeeSOL: number
  priorityFeeSOL: number
  additionalFeesSOL: number
  breakdown: FeeBreakdownItem[]
  isLoading: boolean
  error: string | null
}

/**
 * Reusable hook for calculating fees across different tools
 * Memoizes all calculations to prevent infinite loops
 * Integrates with Contentful tool configuration
 */
export function useFeeCalculation(config: FeeCalculationConfig): FeeCalculationResult {
  const { config: toolConfig } = useToolConfig(config.toolId)

  // Memoize logger to prevent recreating on every render
  const logger = useMemo(
    () =>
      getLogger({
        context: 'fee-calculation',
        tool: config.toolId,
        function: 'useFeeCalculation',
      }),
    [config.toolId]
  )

  // Memoize the calculation result to prevent infinite loops
  const calculationResult = useMemo((): FeeCalculationResult => {
    try {
      // If tool config is not loaded yet, return loading state
      if (!toolConfig) {
        return {
          totalFeeLamports: 0,
          totalFeeSOL: 0,
          baseFeeSOL: 0,
          networkFeeSOL: 0,
          priorityFeeSOL: 0,
          additionalFeesSOL: 0,
          breakdown: [],
          isLoading: true,
          error: null,
        }
      }

      // Get base fees from Contentful configuration
      const baseFeeSOL = toolConfig.baseFee || 0
      const networkFeeSOL = toolConfig.networkFee || 0
      const priorityFeeSOL = config.enablePriorityFee ? toolConfig.priorityFee || 0 : 0

      // Calculate additional fees based on tool type and form data
      let additionalFeesSOL = 0
      const breakdown: FeeBreakdownItem[] = []

      // Add base fee to breakdown
      if (baseFeeSOL > 0) {
        breakdown.push({
          name: 'Base Service Fee',
          amount: baseFeeSOL,
          description: `Base fee for ${config.toolId.replace('-', ' ')}`,
        })
      }

      // Add network fee to breakdown
      if (networkFeeSOL > 0) {
        breakdown.push({
          name: 'Network Fee',
          amount: networkFeeSOL,
          description: 'Solana blockchain transaction fee',
        })
      }

      // Add priority fee if enabled
      if (priorityFeeSOL > 0) {
        breakdown.push({
          name: 'Priority Fee',
          amount: priorityFeeSOL,
          description: 'Priority fee for faster transaction processing',
        })
      }

      // Calculate tool-specific additional fees using configuration
      const toolFeeConfigFn = toolFeeConfigs[config.toolId]
      const toolFees = toolFeeConfigFn ? toolFeeConfigFn(config.formData) : []

      for (const feeConfig of toolFees) {
        const fieldValue = config.formData[feeConfig.fieldName]

        // Check if the field is enabled (boolean true or string 'true')
        if (fieldValue === true || fieldValue === 'true') {
          additionalFeesSOL += feeConfig.fee
          breakdown.push({
            name: feeConfig.label,
            amount: feeConfig.fee,
            description: feeConfig.description,
          })
        }
      }

      // Calculate totals
      const totalFeeSOL = baseFeeSOL + networkFeeSOL + priorityFeeSOL + additionalFeesSOL
      const totalFeeLamports = Math.round(totalFeeSOL * LAMPORTS_PER_SOL)

      const result = {
        totalFeeLamports,
        totalFeeSOL,
        baseFeeSOL,
        networkFeeSOL,
        priorityFeeSOL,
        additionalFeesSOL,
        breakdown,
        isLoading: false,
        error: null,
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown fee calculation error'

      logger.error('Fee calculation failed', error, {
        toolId: config.toolId,
        formDataKeys: Object.keys(config.formData),
      })

      return {
        totalFeeLamports: 0,
        totalFeeSOL: 0,
        baseFeeSOL: 0,
        networkFeeSOL: 0,
        priorityFeeSOL: 0,
        additionalFeesSOL: 0,
        breakdown: [],
        isLoading: false,
        error: errorMessage,
      }
    }
  }, [toolConfig, config.toolId, config.formData, config.enablePriorityFee, logger])

  return calculationResult
}

export default useFeeCalculation

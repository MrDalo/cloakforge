import { useMemo } from 'react'
import { getLogger } from '@/lib/logger/logger'
import { useToolConfig } from '@/stores/toolConfigStore'

export interface AdditionalFeeConfig {
  fieldName: string
  label: string
  description?: string
  fee: number // in SOL
  isEnabled: boolean
}

export interface FeeCalculationConfig {
  toolId: string
  formData: Record<string, unknown>
  additionalFees?: AdditionalFeeConfig[]
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

const SOL_TO_LAMPORTS = 1_000_000_000

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

      // Calculate additional fees based on form data
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

      // Calculate additional fees based on form fields
      if (config.additionalFees) {
        for (const additionalFee of config.additionalFees) {
          const fieldValue = config.formData[additionalFee.fieldName]

          // Check if the field is enabled (boolean true or string 'true')
          if (fieldValue === true || fieldValue === 'true') {
            additionalFeesSOL += additionalFee.fee
            breakdown.push({
              name: additionalFee.label,
              amount: additionalFee.fee,
              description: additionalFee.description || `Additional fee for ${additionalFee.label.toLowerCase()}`,
            })
          }
        }
      }

      // Calculate totals
      const totalFeeSOL = baseFeeSOL + networkFeeSOL + priorityFeeSOL + additionalFeesSOL
      const totalFeeLamports = Math.round(totalFeeSOL * SOL_TO_LAMPORTS)

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
        additionalFeesCount: config.additionalFees?.length || 0,
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
  }, [toolConfig, config.toolId, config.formData, config.additionalFees, config.enablePriorityFee, logger])

  return calculationResult
}

export default useFeeCalculation

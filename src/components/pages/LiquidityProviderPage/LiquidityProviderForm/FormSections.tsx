'use client'

import { type UseFormReturn, useWatch } from 'react-hook-form'
import { UnifiedActionButtons, FeeBreakdown } from '@/components/common'
import { getToolUIConfig } from '@/lib/config/getToolUIConfig'
import { useFeeCalculation } from '@/hooks/solana/useFeeCalculation'
import { PoolTypeSection } from './FormSections/PoolTypeSection'
import { TokenPairSection } from './FormSections/TokenPairSection'
import { PoolConfigurationSection } from './FormSections/PoolConfigurationSection'
import { AdvancedSettingsSection } from './FormSections/AdvancedSettingsSection'

interface FormSectionsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>
  isLoading: boolean
}

export const FormSections = ({ form, isLoading }: FormSectionsProps): React.ReactNode => {
  const toolConfig = getToolUIConfig('liquidity-provider')

  // Watch form values for fee calculation using useWatch for React Compiler compatibility
  const poolType = useWatch({ control: form.control, name: 'poolType', defaultValue: 'CPMM' })
  const tokenA = useWatch({ control: form.control, name: 'tokenA', defaultValue: '' })
  const tokenB = useWatch({ control: form.control, name: 'tokenB', defaultValue: 'SOL' })
  const customTokenB = useWatch({ control: form.control, name: 'customTokenB', defaultValue: '' })
  const amountA = useWatch({ control: form.control, name: 'amountA', defaultValue: '' })
  const amountB = useWatch({ control: form.control, name: 'amountB', defaultValue: '' })
  const feeTier = useWatch({ control: form.control, name: 'feeTier', defaultValue: '0.05' })

  // Calculate fees based on current form state
  const feeCalculation = useFeeCalculation({
    toolId: 'liquidity-provider',
    formData: {
      poolType,
      tokenA,
      tokenB: tokenB === 'custom' ? customTokenB : tokenB,
      amountA: parseFloat(amountA) || 0,
      amountB: parseFloat(amountB) || 0,
      feeTier,
    },
    enablePriorityFee: false,
  })

  return (
    <div className='space-y-8'>
      <PoolTypeSection form={form} />
      <TokenPairSection form={form} />
      <PoolConfigurationSection form={form} />
      <AdvancedSettingsSection form={form} />

      {/* Fee Breakdown */}
      <FeeBreakdown feeCalculation={feeCalculation} title='Liquidity Provider Fee Breakdown' toolType='liquidity-provider' />

      <UnifiedActionButtons
        form={form}
        submitConfig={{
          text: isLoading ? toolConfig.loadingText : toolConfig.submitText,
          loadingText: toolConfig.loadingText,
          icon: toolConfig.icon,
          variant: toolConfig.variant,
        }}
        toolId='liquidity-provider'
      />
    </div>
  )
}

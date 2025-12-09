'use client'

import { memo } from 'react'
import { Button } from '@/components/ui/button'
import { useToolConfig } from '@/stores/toolConfigStore'
import { AlertTriangle, Loader2 } from 'lucide-react'

interface ToolActionButtonProps {
  toolId: string
  onClick?: () => void
  onSubmit?: () => void
  type?: 'button' | 'submit'
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  disabled?: boolean
  isLoading?: boolean
  children: React.ReactNode
  className?: string
}

/**
 * Smart action button that automatically disables based on Contentful tool configuration
 * Checks if the tool is enabled in Contentful and shows appropriate messaging
 * Memoized to prevent unnecessary re-renders when parent form state changes
 */
export const ToolActionButton = memo<ToolActionButtonProps>(
  ({
    toolId,
    onClick,
    onSubmit,
    type = 'button',
    variant = 'default',
    size = 'default',
    disabled = false,
    isLoading = false,
    children,
    className,
  }: ToolActionButtonProps): React.ReactElement => {
    const { config, isEnabled } = useToolConfig(toolId)

    // Determine if button should be disabled
    const isButtonDisabled = disabled || isLoading || !isEnabled

    // Handle button click
    const handleClick = (): void => {
      if (isButtonDisabled) return

      if (type === 'submit' && onSubmit) {
        onSubmit()
      } else if (onClick) {
        onClick()
      }
    }

    // Show loading state
    if (isLoading) {
      return (
        <Button className={className} disabled={true} size={size} type={type} variant={variant}>
          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
          {children}
        </Button>
      )
    }

    // Show disabled state with warning card if tool is disabled
    if (!isEnabled && config) {
      const disabledMessage = config.disabledMessage || 'This tool is currently disabled. Please check back later.'

      return (
        <div className='space-y-5'>
          <Button className={`opacity-50 ${className || ''}`} disabled={true} size={size} type={type} variant='outline'>
            {children}
          </Button>
          <div className='bg-warning/30 border-warning-foreground/70 text-warning-foreground rounded-lg border p-4'>
            <div className='flex items-start gap-3'>
              <AlertTriangle className='mt-0.5 h-4 w-4 shrink-0 text-yellow-500' />
              <div className='flex-1'>
                <p className='text-sm font-medium'>Tool Temporarily Disabled</p>
                <p className='text-muted-foreground mt-1 text-xs'>{disabledMessage}</p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Regular enabled button
    return (
      <Button className={className} disabled={isButtonDisabled} onClick={handleClick} size={size} type={type} variant={variant}>
        {children}
      </Button>
    )
  }
)

// Add display name for better debugging
ToolActionButton.displayName = 'ToolActionButton'

/**
 * Simple hook to check if a tool is enabled
 * Useful for conditional rendering of entire sections
 */
export const useIsToolEnabled = (toolId: string): boolean => {
  const { isEnabled } = useToolConfig(toolId)
  return isEnabled
}

/**
 * Hook to get tool configuration with useful derived values
 * Useful for displaying fees, messages, etc.
 */
export const useToolConfiguration = (
  toolId: string
): {
  config: import('@/lib/contentful/client').ToolConfiguration | null
  isEnabled: boolean
  fees:
    | {
        baseFee: number
        networkFee: number
        priorityFee?: number
      }
    | undefined
  disabledMessage: string | undefined
} => {
  const { config, isEnabled } = useToolConfig(toolId)

  return {
    config,
    isEnabled,
    fees: config
      ? {
          baseFee: config.baseFee,
          networkFee: config.networkFee,
          priorityFee: config.priorityFee,
        }
      : undefined,
    disabledMessage: config?.disabledMessage,
  }
}

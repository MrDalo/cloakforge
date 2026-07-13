import { useState, useCallback, useMemo } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { type PublicKey, type Transaction, type VersionedTransaction } from '@solana/web3.js'
import { address } from '@solana/kit'
import { toast } from 'sonner'
import { getLogger } from '@/lib/logger/logger'
import { handleError } from '@/lib/errors'
import { useDiscountCouponStore } from '@/stores/discountCouponStore'

/**
 * Extracts the confirmed transaction signature from a tool execution result.
 * Tools return either a single `signature` or a `signatures` array (batch tools).
 *
 * @param result - Tool execution result of unknown shape.
 * @returns First transaction signature or undefined when none is present.
 */
const extractTransactionSignature = (result: unknown): string | undefined => {
  if (!result || typeof result !== 'object') return undefined

  const candidate = result as { signature?: unknown; signatures?: unknown }
  if (typeof candidate.signature === 'string') return candidate.signature
  if (Array.isArray(candidate.signatures) && typeof candidate.signatures[0] === 'string') return candidate.signatures[0]
  return undefined
}

// Base types for tool operations
export interface ToolExecutionConfig {
  toolId: string
  toolName: string
  requiresWallet: boolean
  requiresBalance?: boolean
  minBalance?: number
}

export interface ToolValidationResult {
  isValid: boolean
  errors: string[]
}

// Support both Transaction and VersionedTransaction for signing
export interface ToolExecutionContext {
  walletAddress: string
  publicKey: PublicKey
  signTransaction: <T extends Transaction | VersionedTransaction>(tx: T) => Promise<T>
  connected: boolean
}

export interface UseToolBaseReturn<TData, TResult> {
  isExecuting: boolean
  lastResult: TResult | null
  execute: (data: TData) => Promise<TResult | null>
  validateRequirements: () => ToolValidationResult
  reset: () => void
  isWalletReady: boolean
  validationErrors: string[]
}

/**
 * Base hook for all tools - provides unified wallet validation, error handling, and execution pattern
 */
export function useToolBase<TData, TResult>(
  config: ToolExecutionConfig,
  executionFn: (context: ToolExecutionContext, data: TData) => Promise<TResult>
): UseToolBaseReturn<TData, TResult> {
  const { connected, publicKey, signTransaction } = useWallet()
  const [isExecuting, setIsExecuting] = useState(false)
  const [lastResult, setLastResult] = useState<TResult | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const logger = useMemo(
    () =>
      getLogger({
        context: 'tool-base',
        tool: config.toolId,
        function: 'useToolBase',
      }),
    [config.toolId]
  )

  const validateRequirements = useCallback((): ToolValidationResult => {
    const errors: string[] = []

    if (config.requiresWallet) {
      if (!connected) {
        errors.push('Wallet not connected')
      }
      if (!publicKey) {
        errors.push('No wallet public key available')
      }
      if (!signTransaction) {
        errors.push('Wallet signing not available')
      }
    }

    const result = {
      isValid: errors.length === 0,
      errors,
    }

    setValidationErrors(errors)
    return result
  }, [connected, publicKey, signTransaction, config])

  const execute = useCallback(
    async (data: TData): Promise<TResult | null> => {
      const startTime = Date.now()

      const validation = validateRequirements()
      if (!validation.isValid) {
        const errorMessage = `${config.toolName} requirements not met: ${validation.errors.join(', ')}`

        // Simplified validation error toast
        toast.error(`Wallet Connection Required: ${errorMessage}`, {
          id: `${config.toolId}-validation`,
        })
        return null
      }

      if (isExecuting) {
        toast.warning(`${config.toolName} already in progress`)
        return null
      }

      setIsExecuting(true)

      // Clean up any old toasts from previous runs (do this before try block)
      toast.dismiss(`${config.toolId}-error`)
      toast.dismiss(`${config.toolId}-validation`)

      try {
        // Show loading toast
        toast.loading(`Executing ${config.toolName}...`, {
          id: `${config.toolId}-loading`,
        })

        const context: ToolExecutionContext = {
          walletAddress: address(publicKey!.toString()),
          publicKey: publicKey!,
          signTransaction: signTransaction!,
          connected,
        }

        const result = await executionFn(context, data)

        setLastResult(result)

        // Redeem the applied discount coupon after a successful submission, passing the
        // transaction signature as proof — verified server-side before decrementing usage
        void useDiscountCouponStore.getState().redeemAppliedCoupon(extractTransactionSignature(result))

        // Don't show generic success toast here - let the specific tool handle its own success messaging
        // This allows tools to show more specific success messages (like transaction links)
        toast.dismiss(`${config.toolId}-loading`)

        return result
      } catch (error: unknown) {
        const executionTime = Date.now() - startTime

        // Dismiss loading toast first
        toast.dismiss(`${config.toolId}-loading`)

        // Get user-friendly error message using handleError
        const userFriendlyMessage = handleError(error)

        // Show user-friendly error toast
        toast.error(`${config.toolName} Failed: ${userFriendlyMessage}`, {
          id: `${config.toolId}-error`,
        })

        // Log detailed error for debugging (with raw error details)
        logger.error('Tool execution failed', error, {
          tool: config.toolId,
          executionTimeMs: executionTime,
          errorType: error instanceof Error ? error.constructor.name : 'Unknown',
          dataKeys: typeof data === 'object' ? Object.keys(data as Record<string, unknown>) : 'primitive',
          userFriendlyMessage, // Include what the user saw
          rawError: error instanceof Error ? error.message : String(error), // Include raw error for debugging
        })

        return null
      } finally {
        setIsExecuting(false)
      }
    },
    [config, validateRequirements, isExecuting, connected, publicKey, signTransaction, executionFn, logger]
  )

  const reset = useCallback(() => {
    setLastResult(null)
    setValidationErrors([])
    // Also dismiss any lingering toasts when resetting
    toast.dismiss(`${config.toolId}-loading`)
    toast.dismiss(`${config.toolId}-error`)
    toast.dismiss(`${config.toolId}-validation`)
  }, [config.toolId])

  const isWalletReady = connected && !!publicKey && !!signTransaction

  return {
    isExecuting,
    lastResult,
    execute,
    validateRequirements,
    reset,
    isWalletReady,
    validationErrors,
  }
}

export default useToolBase

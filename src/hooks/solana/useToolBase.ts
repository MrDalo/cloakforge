import { useState, useCallback, useMemo } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { type PublicKey, type Transaction, type VersionedTransaction } from '@solana/web3.js'
import { address } from '@solana/kit'
import { toast } from 'sonner'
import { getLogger } from '@/lib/logger/logger'
import { handleError, isUserRejectionError } from '@/lib/errors'
import { useDiscountCouponStore } from '@/stores/discountCouponStore'
import { isCouponErrorMessage } from '@/lib/utils/discountCouponMessages'

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
  /** Off-chain message signing, for tools that need proof-of-wallet without a transaction. Not all wallets support this. */
  signMessage?: (message: Uint8Array) => Promise<Uint8Array>
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
  const { connected, publicKey, signTransaction, signMessage } = useWallet()
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
          signMessage,
          connected,
        }

        const result = await executionFn(context, data)

        setLastResult(result)

        // A coupon use is counted once the transaction confirms on-chain, so the coupon is
        // cleared only after a successful run — a new submission needs it to be applied again
        useDiscountCouponStore.getState().clearCoupon()

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

        // Failed or rejected runs do not consume a coupon use, so the coupon stays applied —
        // unless the server rejected the coupon itself: show its message next to the coupon
        // (an unusable coupon is removed there, a temporary failure keeps it applied)
        if (error instanceof Error && isCouponErrorMessage(error.message)) {
          useDiscountCouponStore.getState().reportCouponError(error.message)
        }

        // Show user-friendly error toast
        toast.error(`${config.toolName} Failed: ${userFriendlyMessage}`, {
          id: `${config.toolId}-error`,
        })

        // Log detailed error for debugging (with raw error details).
        // User-cancelled wallet actions are expected and shouldn't pollute the error tracker.
        const logFn = isUserRejectionError(error) ? logger.warn : logger.error
        logFn('Tool execution failed', error, {
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
    [config, validateRequirements, isExecuting, connected, publicKey, signTransaction, signMessage, executionFn, logger]
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

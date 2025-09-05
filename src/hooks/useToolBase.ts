import { useState, useCallback, useMemo } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, Transaction } from '@solana/web3.js'
import { address } from '@solana/kit'
import { toast } from 'sonner'
import { getLogger } from '@/lib/logger/logger'

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

export interface ToolExecutionContext {
  walletAddress: string
  publicKey: PublicKey
  signTransaction: (tx: Transaction) => Promise<Transaction>
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
        toast.error('Validation Failed', {
          description: errorMessage,
        })
        return null
      }

      if (isExecuting) {
        toast.warning(`${config.toolName} already in progress`)
        return null
      }

      setIsExecuting(true)

      try {
        toast.loading(`Executing ${config.toolName}...`, { id: config.toolId })

        const context: ToolExecutionContext = {
          walletAddress: address(publicKey!.toString()),
          publicKey: publicKey!,
          signTransaction: signTransaction!,
          connected,
        }

        const result = await executionFn(context, data)

        setLastResult(result)

        // Don't show generic success toast here - let the specific tool handle its own success messaging
        // This allows tools to show more specific success messages (like transaction links)
        toast.dismiss(config.toolId)

        return result
      } catch (error: unknown) {
        const executionTime = Date.now() - startTime
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

        toast.error(`${config.toolName} failed`, {
          id: config.toolId,
          description: errorMessage,
        })

        logger.error('Tool execution failed', error, {
          tool: config.toolId,
          executionTimeMs: executionTime,
          errorType: error instanceof Error ? error.constructor.name : 'Unknown',
          dataKeys: typeof data === 'object' ? Object.keys(data as Record<string, unknown>) : 'primitive',
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
  }, [])

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

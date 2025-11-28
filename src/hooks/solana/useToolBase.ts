import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, Transaction } from '@solana/web3.js'
import { toast } from 'sonner'
import { getLogger } from '@/lib/logger/logger'
import { handleError, AppError } from '@/lib/errors'

// Base types for tool operations
export interface ToolBaseConfig {
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
  publicKey?: PublicKey
  signTransaction: (tx: Transaction) => Promise<Transaction>
  signAllTransactions: (txs: Transaction[]) => Promise<Transaction[]>
  connected?: boolean
}

export interface UseToolBaseReturn<TParams, TResult> {
  isExecuting: boolean
  lastResult: TResult | null
  execute: (params: TParams) => Promise<TResult | null>
  validateRequirements: () => boolean
  reset: () => void
  isWalletReady: boolean
  validationErrors: string[]
}

/**
 * Base hook for all tools - provides unified wallet validation, error handling, and execution pattern
 */
export function useToolBase<TParams, TResult>(
  config: ToolBaseConfig,
  executionFn: (context: ToolExecutionContext, params: TParams) => Promise<TResult>
): UseToolBaseReturn<TParams, TResult> {
  const { publicKey, signTransaction, signAllTransactions, connected } = useWallet()
  const [isExecuting, setIsExecuting] = useState(false)
  const [lastResult, setLastResult] = useState<TResult | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const logger = getLogger({
    context: config.toolId,
    hook: 'useToolBase',
    wallet: publicKey?.toString(),
  })

  const validateRequirements = (): boolean => {
    const errors: string[] = []

    if (config.requiresWallet && !publicKey) {
      errors.push('Wallet not connected')
    }

    setValidationErrors(errors)
    return errors.length === 0
  }

  const execute = async (params: TParams): Promise<TResult | null> => {
    setValidationErrors([])
    setLastResult(null)

    if (!validateRequirements()) {
      const error = new AppError('WALLET_NOT_CONNECTED', 'Please connect your wallet to continue')
      toast.error(error.message)
      return null
    }

    setIsExecuting(true)

    try {
      if (!publicKey || !signTransaction || !signAllTransactions) {
        throw new AppError('WALLET_NOT_CONNECTED', 'Wallet not fully initialized')
      }

      const context: ToolExecutionContext = {
        walletAddress: publicKey.toString(),
        publicKey,
        signTransaction,
        signAllTransactions,
        connected,
      }

      const result = await executionFn(context, params)
      setLastResult(result)
      return result
    } catch (error) {
      const message = handleError(error)
      logger.error('Tool execution failed', error)
      toast.error(message)
      return null
    } finally {
      setIsExecuting(false)
    }
  }

  const reset = () => {
    setLastResult(null)
    setValidationErrors([])
    setIsExecuting(false)
  }

  return {
    execute,
    isExecuting,
    lastResult,
    reset,
    validateRequirements,
    isWalletReady: !!publicKey,
    validationErrors,
  }
}


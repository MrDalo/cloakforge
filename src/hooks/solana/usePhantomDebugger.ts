/**
 * PHANTOM DEBUG HOOK
 * 
 * Use this hook to diagnose and fix Phantom wallet simulation issues
 */

import { useCallback } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { diagnosePhantomIssue, printPhantomDiagnostics } from '@/lib/solana/phantomDiagnostics'
import { reconstructTransactionForPhantom } from '@/lib/solana/phantomExactFix'
import { refreshForPhantom } from '@/lib/solana/phantomFix'
import { PublicKey } from '@solana/web3.js'

export function usePhantomDebugger() {
  const { connection } = useConnection()
  const { publicKey } = useWallet()

  const debugTransaction = useCallback(async (serializedTransaction: string) => {
    if (!publicKey) {
      console.error('Wallet not connected')
      return
    }

    console.log('🔍 Starting Phantom Debug Session...')
    console.log('Transaction to debug:', serializedTransaction.slice(0, 50) + '...')

    // Step 1: Run comprehensive diagnostics
    const diagnostics = await diagnosePhantomIssue(serializedTransaction, publicKey, connection)
    printPhantomDiagnostics(diagnostics)

    // Step 2: If diagnostics failed, try our fixes
    if (diagnostics.overallResult === 'FAIL') {
      console.log('\n🔧 Applying Phantom fixes...')

      // Try standard refresh
      console.log('Trying standard refresh...')
      const refreshResult = await refreshForPhantom(serializedTransaction, publicKey, connection)
      
      if (refreshResult.success) {
        console.log('✅ Standard refresh worked!')
        console.log('Fixed transaction:', refreshResult.transaction?.slice(0, 50) + '...')
        
        // Test the fixed transaction
        const fixedDiagnostics = await diagnosePhantomIssue(refreshResult.transaction!, publicKey, connection)
        if (fixedDiagnostics.overallResult === 'PASS') {
          console.log('🎉 FIXED! Use this transaction with Phantom')
          return refreshResult.transaction
        }
      }

      // Try complete reconstruction
      console.log('Trying complete reconstruction...')
      const reconstructResult = await reconstructTransactionForPhantom(serializedTransaction, publicKey)
      
      if (reconstructResult.success) {
        console.log('✅ Reconstruction worked!')
        console.log('Reconstructed transaction:', reconstructResult.transaction?.slice(0, 50) + '...')
        
        // Test the reconstructed transaction
        const reconstructedDiagnostics = await diagnosePhantomIssue(reconstructResult.transaction!, publicKey, connection)
        if (reconstructedDiagnostics.overallResult === 'PASS') {
          console.log('🎉 FIXED! Use this reconstructed transaction with Phantom')
          return reconstructResult.transaction
        }
      }

      console.log('❌ All fixes failed. The issue may be with the transaction logic itself.')
    } else {
      console.log('✅ Transaction should work fine with Phantom!')
    }

    return null
  }, [connection, publicKey])

  return { debugTransaction }
}

// Quick debug function you can call from browser console
export function quickPhantomDebug(serializedTransaction: string, walletAddress: string): Promise<void> {
  return new Promise(async (resolve) => {
    try {
      const publicKey = new PublicKey(walletAddress)
      const diagnostics = await diagnosePhantomIssue(serializedTransaction, publicKey)
      printPhantomDiagnostics(diagnostics)
      resolve()
    } catch (error) {
      console.error('Debug failed:', error)
      resolve()
    }
  })
}
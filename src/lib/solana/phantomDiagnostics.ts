/**
 * PHANTOM WALLET DIAGNOSTIC UTILITY
 * 
 * This utility helps diagnose exactly why Phantom is failing transaction simulation
 * by testing various scenarios and providing detailed feedback.
 */

import { Connection, Transaction, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { getLogger } from '@/lib/logger/logger'

interface PhantomDiagnosticResult {
  overallResult: 'PASS' | 'FAIL'
  tests: {
    rpcConnectivity: { passed: boolean; details: string; rpc?: string }
    blockhashFreshness: { passed: boolean; details: string; age?: number }
    accountValidation: { passed: boolean; details: string; missingAccounts?: string[] }
    balanceCheck: { passed: boolean; details: string; balance?: number }
    transactionStructure: { passed: boolean; details: string; instructionCount?: number }
    simulationCompatibility: { passed: boolean; details: string; error?: string }
  }
  recommendations: string[]
}

/**
 * Runs comprehensive diagnostics to determine why Phantom simulation might be failing
 */
export async function diagnosePhantomIssue(
  serializedTransaction: string,
  walletPublicKey: PublicKey,
  connection?: Connection
): Promise<PhantomDiagnosticResult> {
  const logger = getLogger({
    context: 'phantom-diagnostics',
    function: 'diagnosePhantomIssue',
  })

  const result: PhantomDiagnosticResult = {
    overallResult: 'PASS',
    tests: {
      rpcConnectivity: { passed: false, details: '' },
      blockhashFreshness: { passed: false, details: '' },
      accountValidation: { passed: false, details: '' },
      balanceCheck: { passed: false, details: '' },
      transactionStructure: { passed: false, details: '' },
      simulationCompatibility: { passed: false, details: '' },
    },
    recommendations: [],
  }

  try {
    const transaction = Transaction.from(Buffer.from(serializedTransaction, 'base64'))

    // Test 1: RPC Connectivity to Phantom's preferred endpoints
    const phantomRpcs = [
      'https://api.devnet.solana.com',
      'https://devnet.solana.com',
      connection?.rpcEndpoint || 'unknown'
    ]

    let workingRpc: Connection | null = null
    for (const rpcUrl of phantomRpcs) {
      if (rpcUrl === 'unknown') continue
      
      try {
        const testConnection = new Connection(rpcUrl, 'confirmed')
        const start = Date.now()
        await testConnection.getLatestBlockhash('confirmed')
        const responseTime = Date.now() - start
        
        workingRpc = testConnection
        result.tests.rpcConnectivity = {
          passed: true,
          details: `✅ Connected to ${rpcUrl} (${responseTime}ms)`,
          rpc: rpcUrl,
        }
        break
      } catch (error) {
        logger.warn(`RPC test failed for ${rpcUrl}`, { error })
      }
    }

    if (!workingRpc) {
      result.tests.rpcConnectivity = {
        passed: false,
        details: '❌ Cannot connect to any Phantom-compatible RPC endpoints',
      }
      result.recommendations.push('Switch to a reliable devnet RPC endpoint')
      result.overallResult = 'FAIL'
      return result
    }

    // Test 2: Blockhash Freshness
    try {
      const currentBlockhash = await workingRpc.getLatestBlockhash('confirmed')
      const transactionBlockhash = transaction.recentBlockhash
      
      if (transactionBlockhash === currentBlockhash.blockhash) {
        result.tests.blockhashFreshness = {
          passed: true,
          details: '✅ Transaction has current blockhash',
          age: 0,
        }
      } else {
        // Check if the blockhash is still valid
        const isValid = await workingRpc.isBlockhashValid(transactionBlockhash || '', 'confirmed')
        result.tests.blockhashFreshness = {
          passed: isValid.value,
          details: isValid.value ? 
            '⚠️ Transaction blockhash is old but still valid' : 
            '❌ Transaction blockhash is expired',
          age: -1,
        }
        
        if (!isValid.value) {
          result.recommendations.push('Transaction blockhash is expired - refresh immediately before signing')
          result.overallResult = 'FAIL'
        }
      }
    } catch (error) {
      result.tests.blockhashFreshness = {
        passed: false,
        details: `❌ Cannot validate blockhash: ${error}`,
      }
    }

    // Test 3: Account Validation
    try {
      const accountKeys = transaction.compileMessage().accountKeys
      const missingAccounts: string[] = []
      
      // Check first 5 accounts (most critical)
      for (const pubkey of accountKeys.slice(0, 5)) {
        try {
          const accountInfo = await workingRpc.getAccountInfo(pubkey)
          if (!accountInfo && !pubkey.equals(PublicKey.default)) {
            missingAccounts.push(pubkey.toString())
          }
        } catch (error) {
          missingAccounts.push(pubkey.toString())
        }
      }
      
      result.tests.accountValidation = {
        passed: missingAccounts.length === 0,
        details: missingAccounts.length === 0 ?
          '✅ All required accounts exist' :
          `❌ Missing accounts: ${missingAccounts.length}`,
        missingAccounts,
      }
      
      if (missingAccounts.length > 0) {
        result.recommendations.push('Some required accounts do not exist - check token addresses')
      }
    } catch (error) {
      result.tests.accountValidation = {
        passed: false,
        details: `❌ Account validation failed: ${error}`,
      }
    }

    // Test 4: Balance Check
    try {
      const balance = await workingRpc.getBalance(walletPublicKey)
      const hasMinimumBalance = balance > 0.01 * LAMPORTS_PER_SOL // At least 0.01 SOL
      
      result.tests.balanceCheck = {
        passed: hasMinimumBalance,
        details: hasMinimumBalance ?
          `✅ Sufficient balance: ${balance / LAMPORTS_PER_SOL} SOL` :
          `❌ Low balance: ${balance / LAMPORTS_PER_SOL} SOL`,
        balance: balance / LAMPORTS_PER_SOL,
      }
      
      if (!hasMinimumBalance) {
        result.recommendations.push('Wallet balance is very low - ensure sufficient SOL for fees')
      }
    } catch (error) {
      result.tests.balanceCheck = {
        passed: false,
        details: `❌ Cannot check balance: ${error}`,
      }
    }

    // Test 5: Transaction Structure
    try {
      const instructionCount = transaction.instructions.length
      const hasFeePayer = !!transaction.feePayer
      const hasBlockhash = !!transaction.recentBlockhash
      
      const structureValid = instructionCount > 0 && hasFeePayer && hasBlockhash
      
      result.tests.transactionStructure = {
        passed: structureValid,
        details: structureValid ?
          `✅ Valid structure: ${instructionCount} instructions` :
          '❌ Invalid transaction structure',
        instructionCount,
      }
      
      if (!structureValid) {
        result.recommendations.push('Transaction structure is invalid - check instructions and fee payer')
        result.overallResult = 'FAIL'
      }
    } catch (error) {
      result.tests.transactionStructure = {
        passed: false,
        details: `❌ Structure validation failed: ${error}`,
      }
    }

    // Test 6: Simulation Compatibility (The critical test)
    try {
      // Refresh the transaction with ultra-fresh data first
      const freshBlockhash = await workingRpc.getLatestBlockhash('confirmed')
      transaction.recentBlockhash = freshBlockhash.blockhash
      transaction.feePayer = walletPublicKey
      
      const simulation = await workingRpc.simulateTransaction(transaction)
      
      if (simulation.value.err) {
        result.tests.simulationCompatibility = {
          passed: false,
          details: `❌ Simulation failed: ${JSON.stringify(simulation.value.err)}`,
          error: JSON.stringify(simulation.value.err),
        }
        result.recommendations.push(`Fix simulation error: ${JSON.stringify(simulation.value.err)}`)
        result.overallResult = 'FAIL'
      } else {
        result.tests.simulationCompatibility = {
          passed: true,
          details: `✅ Simulation successful (${simulation.value.unitsConsumed || 0} compute units)`,
        }
      }
    } catch (error) {
      result.tests.simulationCompatibility = {
        passed: false,
        details: `❌ Simulation error: ${error}`,
        error: String(error),
      }
      result.recommendations.push(`Resolve simulation error: ${error}`)
      result.overallResult = 'FAIL'
    }

    // Final recommendations
    if (result.overallResult === 'PASS') {
      result.recommendations.push('✅ Transaction should work in Phantom wallet')
    } else {
      result.recommendations.push('❌ Transaction will likely fail in Phantom - address the issues above')
    }

    logger.info('Phantom diagnostics completed', {
      overall: result.overallResult,
      failedTests: Object.entries(result.tests).filter(([_, test]) => !test.passed).map(([name]) => name),
    })

    return result

  } catch (error) {
    logger.error('Diagnostic process failed', { error })
    
    return {
      overallResult: 'FAIL',
      tests: {
        rpcConnectivity: { passed: false, details: `❌ Diagnostic failed: ${error}` },
        blockhashFreshness: { passed: false, details: 'Not tested' },
        accountValidation: { passed: false, details: 'Not tested' },
        balanceCheck: { passed: false, details: 'Not tested' },
        transactionStructure: { passed: false, details: 'Not tested' },
        simulationCompatibility: { passed: false, details: 'Not tested' },
      },
      recommendations: ['Fix the diagnostic error and try again'],
    }
  }
}

/**
 * Pretty print diagnostic results for easy debugging
 */
export function printPhantomDiagnostics(result: PhantomDiagnosticResult): void {
  console.log('\n🔍 PHANTOM WALLET DIAGNOSTICS REPORT 🔍')
  console.log('=' .repeat(50))
  console.log(`Overall Result: ${result.overallResult === 'PASS' ? '✅ PASS' : '❌ FAIL'}`)
  console.log('\nDetailed Test Results:')
  
  Object.entries(result.tests).forEach(([testName, testResult]) => {
    const status = testResult.passed ? '✅' : '❌'
    console.log(`${status} ${testName}: ${testResult.details}`)
  })
  
  console.log('\nRecommendations:')
  result.recommendations.forEach((rec, i) => {
    console.log(`${i + 1}. ${rec}`)
  })
  console.log('=' .repeat(50))
}
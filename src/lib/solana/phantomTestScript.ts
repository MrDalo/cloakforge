/**
 * QUICK PHANTOM TEST SCRIPT
 * 
 * Copy this into your browser console to test Phantom compatibility
 */

// Test if Phantom is using a different RPC than expected
async function testPhantomRpc() {
  console.log('🔍 Testing Phantom RPC compatibility...')
  
  const phantomRpcs = [
    'https://api.devnet.solana.com',
    'https://devnet.solana.com',
    'https://rpc.ankr.com/solana_devnet',
    'https://solana-devnet.g.alchemy.com/v2/demo'
  ]
  
  for (const rpc of phantomRpcs) {
    try {
      const connection = new window.solanaWeb3.Connection(rpc, 'confirmed')
      const start = Date.now()
      const result = await connection.getLatestBlockhash()
      const time = Date.now() - start
      
      console.log(`✅ ${rpc}: ${time}ms, blockhash: ${result.blockhash.slice(0, 8)}...`)
    } catch (error) {
      console.log(`❌ ${rpc}: ${error.message}`)
    }
  }
}

// Test a specific transaction against multiple RPCs
async function testTransactionOnMultipleRpcs(base64Transaction, walletAddress) {
  console.log('🧪 Testing transaction on multiple RPCs...')
  
  const phantomRpcs = [
    'https://api.devnet.solana.com',
    'https://devnet.solana.com',
    'https://rpc.ankr.com/solana_devnet'
  ]
  
  const wallet = new window.solanaWeb3.PublicKey(walletAddress)
  
  for (const rpc of phantomRpcs) {
    try {
      const connection = new window.solanaWeb3.Connection(rpc, 'confirmed')
      const transaction = window.solanaWeb3.Transaction.from(Buffer.from(base64Transaction, 'base64'))
      
      // Refresh blockhash
      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = wallet
      
      // Test simulation
      const simulation = await connection.simulateTransaction(transaction)
      
      if (simulation.value.err) {
        console.log(`❌ ${rpc}: Simulation failed -`, simulation.value.err)
      } else {
        console.log(`✅ ${rpc}: SUCCESS! Compute units:`, simulation.value.unitsConsumed)
      }
    } catch (error) {
      console.log(`❌ ${rpc}: Error -`, error.message)
    }
  }
}

// Quick network check
async function checkNetworkCompatibility() {
  console.log('🌐 Checking network compatibility...')
  
  // Get your current connection
  const currentRpc = 'https://api.devnet.solana.com' // Replace with your actual RPC
  const connection = new window.solanaWeb3.Connection(currentRpc, 'confirmed')
  
  try {
    const health = await connection.getHealth()
    console.log('✅ RPC Health:', health)
    
    const version = await connection.getVersion()
    console.log('✅ RPC Version:', version)
    
    const slot = await connection.getSlot()
    console.log('✅ Current Slot:', slot)
    
  } catch (error) {
    console.log('❌ RPC check failed:', error)
  }
}

// Export functions to global scope for easy testing
window.testPhantomRpc = testPhantomRpc
window.testTransactionOnMultipleRpcs = testTransactionOnMultipleRpcs
window.checkNetworkCompatibility = checkNetworkCompatibility

console.log(`
🔧 PHANTOM DEBUG TOOLS LOADED

Available functions:
1. testPhantomRpc() - Test all known Phantom RPCs
2. testTransactionOnMultipleRpcs(base64Transaction, walletAddress) - Test your specific transaction
3. checkNetworkCompatibility() - Check your current RPC health

To test your failing transaction:
testTransactionOnMultipleRpcs("YOUR_BASE64_TRANSACTION", "YOUR_WALLET_ADDRESS")
`)

export { testPhantomRpc, testTransactionOnMultipleRpcs, checkNetworkCompatibility }
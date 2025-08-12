// Simple test script to check staking rewards API
async function testStakingRewards() {
  try {
    // Test with a devnet wallet - replace with your actual devnet wallet
    const testWalletAddress = 'YOUR_DEVNET_WALLET_ADDRESS_HERE' // Replace with your devnet wallet

    console.log(`Testing staking rewards for wallet: ${testWalletAddress}`)

    const response = await fetch('http://localhost:3002/api/solana/stake-accounts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress: testWalletAddress,
      }),
    })

    const data = await response.json()
    console.log('Response status:', response.status)
    console.log('Response data:', JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Error testing staking rewards:', error)
  }
}

testStakingRewards()

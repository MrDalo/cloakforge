'use client'

import { Switch } from '@/components/ui/switch'

const Home = (): React.ReactNode => (
  // const handleSolanaAirdrop = () => {
  //   connection.requestAirdrop(wallet.publicKey as PublicKey, LAMPORTS_PER_SOL)
  //   toast.success('Airdrop successful')
  // }

  <div className='flex w-full flex-col'>
    {/* <WalletConnectionButton className='absolute right-6 top-6 z-50 hidden lg:inline-block' /> */}
    {/* <Button onClick={() => handleSolanaAirdrop()}>Airdrop solana</Button> */}
    <div className='h-[200vh] w-full bg-red-500' />
    <Switch />
    <div className='h-[200vh] w-full bg-blue-500' />
  </div>
)

export default Home

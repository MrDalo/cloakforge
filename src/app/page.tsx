import { WalletButton } from '@/providers/solana-provider'

const Home = (): React.ReactNode => (
  <div className='bg-red-500 text-card'>
    Hello how are you?
    <WalletButton />
  </div>
)

export default Home

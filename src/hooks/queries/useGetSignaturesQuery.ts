/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { useConnection } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'

export const useGetSignaturesQuery = ({ address }: { address: PublicKey }) => {
  const { connection } = useConnection()

  return useQuery({
    queryKey: ['get-signatures', { endpoint: connection.rpcEndpoint, address }],
    queryFn: () => connection.getSignaturesForAddress(address),
  })
}

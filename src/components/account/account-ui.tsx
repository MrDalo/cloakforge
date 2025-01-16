'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { IconRefresh } from '@tabler/icons-react'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { AppModal, ellipsify } from '../ui/ui-layout'
import { useCluster } from '../cluster/cluster-data-access'
import { ExplorerLink } from '../cluster/cluster-ui'
import {
  useGetBalance,
  useGetSignatures,
  useGetTokenAccounts,
  useRequestAirdrop,
  useTransferSol,
} from './account-data-access'

export const AccountBalance = ({ address }: { address: PublicKey }) => {
  const query = useGetBalance({ address })

  return (
    <div>
      <h1
        className='cursor-pointer text-5xl font-bold'
        onClick={() => query.refetch()}
      >
        {query.data ? <BalanceSol balance={query.data} /> : '...'} SOL
      </h1>
    </div>
  )
}
export const AccountChecker = () => {
  const { publicKey } = useWallet()
  if (!publicKey) {
    return null
  }
  return <AccountBalanceCheck address={publicKey} />
}
export const AccountBalanceCheck = ({ address }: { address: PublicKey }) => {
  const { cluster } = useCluster()
  const mutation = useRequestAirdrop({ address })
  const query = useGetBalance({ address })

  if (query.isLoading) {
    return null
  }
  if (query.isError || !query.data) {
    return (
      <div className='alert alert-warning text-warning-content/80 flex justify-center rounded-none'>
        <span>
          You are connected to <strong>{cluster.name}</strong> but your account
          is not found on this cluster.
        </span>
        <button
          className='btn btn-xs btn-neutral'
          onClick={() =>
            mutation.mutateAsync(1).catch((err) => console.log(err))
          }
        >
          Request Airdrop
        </button>
      </div>
    )
  }
  return null
}

export const AccountButtons = ({ address }: { address: PublicKey }) => {
  const wallet = useWallet()
  const { cluster } = useCluster()
  const [showAirdropModal, setShowAirdropModal] = useState(false)
  const [showReceiveModal, setShowReceiveModal] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)

  return (
    <div>
      <ModalAirdrop
        address={address}
        hide={() => setShowAirdropModal(false)}
        show={showAirdropModal}
      />
      <ModalReceive
        address={address}
        hide={() => setShowReceiveModal(false)}
        show={showReceiveModal}
      />
      <ModalSend
        address={address}
        hide={() => setShowSendModal(false)}
        show={showSendModal}
      />
      <div className='space-x-2'>
        <button
          className='btn btn-xs lg:btn-md btn-outline'
          disabled={cluster.network?.includes('mainnet')}
          onClick={() => setShowAirdropModal(true)}
        >
          Airdrop
        </button>
        <button
          className='btn btn-xs lg:btn-md btn-outline'
          disabled={wallet.publicKey?.toString() !== address.toString()}
          onClick={() => setShowSendModal(true)}
        >
          Send
        </button>
        <button
          className='btn btn-xs lg:btn-md btn-outline'
          onClick={() => setShowReceiveModal(true)}
        >
          Receive
        </button>
      </div>
    </div>
  )
}

export const AccountTokens = ({ address }: { address: PublicKey }) => {
  const [showAll, setShowAll] = useState(false)
  const query = useGetTokenAccounts({ address })
  const client = useQueryClient()
  const items = useMemo(() => {
    if (showAll) return query.data
    return query.data?.slice(0, 5)
  }, [query.data, showAll])

  return (
    <div className='space-y-2'>
      <div className='justify-between'>
        <div className='flex justify-between'>
          <h2 className='text-2xl font-bold'>Token Accounts</h2>
          <div className='space-x-2'>
            {query.isLoading ? (
              <span className='loading loading-spinner' />
            ) : (
              <button
                className='btn btn-sm btn-outline'
                onClick={async () => {
                  await query.refetch()
                  await client.invalidateQueries({
                    queryKey: ['getTokenAccountBalance'],
                  })
                }}
              >
                <IconRefresh size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
      {query.isError && (
        <pre className='alert alert-error'>
          Error: {query.error?.message.toString()}
        </pre>
      )}
      {query.isSuccess && (
        <div>
          {query.data.length === 0 ? (
            <div>No token accounts found.</div>
          ) : (
            <table className='border-base-300 table border-separate rounded-lg border-4'>
              <thead>
                <tr>
                  <th>Public Key</th>
                  <th>Mint</th>
                  <th className='text-right'>Balance</th>
                </tr>
              </thead>
              <tbody>
                {items?.map(({ account, pubkey }) => (
                  <tr key={pubkey.toString()}>
                    <td>
                      <div className='flex space-x-2'>
                        <span className='font-mono'>
                          <ExplorerLink
                            label={ellipsify(pubkey.toString())}
                            path={`account/${pubkey.toString()}`}
                          />
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className='flex space-x-2'>
                        <span className='font-mono'>
                          <ExplorerLink
                            label={ellipsify(account.data.parsed.info.mint)}
                            path={`account/${account.data.parsed.info.mint.toString()}`}
                          />
                        </span>
                      </div>
                    </td>
                    <td className='text-right'>
                      <span className='font-mono'>
                        {account.data.parsed.info.tokenAmount.uiAmount}
                      </span>
                    </td>
                  </tr>
                ))}

                {(query.data?.length ?? 0) > 5 && (
                  <tr>
                    <td className='text-center' colSpan={4}>
                      <button
                        className='btn btn-xs btn-outline'
                        onClick={() => setShowAll(!showAll)}
                      >
                        {showAll ? 'Show Less' : 'Show All'}
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

export const AccountTransactions = ({ address }: { address: PublicKey }) => {
  const query = useGetSignatures({ address })
  const [showAll, setShowAll] = useState(false)

  const items = useMemo(() => {
    if (showAll) return query.data
    return query.data?.slice(0, 5)
  }, [query.data, showAll])

  return (
    <div className='space-y-2'>
      <div className='flex justify-between'>
        <h2 className='text-2xl font-bold'>Transaction History</h2>
        <div className='space-x-2'>
          {query.isLoading ? (
            <span className='loading loading-spinner' />
          ) : (
            <button
              className='btn btn-sm btn-outline'
              onClick={() => query.refetch()}
            >
              <IconRefresh size={16} />
            </button>
          )}
        </div>
      </div>
      {query.isError && (
        <pre className='alert alert-error'>
          Error: {query.error?.message.toString()}
        </pre>
      )}
      {query.isSuccess && (
        <div>
          {query.data.length === 0 ? (
            <div>No transactions found.</div>
          ) : (
            <table className='border-base-300 table border-separate rounded-lg border-4'>
              <thead>
                <tr>
                  <th>Signature</th>
                  <th className='text-right'>Slot</th>
                  <th>Block Time</th>
                  <th className='text-right'>Status</th>
                </tr>
              </thead>
              <tbody>
                {items?.map((item) => (
                  <tr key={item.signature}>
                    <th className='font-mono'>
                      <ExplorerLink
                        label={ellipsify(item.signature, 8)}
                        path={`tx/${item.signature}`}
                      />
                    </th>
                    <td className='text-right font-mono'>
                      <ExplorerLink
                        label={item.slot.toString()}
                        path={`block/${item.slot}`}
                      />
                    </td>
                    <td>
                      {new Date((item.blockTime ?? 0) * 1000).toISOString()}
                    </td>
                    <td className='text-right'>
                      {item.err ? (
                        <div
                          className='badge badge-error'
                          title={JSON.stringify(item.err)}
                        >
                          Failed
                        </div>
                      ) : (
                        <div className='badge badge-success'>Success</div>
                      )}
                    </td>
                  </tr>
                ))}
                {(query.data?.length ?? 0) > 5 && (
                  <tr>
                    <td className='text-center' colSpan={4}>
                      <button
                        className='btn btn-xs btn-outline'
                        onClick={() => setShowAll(!showAll)}
                      >
                        {showAll ? 'Show Less' : 'Show All'}
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

const BalanceSol = ({ balance }: { balance: number }) => (
  <span>{Math.round((balance / LAMPORTS_PER_SOL) * 100000) / 100000}</span>
)

const ModalReceive = ({
  hide,
  show,
  address,
}: {
  hide: () => void
  show: boolean
  address: PublicKey
}) => (
  <AppModal hide={hide} show={show} title='Receive'>
    <p>Receive assets by sending them to your public key:</p>
    <code>{address.toString()}</code>
  </AppModal>
)

const ModalAirdrop = ({
  hide,
  show,
  address,
}: {
  hide: () => void
  show: boolean
  address: PublicKey
}) => {
  const mutation = useRequestAirdrop({ address })
  const [amount, setAmount] = useState('2')

  return (
    <AppModal
      hide={hide}
      show={show}
      submit={() => mutation.mutateAsync(parseFloat(amount)).then(() => hide())}
      submitDisabled={!amount || mutation.isPending}
      submitLabel='Request Airdrop'
      title='Airdrop'
    >
      <input
        className='input input-bordered w-full'
        disabled={mutation.isPending}
        min='1'
        onChange={(e) => setAmount(e.target.value)}
        placeholder='Amount'
        step='any'
        type='number'
        value={amount}
      />
    </AppModal>
  )
}

const ModalSend = ({
  hide,
  show,
  address,
}: {
  hide: () => void
  show: boolean
  address: PublicKey
}) => {
  const wallet = useWallet()
  const mutation = useTransferSol({ address })
  const [destination, setDestination] = useState('')
  const [amount, setAmount] = useState('1')

  if (!address || !wallet.sendTransaction) {
    return <div>Wallet not connected</div>
  }

  return (
    <AppModal
      hide={hide}
      show={show}
      submit={() => {
        mutation
          .mutateAsync({
            destination: new PublicKey(destination),
            amount: parseFloat(amount),
          })
          .then(() => hide())
      }}
      submitDisabled={!destination || !amount || mutation.isPending}
      submitLabel='Send'
      title='Send'
    >
      <input
        className='input input-bordered w-full'
        disabled={mutation.isPending}
        onChange={(e) => setDestination(e.target.value)}
        placeholder='Destination'
        type='text'
        value={destination}
      />
      <input
        className='input input-bordered w-full'
        disabled={mutation.isPending}
        min='1'
        onChange={(e) => setAmount(e.target.value)}
        placeholder='Amount'
        step='any'
        type='number'
        value={amount}
      />
    </AppModal>
  )
}

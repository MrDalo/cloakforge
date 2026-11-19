// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { screen, waitFor, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Keypair } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'
import { renderWithProviders } from '@/__tests__/utils/componentTestHelpers'
import { useToolConfigStore } from '@/stores/toolConfigStore'
import { useDiscountCouponStore } from '@/stores/discountCouponStore'
import { MultisenderForm } from '../MultisenderForm'

// The hook has its own test suite — here we only verify what the form hands over to it
const mockExecute = vi.hoisted(() => vi.fn())
vi.mock('@/hooks/solana/useTransactionMultisender', () => ({
  useTransactionMultisender: () => ({ execute: mockExecute }),
}))

// Stub out the WalletConnectionButton to avoid needing a full WalletProvider.
vi.mock('@/components/common/WalletConnectionButton/WalletConnectionButton', () => ({
  default: () => <button type='button'>Connect Wallet</button>,
}))

vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: vi.fn(),
  useConnection: () => ({ connection: {} }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), loading: vi.fn(), dismiss: vi.fn() },
}))

// The real validateMultisenderToken runs; only the RPC metadata lookup is faked
vi.mock('@/lib/solana/getTokenMetadata', () => ({
  getTokenMetadata: vi.fn(),
}))

// Wallet token list ("My Tokens" mode) — TanStack Query hook faked with a static token list
const walletTokensQuery = vi.hoisted(() => vi.fn())
vi.mock('@/hooks/queries/useWalletTokensForTool', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/queries/useWalletTokensForTool')>()
  const idle = () => ({ data: undefined, isLoading: false, error: null, refetch: vi.fn() })
  return {
    ...actual,
    useWalletTokensForBurnTool: idle,
    useWalletTokensForLiquidityProvider: idle,
    useWalletTokensForRevokeMintAuthority: idle,
    useWalletTokensForRevokeFreezeAuthority: idle,
    useWalletTokensForFreezeWallets: idle,
    useWalletTokensForUnfreezeWallets: idle,
    useWalletTokensForDonation: idle,
    useWalletTokensForUpdateMetadata: idle,
    useWalletTokensForRevokeMetadataAuthority: idle,
    useWalletTokensForTransactionMultisender: () => walletTokensQuery(),
  }
})

import { toast } from 'sonner'
import { getTokenMetadata } from '@/lib/solana/getTokenMetadata'

const MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const WALLET = Keypair.generate().publicKey
const [ADDR_1, ADDR_2, ADDR_3] = Array.from({ length: 3 }, () => Keypair.generate().publicKey.toBase58())

const SUCCESS_RESULT = { signatures: ['sig-1'], transactionCount: 1, successfulRecipients: 1, failedRecipients: 0, failedRecipientList: [] }

const WALLET_TOKEN_MINT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
const WALLET_TOKEN = {
  mint: WALLET_TOKEN_MINT,
  name: 'Tether USD',
  symbol: 'USDT',
  decimals: 2,
  tokenAddress: Keypair.generate().publicKey.toBase58(),
  balance: { amount: '12345', decimals: 2, uiAmount: 123.45, uiAmountString: '123.45' },
  source: 'metaplex' as const,
  programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
}

// Radix Checkbox measures itself with ResizeObserver and Radix Select uses pointer capture and
// scroll APIs, none of which jsdom implements.
beforeAll(() => {
  if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    }
  }
  if (!HTMLElement.prototype.hasPointerCapture) HTMLElement.prototype.hasPointerCapture = () => false
  if (!HTMLElement.prototype.setPointerCapture) HTMLElement.prototype.setPointerCapture = () => undefined
  if (!HTMLElement.prototype.releasePointerCapture) HTMLElement.prototype.releasePointerCapture = () => undefined
  if (!HTMLElement.prototype.scrollIntoView) HTMLElement.prototype.scrollIntoView = () => undefined
})

const setWalletConnected = (connected: boolean) =>
  vi.mocked(useWallet).mockReturnValue({
    connected,
    publicKey: connected ? WALLET : null,
    signTransaction: connected ? vi.fn() : undefined,
  } as unknown as ReturnType<typeof useWallet>)

const mockTokenMetadata = (decimals: number) =>
  vi.mocked(getTokenMetadata).mockResolvedValue({
    mint: MINT,
    name: 'USD Coin',
    symbol: 'USDC',
    decimals,
    programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    source: 'metaplex',
  })

const renderForm = async () => {
  const user = userEvent.setup()
  await act(async () => {
    renderWithProviders(<MultisenderForm />)
  })
  return user
}

type User = ReturnType<typeof userEvent.setup>

const tokenInput = () => screen.getByPlaceholderText('Enter token address')
const recipientsTextarea = () => screen.getByPlaceholderText(/Enter recipient address and amount/)
const submitButton = () => screen.getByRole('button', { name: /Send Tokens/ })

const selectToken = async (user: User) => {
  await user.type(tokenInput(), MINT)
  await user.click(screen.getByRole('button', { name: 'Validate' }))
  await waitFor(() => expect(screen.getByText('USD Coin')).toBeInTheDocument())
}

const enterRecipients = async (user: User, text: string) => {
  await user.click(recipientsTextarea())
  await user.paste(text)
}

const confirmAndSubmit = async (user: User) => {
  await user.click(screen.getByRole('checkbox'))
  await waitFor(() => expect(submitButton()).toBeEnabled())
  await user.click(submitButton())
}

/** Drives the complete happy path: validated token, recipients, confirmation, submit. */
const fillAndSubmit = async (user: User, recipients: string) => {
  await selectToken(user)
  await enterRecipients(user, recipients)
  await confirmAndSubmit(user)
}

describe('MultisenderForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockExecute.mockResolvedValue(SUCCESS_RESULT)
    setWalletConnected(true)
    mockTokenMetadata(6)
    useToolConfigStore.setState({ configs: {} })
    useToolConfigStore.getState().updateConfig('transaction-multisender', {
      toolId: 'transaction-multisender',
      isEnabled: true,
      baseFee: 0.001,
      networkFee: 0.0005,
    })
    useDiscountCouponStore.setState({ appliedCoupon: null, isValidating: false, error: null })
    walletTokensQuery.mockReturnValue({ data: [WALLET_TOKEN], isLoading: false, error: null, refetch: vi.fn() })
  })

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  it('should render the multisender card with its title', async () => {
    await renderForm()

    expect(screen.getByText('Send to Multiple Recipients')).toBeInTheDocument()
    expect(document.getElementById('multisender-form')).toBeInTheDocument()
  })

  it('should not offer a send button to a disconnected wallet', async () => {
    setWalletConnected(false)
    await renderForm()

    expect(screen.getByText('Connect your wallet to continue')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Send Tokens/ })).not.toBeInTheDocument()
    expect(mockExecute).not.toHaveBeenCalled()
  })

  // ---------------------------------------------------------------------------
  // Submission payload
  // ---------------------------------------------------------------------------

  it('should submit the mint, parsed recipients and token decimals to the multisender hook', async () => {
    const user = await renderForm()

    await fillAndSubmit(user, `${ADDR_1} 1.5\n${ADDR_2} 2`)

    await waitFor(() => expect(mockExecute).toHaveBeenCalledTimes(1))
    expect(mockExecute).toHaveBeenCalledWith({
      tokenMintAddress: MINT,
      recipients: [
        { address: ADDR_1, amount: 1.5 },
        { address: ADDR_2, amount: 2 },
      ],
      decimals: 6,
    })
  })

  it('should pass the decimals of the validated token as a hint', async () => {
    mockTokenMetadata(2)
    const user = await renderForm()

    await fillAndSubmit(user, `${ADDR_1} 10`)

    await waitFor(() => expect(mockExecute).toHaveBeenCalledTimes(1))
    expect(mockExecute.mock.calls[0][0].decimals).toBe(2)
  })

  it('should parse space, comma and tab separated lines and skip invalid ones in order', async () => {
    const user = await renderForm()

    await fillAndSubmit(
      user,
      [`${ADDR_1},0.5`, 'invalid-address 3', `${ADDR_2}\t1`, `${ADDR_3} 0`, '', `  ${ADDR_3} ,  7  `, `${ADDR_1} not-a-number`].join('\n')
    )

    await waitFor(() => expect(mockExecute).toHaveBeenCalledTimes(1))
    expect(mockExecute.mock.calls[0][0].recipients).toEqual([
      { address: ADDR_1, amount: 0.5 },
      { address: ADDR_2, amount: 1 },
      { address: ADDR_3, amount: 7 },
    ])
  })

  it('should ignore extra columns after the amount', async () => {
    const user = await renderForm()

    await fillAndSubmit(user, `${ADDR_1} 2 airdrop-batch-7`)

    await waitFor(() => expect(mockExecute).toHaveBeenCalledTimes(1))
    expect(mockExecute.mock.calls[0][0].recipients).toEqual([{ address: ADDR_1, amount: 2 }])
  })

  it('should keep duplicate recipients as separate transfers', async () => {
    const user = await renderForm()

    await fillAndSubmit(user, `${ADDR_1} 1\n${ADDR_1} 1`)

    await waitFor(() => expect(mockExecute).toHaveBeenCalledTimes(1))
    expect(mockExecute.mock.calls[0][0].recipients).toHaveLength(2)
  })

  it('should keep the send button disabled when no line contains a valid recipient', async () => {
    const user = await renderForm()

    await selectToken(user)
    await enterRecipients(user, 'garbage 1\nnot-a-wallet 2')
    await user.click(screen.getByRole('checkbox'))

    expect(screen.getByText('0 valid recipients')).toBeInTheDocument()
    expect(submitButton()).toBeDisabled()
  })

  it('should not call the hook when the form is submitted without a valid recipient line', async () => {
    const user = await renderForm()

    await selectToken(user)
    await enterRecipients(user, 'garbage 1\nnot-a-wallet 2')
    await user.click(screen.getByRole('checkbox'))
    // Bypass the disabled button to exercise the submit handler's own guard
    await act(async () => {
      fireEvent.submit(document.getElementById('multisender-form')!)
    })

    expect(mockExecute).not.toHaveBeenCalled()
    expect(recipientsTextarea()).toHaveValue('garbage 1\nnot-a-wallet 2')
  })

  // ---------------------------------------------------------------------------
  // Post-submit behaviour
  // ---------------------------------------------------------------------------

  it('should reset the whole form after a successful send', async () => {
    const user = await renderForm()

    await fillAndSubmit(user, `${ADDR_1} 1`)

    await waitFor(() => expect(recipientsTextarea()).toHaveValue(''))
    expect(tokenInput()).toHaveValue('')
    expect(screen.getByRole('checkbox')).not.toBeChecked()
    expect(screen.queryByText('USD Coin')).not.toBeInTheDocument()
    expect(submitButton()).toBeDisabled()
  })

  it('should show the loading state and block re-submission while the send is in flight', async () => {
    let finish: (value: unknown) => void = () => {}
    mockExecute.mockImplementationOnce(() => new Promise((resolve) => (finish = resolve)))
    const user = await renderForm()

    await fillAndSubmit(user, `${ADDR_1} 1`)

    const loadingButton = await screen.findByRole('button', { name: /Sending Tokens\.\.\./ })
    expect(loadingButton).toBeDisabled()
    await user.click(loadingButton)
    expect(mockExecute).toHaveBeenCalledTimes(1)

    await act(async () => finish(SUCCESS_RESULT))
    await waitFor(() => expect(screen.queryByRole('button', { name: /Sending Tokens\.\.\./ })).not.toBeInTheDocument())
  })

  it('should keep the entered data when the hook throws unexpectedly', async () => {
    mockExecute.mockRejectedValueOnce(new Error('boom'))
    const user = await renderForm()

    await fillAndSubmit(user, `${ADDR_1} 1`)

    await waitFor(() => expect(mockExecute).toHaveBeenCalledTimes(1))
    expect(recipientsTextarea()).toHaveValue(`${ADDR_1} 1`)
    expect(tokenInput()).toHaveValue(MINT)
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  // ---------------------------------------------------------------------------
  // Failure handling
  // ---------------------------------------------------------------------------

  it('should keep the recipient list when the send fails', async () => {
    mockExecute.mockResolvedValueOnce(null)
    const user = await renderForm()

    await fillAndSubmit(user, `${ADDR_1} 1`)
    await waitFor(() => expect(mockExecute).toHaveBeenCalledTimes(1))
    await act(async () => {})

    expect(recipientsTextarea()).toHaveValue(`${ADDR_1} 1`)
    expect(tokenInput()).toHaveValue(MINT)
    expect(screen.getByText('USD Coin')).toBeInTheDocument()
  })

  it('should keep only the failed recipients for a retry after a partial failure', async () => {
    mockExecute.mockResolvedValueOnce({
      signatures: ['sig-1'],
      transactionCount: 2,
      successfulRecipients: 2,
      failedRecipients: 1,
      failedRecipientList: [{ address: ADDR_3, amount: 0.000000001 }],
    })
    const user = await renderForm()

    await fillAndSubmit(user, `${ADDR_1} 1\n${ADDR_2} 2\n${ADDR_3} 0.000000001`)
    await waitFor(() => expect(mockExecute).toHaveBeenCalledTimes(1))

    await waitFor(() => expect(recipientsTextarea()).toHaveValue(`${ADDR_3} 0.000000001`))
    expect(screen.getByText('1 valid recipients')).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).not.toBeChecked()
    expect(tokenInput()).toHaveValue(MINT)
    expect(toast.warning).toHaveBeenCalledWith('1 of 3 recipients were not sent — they were kept in the form for a retry.')
  })

  // ---------------------------------------------------------------------------
  // Token validation guard (a wrong decimals assumption could overspend by orders of magnitude)
  // ---------------------------------------------------------------------------

  it('should not submit a token transfer before the token metadata is resolved', async () => {
    const user = await renderForm()

    await user.type(tokenInput(), MINT) // typed, never validated
    await enterRecipients(user, `${ADDR_1} 1`)
    await user.click(screen.getByRole('checkbox'))

    expect(submitButton()).toBeDisabled()
    // Even bypassing the disabled button, the submit handler refuses
    await act(async () => {
      fireEvent.submit(document.getElementById('multisender-form')!)
    })

    expect(mockExecute).not.toHaveBeenCalled()
  })

  it('should refuse to send when the token address was changed after validation', async () => {
    const user = await renderForm()

    await selectToken(user)
    await enterRecipients(user, `${ADDR_1} 1`)
    await user.click(screen.getByRole('checkbox'))
    await user.type(tokenInput(), '{backspace}')

    await waitFor(() => expect(submitButton()).toBeDisabled())
    await act(async () => {
      fireEvent.submit(document.getElementById('multisender-form')!)
    })

    expect(mockExecute).not.toHaveBeenCalled()
  })

  // ---------------------------------------------------------------------------
  // "My Tokens" mode (token picked from the connected wallet)
  // ---------------------------------------------------------------------------

  it('should submit a token picked from the wallet list with its mint and decimals', async () => {
    const user = await renderForm()

    await user.click(screen.getByRole('button', { name: 'My Tokens' }))
    expect(screen.getByText('Found 1 token in your wallet')).toBeInTheDocument()
    await user.click(screen.getByRole('combobox'))
    await user.click(await screen.findByRole('option', { name: /Tether USD/ }))

    // Token card shows the wallet balance of the picked token
    await waitFor(() => expect(screen.getByText('Balance: 123.45')).toBeInTheDocument())
    await enterRecipients(user, `${ADDR_1} 1`)
    await confirmAndSubmit(user)

    await waitFor(() => expect(mockExecute).toHaveBeenCalledTimes(1))
    expect(mockExecute).toHaveBeenCalledWith({
      tokenMintAddress: WALLET_TOKEN_MINT,
      recipients: [{ address: ADDR_1, amount: 1 }],
      decimals: 2,
    })
  })

  it('should drop a validated token and disable sending when switching selection mode', async () => {
    const user = await renderForm()

    await selectToken(user)
    await enterRecipients(user, `${ADDR_1} 1`)
    await user.click(screen.getByRole('checkbox'))
    await waitFor(() => expect(submitButton()).toBeEnabled())

    await user.click(screen.getByRole('button', { name: 'My Tokens' }))

    await waitFor(() => expect(screen.queryByText('USD Coin')).not.toBeInTheDocument())
    expect(submitButton()).toBeDisabled()
  })
})

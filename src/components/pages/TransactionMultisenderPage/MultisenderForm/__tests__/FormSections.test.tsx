// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Keypair } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'
import { Form } from '@/components/ui/form'
import { renderWithProviders } from '@/__tests__/utils/componentTestHelpers'
import { useToolConfigStore } from '@/stores/toolConfigStore'
import { useDiscountCouponStore } from '@/stores/discountCouponStore'
import { FormSections } from '../FormSections'
import { MultisenderFormSchema, type MultisenderFormData } from '../multisenderSchema'

// Stub out the WalletConnectionButton to avoid needing a full WalletProvider.
// UnifiedActionButtons renders it when no wallet is connected.
vi.mock('@/components/common/WalletConnectionButton/WalletConnectionButton', () => ({
  default: () => <button type='button'>Connect Wallet</button>,
}))

// Mock wallet adapter — UnifiedActionButtons and ManualTokenEntry call these hooks internally
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

import { toast } from 'sonner'
import { getTokenMetadata } from '@/lib/solana/getTokenMetadata'

const MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const WALLET = Keypair.generate().publicKey
const [ADDR_1, ADDR_2, ADDR_3] = Array.from({ length: 3 }, () => Keypair.generate().publicKey.toBase58())

// FormSections requires a react-hook-form context plus shadcn <Form> provider — mirror MultisenderForm's setup
const FormWrapper = () => {
  const form = useForm<MultisenderFormData>({
    resolver: zodResolver(MultisenderFormSchema),
    defaultValues: { tokenAddress: '', recipientsInput: '', confirmSend: false },
    mode: 'onBlur',
  })

  return (
    <Form {...form}>
      <form>
        <FormSections form={form} />
      </form>
    </Form>
  )
}

const setWalletConnected = (connected: boolean) =>
  vi.mocked(useWallet).mockReturnValue({
    connected,
    publicKey: connected ? WALLET : null,
    signTransaction: connected ? vi.fn() : undefined,
  } as unknown as ReturnType<typeof useWallet>)

const renderSections = async () => {
  const user = userEvent.setup()
  await act(async () => {
    renderWithProviders(<FormWrapper />)
  })
  return user
}

const recipientsTextarea = () => screen.getByPlaceholderText(/Enter recipient address and amount/)
const submitButton = () => screen.getByRole('button', { name: /Send Tokens/ })

const enterRecipients = async (user: ReturnType<typeof userEvent.setup>, text: string) => {
  await user.click(recipientsTextarea())
  await user.paste(text)
}

const validateToken = async (user: ReturnType<typeof userEvent.setup>, mint = MINT) => {
  await user.type(screen.getByPlaceholderText('Enter token address'), mint)
  await user.click(screen.getByRole('button', { name: 'Validate' }))
}

// Radix Checkbox measures itself with ResizeObserver, which jsdom does not implement.
beforeAll(() => {
  if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    }
  }
})

describe('Multisender FormSections', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setWalletConnected(true)
    useToolConfigStore.setState({ configs: {} })
    useToolConfigStore.getState().updateConfig('transaction-multisender', {
      toolId: 'transaction-multisender',
      isEnabled: true,
      baseFee: 0.001,
      networkFee: 0.0005,
    })
    useDiscountCouponStore.setState({ appliedCoupon: null, isValidating: false, error: null })
    vi.mocked(getTokenMetadata).mockResolvedValue({
      mint: MINT,
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6,
      programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
      source: 'metaplex',
    })
  })

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  it('should render token selection in manual entry mode by default', async () => {
    await renderSections()

    expect(screen.getByText('Select Token to Send')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Manual Entry' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'My Tokens' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter token address')).toBeInTheDocument()
  })

  it('should render the recipients input with format instructions', async () => {
    await renderSections()

    expect(screen.getByText('Recipients (Address, Amount - one per line)')).toBeInTheDocument()
    expect(recipientsTextarea()).toBeInTheDocument()
    expect(screen.getByText('Format Instructions:')).toBeInTheDocument()
    expect(screen.getByText('One recipient per line')).toBeInTheDocument()
  })

  it('should render the fee breakdown and the confirmation section', async () => {
    await renderSections()

    expect(screen.getByText('Fee Breakdown')).toBeInTheDocument()
    expect(screen.getByText('Confirmation Required')).toBeInTheDocument()
    expect(screen.getByText('I have verified all recipient addresses and amounts are correct')).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  // ---------------------------------------------------------------------------
  // Wallet connection gating
  // ---------------------------------------------------------------------------

  it('should ask to connect a wallet instead of showing the send button when disconnected', async () => {
    setWalletConnected(false)
    await renderSections()

    expect(screen.getByText('Connect your wallet to continue')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Connect Wallet' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Send Tokens/ })).not.toBeInTheDocument()
  })

  it('should show a disabled send button once the wallet is connected', async () => {
    await renderSections()

    expect(screen.queryByText('Connect your wallet to continue')).not.toBeInTheDocument()
    expect(submitButton()).toBeDisabled()
  })

  it('should keep the send button disabled when the tool is disabled in Contentful', async () => {
    useToolConfigStore.getState().updateConfig('transaction-multisender', {
      toolId: 'transaction-multisender',
      isEnabled: false,
      disabledMessage: 'Multisender is under maintenance',
      baseFee: 0.001,
      networkFee: 0.0005,
    })
    const user = await renderSections()

    await validateToken(user)
    await enterRecipients(user, `${ADDR_1} 1`)
    await user.click(screen.getByRole('checkbox'))

    expect(screen.getByText('Tool Temporarily Disabled')).toBeInTheDocument()
    expect(screen.getByText('Multisender is under maintenance')).toBeInTheDocument()
    expect(submitButton()).toBeDisabled()
  })

  // ---------------------------------------------------------------------------
  // Recipients parsing (live summary)
  // ---------------------------------------------------------------------------

  it('should not show a recipient summary while the textarea is empty', async () => {
    await renderSections()
    expect(screen.queryByText(/valid recipients/)).not.toBeInTheDocument()
  })

  it('should count recipients separated by spaces, commas and tabs', async () => {
    const user = await renderSections()

    await enterRecipients(user, `${ADDR_1} 1.5\n${ADDR_2},2\n${ADDR_3}\t1`)

    expect(screen.getByText('3 valid recipients')).toBeInTheDocument()
    expect(screen.getByText('Total amount: 4.5')).toBeInTheDocument()
  })

  it('should accept "address, amount" with a space after the comma', async () => {
    const user = await renderSections()

    await enterRecipients(user, `${ADDR_1}, 0.25`)

    expect(screen.getByText('1 valid recipients')).toBeInTheDocument()
    expect(screen.getByText('Total amount: 0.25')).toBeInTheDocument()
  })

  it('should ignore invalid addresses, non-numeric, zero, negative and missing amounts and blank lines', async () => {
    const user = await renderSections()

    await enterRecipients(
      user,
      [`${ADDR_1} 1`, 'not-a-solana-address 5', `${ADDR_2} abc`, `${ADDR_2} 0`, `${ADDR_3} -2`, `${ADDR_3}`, '', '   ', `${ADDR_3} 2`].join(
        '\n'
      )
    )

    expect(screen.getByText('2 valid recipients')).toBeInTheDocument()
    expect(screen.getByText('Total amount: 3')).toBeInTheDocument()
  })

  it('should report zero valid recipients and hide the total when no line is valid', async () => {
    const user = await renderSections()

    await enterRecipients(user, 'garbage line\nanother 1')

    expect(screen.getByText('0 valid recipients')).toBeInTheDocument()
    expect(screen.queryByText(/Total amount/)).not.toBeInTheDocument()
  })

  it('should list invalid lines with their line number and reason', async () => {
    const user = await renderSections()

    await enterRecipients(user, `${ADDR_1} 1\nnot-a-wallet 2\n${ADDR_2} abc\n${ADDR_3}`)

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('3 invalid lines will not be sent:')
    expect(alert).toHaveTextContent('Line 2: Invalid address')
    expect(alert).toHaveTextContent('Line 3: Invalid amount "abc"')
    expect(alert).toHaveTextContent('Line 4: Missing amount')
  })

  it('should reject a decimal comma instead of silently sending a different amount', async () => {
    const user = await renderSections()

    await enterRecipients(user, `${ADDR_1} 1,5`)

    expect(screen.getByText('0 valid recipients')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Line 1: Invalid amount "1,5"')
  })

  it('should only show the first three invalid lines and summarise the rest', async () => {
    const user = await renderSections()

    await enterRecipients(user, ['a 1', 'b 1', 'c 1', 'd 1', 'e 1'].join('\n'))

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('5 invalid lines will not be sent:')
    expect(alert).toHaveTextContent('Line 3: Invalid address')
    expect(alert).not.toHaveTextContent('Line 4')
    expect(alert).toHaveTextContent('…and 2 more')
  })

  it('should not show the invalid-lines alert when every line is valid', async () => {
    const user = await renderSections()

    await enterRecipients(user, `${ADDR_1} 1\n${ADDR_2} 2`)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('should display totals with up to 9 decimal places', async () => {
    const user = await renderSections()

    await enterRecipients(user, `${ADDR_1} 1\n${ADDR_2} 0.000000001`)

    expect(screen.getByText('Total amount: 1.000000001')).toBeInTheDocument()
  })

  it('should show the recipient count in the send button only for more than one recipient', async () => {
    const user = await renderSections()

    await enterRecipients(user, `${ADDR_1} 1`)
    expect(submitButton()).toHaveTextContent(/^Send Tokens$/)

    await user.paste(`\n${ADDR_2} 1\n${ADDR_3} 1`)
    expect(submitButton()).toHaveTextContent('Send Tokens (3 recipients)')
  })

  // ---------------------------------------------------------------------------
  // Fee calculation
  // ---------------------------------------------------------------------------

  it('should multiply the service fee by the number of valid recipients', async () => {
    const user = await renderSections()

    await enterRecipients(user, `${ADDR_1} 1\n${ADDR_2} 1\n${ADDR_3} 1\ninvalid 1`)

    await waitFor(() => expect(screen.getByText('Service Fee (×3):')).toBeInTheDocument())
    expect(screen.getByText('0.003 SOL')).toBeInTheDocument()
    expect(screen.getByText('Network Fee (estimated):')).toBeInTheDocument()
    expect(screen.getByText('0.0035 SOL')).toBeInTheDocument() // total
  })

  it('should show a single service fee before any recipient is entered', async () => {
    await renderSections()

    await waitFor(() => expect(screen.getByText('Service Fee:')).toBeInTheDocument())
    expect(screen.getByText('0.001 SOL')).toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // Token selection (manual entry with real validateMultisenderToken)
  // ---------------------------------------------------------------------------

  it('should look up the mint and display the selected token after validation', async () => {
    const user = await renderSections()

    await validateToken(user)

    await waitFor(() => expect(screen.getByText('USD Coin')).toBeInTheDocument())
    expect(getTokenMetadata).toHaveBeenCalledWith(MINT, expect.anything(), { includeImages: true, commitment: 'confirmed' })
    expect(screen.getByText('USDC •')).toBeInTheDocument()
    expect(screen.getByText('Valid Token')).toBeInTheDocument()
    expect(toast.success).toHaveBeenCalledWith('Token found: USDC')
  })

  it('should show an error and no token card when the mint does not exist', async () => {
    vi.mocked(getTokenMetadata).mockRejectedValueOnce(new Error('Token mint not found'))
    const user = await renderSections()

    await validateToken(user)

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Invalid token mint address.'))
    expect(screen.queryByText('USD Coin')).not.toBeInTheDocument()
  })

  it('should not allow validating a malformed token address', async () => {
    const user = await renderSections()

    await user.type(screen.getByPlaceholderText('Enter token address'), 'not-a-mint')

    expect(screen.getByRole('button', { name: 'Validate' })).toBeDisabled()
    expect(getTokenMetadata).not.toHaveBeenCalled()
  })

  // ---------------------------------------------------------------------------
  // Submit button gating
  // ---------------------------------------------------------------------------

  it('should enable the send button only once token, recipients and confirmation are all provided', async () => {
    const user = await renderSections()

    await validateToken(user)
    await waitFor(() => expect(screen.getByText('USD Coin')).toBeInTheDocument())
    expect(submitButton()).toBeDisabled()

    await enterRecipients(user, `${ADDR_1} 1`)
    expect(submitButton()).toBeDisabled()

    await user.click(screen.getByRole('checkbox'))
    await waitFor(() => expect(submitButton()).toBeEnabled())
  })

  it('should disable the send button again when the confirmation is unchecked', async () => {
    const user = await renderSections()

    await validateToken(user)
    await enterRecipients(user, `${ADDR_1} 1`)
    await user.click(screen.getByRole('checkbox'))
    await waitFor(() => expect(submitButton()).toBeEnabled())

    await user.click(screen.getByRole('checkbox'))
    await waitFor(() => expect(submitButton()).toBeDisabled())
  })

  it('should keep the send button disabled without confirmation even with valid recipients', async () => {
    const user = await renderSections()

    await validateToken(user)
    await enterRecipients(user, `${ADDR_1} 1\n${ADDR_2} 2`)

    expect(submitButton()).toBeDisabled()
  })

  it('should keep the send button disabled when the token address was typed but never validated', async () => {
    const user = await renderSections()

    await user.type(screen.getByPlaceholderText('Enter token address'), MINT)
    await enterRecipients(user, `${ADDR_1} 1`)
    await user.click(screen.getByRole('checkbox'))
    await user.click(document.body)

    await waitFor(() => expect(screen.getByText('Validate the token before sending')).toBeInTheDocument())
    expect(submitButton()).toBeDisabled()
    expect(screen.queryByText('USD Coin')).not.toBeInTheDocument()
  })

  it('should drop the token card and disable sending when the address is edited after validation', async () => {
    const user = await renderSections()

    await validateToken(user)
    await enterRecipients(user, `${ADDR_1} 1`)
    await user.click(screen.getByRole('checkbox'))
    await waitFor(() => expect(submitButton()).toBeEnabled())

    await user.type(screen.getByPlaceholderText('Enter token address'), '{backspace}')

    await waitFor(() => expect(submitButton()).toBeDisabled())
    expect(screen.queryByText('USD Coin')).not.toBeInTheDocument()
  })
})

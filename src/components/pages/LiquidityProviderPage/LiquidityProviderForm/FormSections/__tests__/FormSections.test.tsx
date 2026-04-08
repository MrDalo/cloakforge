// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { Form } from '@/components/ui/form'
import { FormSections } from '../../FormSections'
import { renderWithProviders } from '@/__tests__/utils/componentTestHelpers'

// Stub out the WalletConnectionButton to avoid needing a full WalletProvider.
// UnifiedActionButtons renders it when no wallet is connected.
vi.mock('@/components/common/WalletConnectionButton/WalletConnectionButton', () => ({
  default: () => <button type='button'>Connect Wallet</button>,
}))

// Also mock ToolActionButton to avoid complex wallet dependencies
vi.mock('@/components/common/ToolActionButton', () => ({
  ToolActionButton: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { isLoading?: boolean; toolId?: string }) => (
    <button {...props}>{children}</button>
  ),
}))

// Mock wallet adapter — UnifiedActionButtons calls useWallet internally
vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => ({
    connected: false,
    publicKey: null,
    signTransaction: vi.fn(),
    signAllTransactions: vi.fn(),
    wallet: null,
    connecting: false,
    disconnecting: false,
    disconnect: vi.fn(),
  }),
  useConnection: () => ({
    connection: {},
  }),
}))

// Mock getToolUIConfig — avoids dependency on full config map in unit tests
vi.mock('@/lib/config/getToolUIConfig', () => ({
  getToolUIConfig: vi.fn(() => ({
    submitText: 'Create Pool',
    loadingText: 'Creating...',
    icon: () => null,
    variant: 'emerald',
  })),
}))

// FormSections requires a react-hook-form context plus shadcn <Form> provider
const FormWrapper = () => {
  const form = useForm({
    defaultValues: {
      poolType: '',
      tokenA: '',
      tokenB: '',
      amountA: '',
      amountB: '',
      feeTier: '',
      slippageTolerance: '0.5',
      deadline: '20',
      platformFee: '0.1',
    },
  })

  return (
    <Form {...form}>
      <form>
        <FormSections form={form} />
      </form>
    </Form>
  )
}

// Radix UI Select uses pointer capture and scroll APIs that jsdom does not implement.
// Polyfill the missing methods on HTMLElement so the component can mount and open.
beforeAll(() => {
  if (!HTMLElement.prototype.hasPointerCapture) {
    HTMLElement.prototype.hasPointerCapture = () => false
  }
  if (!HTMLElement.prototype.setPointerCapture) {
    HTMLElement.prototype.setPointerCapture = () => undefined
  }
  if (!HTMLElement.prototype.releasePointerCapture) {
    HTMLElement.prototype.releasePointerCapture = () => undefined
  }
  if (!HTMLElement.prototype.scrollIntoView) {
    HTMLElement.prototype.scrollIntoView = () => undefined
  }
})

describe('FormSections', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render pool type selection', () => {
    renderWithProviders(<FormWrapper />)

    expect(screen.getByText('Pool Type')).toBeInTheDocument()
    expect(screen.getByText('Choose between CPMM (simple) or CLMM (advanced) pool types')).toBeInTheDocument()
  })

  it('should render all required form field labels', () => {
    renderWithProviders(<FormWrapper />)

    expect(screen.getByText('Pool Type *')).toBeInTheDocument()
    expect(screen.getByText('Token A *')).toBeInTheDocument()
    expect(screen.getByText('Token B *')).toBeInTheDocument()
    expect(screen.getByText('Amount A *')).toBeInTheDocument()
    expect(screen.getByText('Amount B *')).toBeInTheDocument()
    expect(screen.getByText('Fee Tier *')).toBeInTheDocument()
  })

  it('should render all card section headings', () => {
    renderWithProviders(<FormWrapper />)

    expect(screen.getByText('Pool Type')).toBeInTheDocument()
    expect(screen.getByText('Token Pair')).toBeInTheDocument()
    expect(screen.getByText('Pool Configuration')).toBeInTheDocument()
    expect(screen.getByText('Advanced Settings')).toBeInTheDocument()
  })

  it('should render card section descriptions', () => {
    renderWithProviders(<FormWrapper />)

    expect(screen.getByText('Configure the tokens for your liquidity pool')).toBeInTheDocument()
    expect(screen.getByText('Configure pool settings and fee structure')).toBeInTheDocument()
    expect(screen.getByText('Platform fees and transaction settings')).toBeInTheDocument()
  })

  it('should render Token A address input', () => {
    renderWithProviders(<FormWrapper />)

    const tokenAInput = screen.getByPlaceholderText('Token mint address')
    expect(tokenAInput).toBeInTheDocument()
  })

  it('should not show custom token input initially', () => {
    renderWithProviders(<FormWrapper />)

    expect(screen.queryByText('Custom Token B Address')).not.toBeInTheDocument()
  })

  it('should not show CLMM price range fields initially', () => {
    renderWithProviders(<FormWrapper />)

    expect(screen.queryByText('Min Price')).not.toBeInTheDocument()
    expect(screen.queryByText('Max Price')).not.toBeInTheDocument()
  })

  it('should show custom token input when custom tokenB is selected', async () => {
    const user = userEvent.setup()

    renderWithProviders(<FormWrapper />)

    // Radix SelectTrigger is a <button role="combobox">. The placeholder text is
    // rendered inside a <span pointer-events:none> — click the parent button.
    const comboboxes = screen.getAllByRole('combobox')
    // Token B is the second combobox (after Pool Type)
    const tokenBButton = comboboxes[1]
    await user.click(tokenBButton)

    // Select custom option from dropdown
    const customOption = await screen.findByText('Custom Token')
    await user.click(customOption)

    await waitFor(() => {
      expect(screen.getByText('Custom Token B Address')).toBeInTheDocument()
    })
  })

  it('should show price range inputs when CLMM pool type is selected', async () => {
    const user = userEvent.setup()

    renderWithProviders(<FormWrapper />)

    // Pool Type is the first combobox
    const comboboxes = screen.getAllByRole('combobox')
    await user.click(comboboxes[0])

    // Select CLMM
    const clmmOption = await screen.findByText('CLMM (Advanced)')
    await user.click(clmmOption)

    await waitFor(() => {
      expect(screen.getByText('Min Price')).toBeInTheDocument()
      expect(screen.getByText('Max Price')).toBeInTheDocument()
    })
  })

  it('should not show price range fields for CPMM pool type', async () => {
    const user = userEvent.setup()

    renderWithProviders(<FormWrapper />)

    const comboboxes = screen.getAllByRole('combobox')
    await user.click(comboboxes[0])

    const cpmmOption = await screen.findByText('CPMM (Recommended)')
    await user.click(cpmmOption)

    await waitFor(() => {
      expect(screen.queryByText('Min Price')).not.toBeInTheDocument()
      expect(screen.queryByText('Max Price')).not.toBeInTheDocument()
    })
  })

  it('should display fee tier options in dropdown', async () => {
    const user = userEvent.setup()

    renderWithProviders(<FormWrapper />)

    // Fee Tier is the third combobox (pool type, token B, fee tier)
    const comboboxes = screen.getAllByRole('combobox')
    await user.click(comboboxes[2])

    expect(await screen.findByText('0.01% (Most Liquid)')).toBeInTheDocument()
    expect(screen.getByText('0.05% (Standard)')).toBeInTheDocument()
    expect(screen.getByText('0.25% (Less Liquid)')).toBeInTheDocument()
    expect(screen.getByText('1.00% (Exotic Pairs)')).toBeInTheDocument()
  })

  it('should display token B options in dropdown', async () => {
    const user = userEvent.setup()

    renderWithProviders(<FormWrapper />)

    // Token B is the second combobox
    const comboboxes = screen.getAllByRole('combobox')
    await user.click(comboboxes[1])

    expect(await screen.findByText('SOL (Solana)')).toBeInTheDocument()
    expect(screen.getByText('USDC (USD Coin)')).toBeInTheDocument()
    expect(screen.getByText('USDT (Tether)')).toBeInTheDocument()
    expect(screen.getByText('Custom Token')).toBeInTheDocument()
  })

  it('should render slippage tolerance input with default placeholder', () => {
    renderWithProviders(<FormWrapper />)

    expect(screen.getByPlaceholderText('0.5')).toBeInTheDocument()
  })

  it('should render deadline and platform fee inputs', () => {
    renderWithProviders(<FormWrapper />)

    expect(screen.getByPlaceholderText('20')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('0.1')).toBeInTheDocument()
  })

  it('should render CLMM price range label when CLMM is selected', async () => {
    const user = userEvent.setup()

    renderWithProviders(<FormWrapper />)

    const comboboxes = screen.getAllByRole('combobox')
    await user.click(comboboxes[0])

    const clmmOption = await screen.findByText('CLMM (Advanced)')
    await user.click(clmmOption)

    await waitFor(() => {
      expect(screen.getByText('Price Range (CLMM Required)')).toBeInTheDocument()
    })
  })
})

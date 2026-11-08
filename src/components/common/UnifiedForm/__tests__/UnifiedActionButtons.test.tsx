// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { Send } from 'lucide-react'
import { UnifiedActionButtons } from '../UnifiedActionButtons'
import { useComplianceStore } from '@/lib/compliance/consentStore'
import { TERMS_VERSION, getConsentStatement } from '@/lib/compliance/legalConstants'

const WALLET = 'TestWallet111111111111111111111111111111111'

vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => ({ publicKey: { toString: () => WALLET } }),
}))

vi.mock('@/components/common/WalletConnectionButton/WalletConnectionButton', () => ({
  default: () => <button type='button'>Connect Wallet</button>,
}))

vi.mock('@/components/common/ToolActionButton', () => ({
  ToolActionButton: ({
    children,
    isLoading: _isLoading,
    toolId: _toolId,
    ...props
  }: React.ComponentProps<'button'> & { isLoading?: boolean; toolId?: string }) => <button {...props}>{children}</button>,
}))

vi.mock('@/lib/compliance/receipt', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/compliance/receipt')>()),
  downloadReceipt: vi.fn(),
}))

const Harness = ({ toolId, requiresConsent }: { toolId: string; requiresConsent?: boolean }) => {
  const form = useForm()
  return (
    <UnifiedActionButtons
      customValidation
      form={form}
      requiresConsent={requiresConsent}
      submitConfig={{ text: 'Sign and pay', loadingText: 'Working...', icon: Send }}
      toolId={toolId}
    />
  )
}

describe('UnifiedActionButtons consent gating', () => {
  beforeEach(() => {
    useComplianceStore.setState({ consents: {}, armedToolId: null, receipts: {}, feeQuotes: {} })
  })

  it('should show an unticked required checkbox with the exact consent wording and legal links', () => {
    render(<Harness toolId='burn-tokens' />)

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()
    expect(checkbox).toBeRequired()
    expect(
      screen.getByText((_, element) => element?.tagName === 'LABEL' && element.textContent === getConsentStatement(TERMS_VERSION))
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute('href', '/terms-of-service')
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy-policy')
  })

  it('should keep the submit button disabled until the checkbox is ticked and record the consent', async () => {
    const user = userEvent.setup()
    render(<Harness toolId='burn-tokens' />)

    expect(screen.getByRole('button', { name: 'Sign and pay' })).toBeDisabled()

    await user.click(screen.getByRole('checkbox'))

    expect(screen.getByRole('button', { name: 'Sign and pay' })).toBeEnabled()
    const consent = useComplianceStore.getState().consents['burn-tokens']
    expect(consent).toMatchObject({ wallet: WALLET, termsVersion: TERMS_VERSION, statement: getConsentStatement(TERMS_VERSION) })
    expect(Number.isNaN(Date.parse(consent.acceptedAt))).toBe(false)
  })

  it('should disable the button again when the checkbox is unticked and withdraw the consent', async () => {
    const user = userEvent.setup()
    render(<Harness toolId='burn-tokens' />)

    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('checkbox'))

    expect(screen.getByRole('button', { name: 'Sign and pay' })).toBeDisabled()
    expect(useComplianceStore.getState().consents['burn-tokens']).toBeUndefined()
  })

  it('should arm the tool when the submit button is pressed', async () => {
    const user = userEvent.setup()
    render(<Harness toolId='burn-tokens' />)

    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Sign and pay' }))

    expect(useComplianceStore.getState().armedToolId).toBe('burn-tokens')
  })

  it('should neither show the checkbox nor gate the button for the donation', () => {
    render(<Harness requiresConsent={false} toolId='donation' />)

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign and pay' })).toBeEnabled()
  })

  it('should offer the confirmation download once a receipt exists', async () => {
    const user = userEvent.setup()
    const { downloadReceipt } = await import('@/lib/compliance/receipt')
    render(<Harness toolId='burn-tokens' />)
    expect(screen.queryByRole('button', { name: /download confirmation/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Sign and pay' }))
    act(() => {
      useComplianceStore.getState().recordTransactionSignature('sig-1')
    })

    await user.click(await screen.findByRole('button', { name: /download confirmation/i }))

    expect(downloadReceipt).toHaveBeenCalledWith(expect.objectContaining({ signatures: ['sig-1'], toolId: 'burn-tokens' }))
  })
})

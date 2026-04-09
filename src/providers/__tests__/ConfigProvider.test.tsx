// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useContext } from 'react'
import { ConfigContext, ConfigProvider } from '../ConfigProvider'
import type { ConfigType } from '@/types/config'

// ---------------------------------------------------------------------------
// A small helper component that reads from ConfigContext and renders the values
// ---------------------------------------------------------------------------
const ConfigConsumer = () => {
  const config = useContext(ConfigContext)
  if (!config) return <div>no config</div>
  return (
    <div>
      <span data-testid="rpc">{config.rpcPublicEndpoint}</span>
      <span data-testid="fee">{config.feeWalletAddress}</span>
    </div>
  )
}

const testConfig: ConfigType = {
  rpcPublicEndpoint: 'https://api.mainnet-beta.solana.com',
  feeWalletAddress: 'FeeWallet1234567890',
}

describe('ConfigProvider', () => {
  it('renders children', () => {
    render(
      <ConfigProvider value={testConfig}>
        <p>child content</p>
      </ConfigProvider>
    )
    expect(screen.getByText('child content')).toBeInTheDocument()
  })

  it('provides config value to consumers via ConfigContext', () => {
    render(
      <ConfigProvider value={testConfig}>
        <ConfigConsumer />
      </ConfigProvider>
    )

    expect(screen.getByTestId('rpc').textContent).toBe('https://api.mainnet-beta.solana.com')
    expect(screen.getByTestId('fee').textContent).toBe('FeeWallet1234567890')
  })

  it('ConfigContext defaults to undefined without a provider', () => {
    render(<ConfigConsumer />)
    expect(screen.getByText('no config')).toBeInTheDocument()
  })

  it('renders multiple children', () => {
    render(
      <ConfigProvider value={testConfig}>
        <span>first</span>
        <span>second</span>
      </ConfigProvider>
    )
    expect(screen.getByText('first')).toBeInTheDocument()
    expect(screen.getByText('second')).toBeInTheDocument()
  })

  it('passes updated config value to consumers', () => {
    const updatedConfig: ConfigType = {
      rpcPublicEndpoint: 'https://rpc.example.com',
      feeWalletAddress: 'AnotherWallet',
    }

    const { rerender } = render(
      <ConfigProvider value={testConfig}>
        <ConfigConsumer />
      </ConfigProvider>
    )

    rerender(
      <ConfigProvider value={updatedConfig}>
        <ConfigConsumer />
      </ConfigProvider>
    )

    expect(screen.getByTestId('rpc').textContent).toBe('https://rpc.example.com')
    expect(screen.getByTestId('fee').textContent).toBe('AnotherWallet')
  })
})

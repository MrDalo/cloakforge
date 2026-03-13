# Mock Patterns for CloakForge

## Solana RPC Mocking

### Mock Connection
```typescript
import { Connection } from '@solana/web3.js'

vi.mock('@solana/web3.js', () => ({
  Connection: vi.fn().mockImplementation(() => ({
    getLatestBlockhash: vi.fn().mockResolvedValue({
      blockhash: 'mock-blockhash',
      lastValidBlockHeight: 12345
    }),
    getAccountInfo: vi.fn().mockResolvedValue(null),
    sendTransaction: vi.fn().mockResolvedValue('mock-signature'),
    getMultipleAccountsInfo: vi.fn().mockResolvedValue([null, null]),
    getParsedTokenAccountsByOwner: vi.fn().mockResolvedValue({
      value: []
    })
  })),
  PublicKey: class MockPublicKey {
    constructor(public key: string) {}
    toString() { return this.key }
    toBase58() { return this.key }
  },
  Transaction: vi.fn().mockImplementation(() => ({
    add: vi.fn(),
    serialize: vi.fn().mockReturnValue(Buffer.from('mock-transaction', 'base64'))
  })),
  LAMPORTS_PER_SOL: 1000000000
}))
```

### Mock Specific RPC Methods
```typescript
const mockConnection = {
  getLatestBlockhash: vi.fn().mockResolvedValue({
    blockhash: 'DqXFjUGKKY9VT6LCr2zVGJgNL1QKC6CaS4LDN8RfzMGf',
    lastValidBlockHeight: 12345
  }),
  getAccountInfo: vi.fn().mockImplementation((pubkey) => {
    if (pubkey.toString() === 'token-mint-address') {
      return Promise.resolve({
        data: Buffer.from('mock-token-data'),
        owner: TOKEN_PROGRAM_ID
      })
    }
    return Promise.resolve(null)
  })
}
```

## Wallet Adapter Mocking

### Complete Wallet Mock
```typescript
const mockWallet = {
  connected: true,
  connecting: false,
  disconnecting: false,
  publicKey: new PublicKey('11111111111111111111111111111112'),
  wallet: {
    adapter: {
      name: 'Mock Wallet',
      icon: 'mock-icon'
    }
  },
  signTransaction: vi.fn().mockImplementation(async (transaction) => {
    // Add mock signature
    transaction.addSignature(mockWallet.publicKey, Buffer.from('mock-signature'))
    return transaction
  }),
  signAllTransactions: vi.fn().mockImplementation(async (transactions) => {
    return transactions.map(tx => {
      tx.addSignature(mockWallet.publicKey, Buffer.from('mock-signature'))
      return tx
    })
  }),
  sendTransaction: vi.fn().mockResolvedValue('mock-transaction-signature'),
  connect: vi.fn(),
  disconnect: vi.fn()
}

vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => mockWallet,
  useConnection: () => ({
    connection: mockConnection
  })
}))
```

### Wallet State Variations
```typescript
// Connected wallet
const connectedWallet = { ...mockWallet, connected: true }

// Disconnected wallet
const disconnectedWallet = { ...mockWallet, connected: false, publicKey: null }

// Connecting wallet
const connectingWallet = { ...mockWallet, connected: false, connecting: true }

// Error state wallet
const errorWallet = {
  ...mockWallet,
  connected: false,
  signTransaction: vi.fn().mockRejectedValue(new Error('User rejected'))
}
```

## Server Config Mocking

```typescript
vi.mock('@/lib/config/serverConfig', () => ({
  getServerConfig: vi.fn().mockReturnValue({
    rpcPrivateEndpoint: 'https://mock-private-rpc.com',
    rpcPublicEndpoint: 'https://mock-public-rpc.com',
    environment: 'test'
  })
}))
```

## API Route Mocking with MSW

### Setup MSW Server
```typescript
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

const server = setupServer(
  // Mock burn token API
  http.post('/api/solana/burn/route', async ({ request }) => {
    const body = await request.json()

    // Validate request
    if (!body.mintAddress || !body.amount) {
      return HttpResponse.json(
        { error: 'Invalid input' },
        { status: 400 }
      )
    }

    // Return mock transaction
    return HttpResponse.json({
      transaction: 'mock-base64-transaction-string'
    })
  }),

  // Mock token creation API
  http.post('/api/solana/create-token/route', () => {
    return HttpResponse.json({
      transaction: 'mock-create-token-transaction',
      mintAddress: 'mock-mint-address'
    })
  })
)

// Setup in test files
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

### Dynamic Response Mocking
```typescript
// Success response
server.use(
  http.post('/api/solana/burn/route', () => {
    return HttpResponse.json({ transaction: 'success-transaction' })
  })
)

// Error response
server.use(
  http.post('/api/solana/burn/route', () => {
    return HttpResponse.json(
      { error: 'Insufficient funds' },
      { status: 400 }
    )
  })
)
```

## Form Testing Mocks

### React Hook Form Mocking
```typescript
const mockFormMethods = {
  register: vi.fn(() => ({ onChange: vi.fn(), onBlur: vi.fn(), name: 'test' })),
  handleSubmit: vi.fn((fn) => vi.fn(() => fn({}))),
  formState: { errors: {}, isSubmitting: false, isValid: true },
  control: {},
  setValue: vi.fn(),
  getValues: vi.fn(),
  reset: vi.fn()
}

vi.mock('react-hook-form', () => ({
  useForm: vi.fn(() => mockFormMethods),
  Controller: ({ render }: any) => render(mockFormMethods)
}))
```

## TanStack Query Mocking

```typescript
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn((options) => ({
    data: options.queryKey.includes('token-metadata') ? mockTokenMetadata : null,
    isLoading: false,
    error: null,
    refetch: vi.fn()
  })),
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isLoading: false,
    error: null,
    data: null
  }))
}))
```

## Logger Mocking

```typescript
vi.mock('@/lib/logger/logger', () => ({
  getLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }))
}))
```

## Error Handling Mocks

```typescript
// Mock error classes
vi.mock('@/lib/errors', () => ({
  AppError: class MockAppError extends Error {
    constructor(message: string, public statusCode = 500) {
      super(message)
    }
    static from(error: any) {
      return new MockAppError(error.message || 'Unknown error')
    }
  },
  SolanaError: class MockSolanaError extends Error {
    constructor(message: string, public code?: string) {
      super(message)
    }
  }
}))
```

## Component Testing Helpers

```typescript
// Mock Next.js router
vi.mock('next/router', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    pathname: '/mock-path',
    query: {},
    asPath: '/mock-path'
  }))
}))

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />
}))
```

## Test Utilities

### Custom Render with Providers
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
})

export const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient()

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}
```
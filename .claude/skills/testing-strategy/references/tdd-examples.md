# TDD Examples for CloakForge

## Schema-First TDD

### Red: Write failing schema test
```typescript
// __tests__/tokenSchema.test.ts
describe('TokenSchema', () => {
  it('should validate mint address format', () => {
    expect(() => TokenSchema.parse({
      mintAddress: 'invalid'
    })).toThrow('Invalid Solana address')
  })
})
```

### Green: Implement schema validation
```typescript
// src/lib/schemas/tokenSchema.ts
export const TokenSchema = z.object({
  mintAddress: z.string().refine(isValidSolanaAddress, 'Invalid Solana address')
})
```

### Refactor: Extract validation logic
```typescript
const solanaAddressSchema = z.string().refine(isValidSolanaAddress, 'Invalid Solana address')
```

## API Route TDD

### Red: Test error handling
```typescript
it('should return 400 for invalid input', async () => {
  const request = new NextRequest('http://localhost/api/solana/burn', {
    method: 'POST',
    body: JSON.stringify({ invalidField: 'test' })
  })

  const response = await POST(request)
  expect(response.status).toBe(400)
})
```

### Green: Add validation
```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = BurnTokenSchema.parse(body)
    // ... rest of implementation
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    throw error
  }
}
```

## Hook TDD

### Red: Test loading state
```typescript
it('should start in loading state when executed', () => {
  const { result } = renderHook(() => useBurnToken())

  act(() => {
    result.current.burnToken({ mintAddress: 'test', amount: 100 })
  })

  expect(result.current.isLoading).toBe(true)
})
```

### Green: Implement loading state
```typescript
export function useBurnToken() {
  const [isLoading, setIsLoading] = useState(false)

  const burnToken = useCallback(async (params) => {
    setIsLoading(true)
    // ... implementation
    setIsLoading(false)
  }, [])

  return { burnToken, isLoading }
}
```

## Component TDD

### Red: Test user interaction
```typescript
it('should show error when form submitted with invalid amount', async () => {
  render(<BurnTokenForm />)

  const amountInput = screen.getByLabelText('Amount')
  const submitButton = screen.getByRole('button', { name: 'Burn Tokens' })

  fireEvent.change(amountInput, { target: { value: '-1' } })
  fireEvent.click(submitButton)

  await waitFor(() => {
    expect(screen.getByText('Amount must be positive')).toBeInTheDocument()
  })
})
```

### Green: Add validation
```typescript
const BurnTokenForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(burnTokenSchema)
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('amount')} />
      {errors.amount && <span>{errors.amount.message}</span>}
    </form>
  )
}
```

## Server Utility TDD

### Red: Test transaction building
```typescript
it('should create burn transaction with correct instruction', async () => {
  const mockConnection = mockSolanaConnection()
  const result = await createBurnTransaction({
    mintAddress: 'mockMint',
    amount: 100,
    walletPublicKey: 'mockWallet'
  })

  expect(result).toMatch(/^[A-Za-z0-9+/]+=*$/) // base64 format
  expect(mockConnection.getLatestBlockhash).toHaveBeenCalled()
})
```

### Green: Implement transaction building
```typescript
export async function createBurnTransaction(params: BurnTokenParams) {
  const { rpcPrivateEndpoint } = getServerConfig()
  const connection = new Connection(rpcPrivateEndpoint)

  const { blockhash } = await connection.getLatestBlockhash()
  const transaction = new Transaction()

  const burnInstruction = createBurnInstruction(
    params.tokenAccount,
    params.mintAddress,
    params.walletPublicKey,
    params.amount
  )

  transaction.add(burnInstruction)
  transaction.recentBlockhash = blockhash
  transaction.feePayer = params.walletPublicKey

  return transaction.serialize({ requireAllSignatures: false }).toString('base64')
}
```
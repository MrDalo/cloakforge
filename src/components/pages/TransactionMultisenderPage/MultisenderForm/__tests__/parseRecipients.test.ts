import { describe, it, expect } from 'vitest'
import { Keypair } from '@solana/web3.js'
import { parseRecipients, formatRecipients, toPlainDecimalString } from '../parseRecipients'

const [ADDR_1, ADDR_2, ADDR_3] = Array.from({ length: 3 }, () => Keypair.generate().publicKey.toBase58())

describe('parseRecipients', () => {
  it('should return nothing for empty input', () => {
    expect(parseRecipients('')).toEqual({ recipients: [], invalidLines: [], totalAmount: 0 })
    expect(parseRecipients('\n  \n')).toEqual({ recipients: [], invalidLines: [], totalAmount: 0 })
  })

  it.each([
    ['space', `${ADDR_1} 1.5`],
    ['multiple spaces', `${ADDR_1}    1.5`],
    ['tab', `${ADDR_1}\t1.5`],
    ['comma', `${ADDR_1},1.5`],
    ['comma and space', `${ADDR_1}, 1.5`],
    ['space and comma', `${ADDR_1} ,1.5`],
    ['surrounding whitespace', `   ${ADDR_1} 1.5   `],
  ])('should parse an address and amount separated by %s', (_label, line) => {
    expect(parseRecipients(line)).toEqual({ recipients: [{ address: ADDR_1, amount: 1.5 }], invalidLines: [], totalAmount: 1.5 })
  })

  it('should parse several lines in order and sum the amounts', () => {
    const { recipients, totalAmount, invalidLines } = parseRecipients(`${ADDR_1} 1\n${ADDR_2},2\n\n${ADDR_3}\t0.5`)

    expect(recipients).toEqual([
      { address: ADDR_1, amount: 1 },
      { address: ADDR_2, amount: 2 },
      { address: ADDR_3, amount: 0.5 },
    ])
    expect(totalAmount).toBe(3.5)
    expect(invalidLines).toEqual([])
  })

  it('should accept integers, decimals and leading-dot amounts', () => {
    const { recipients } = parseRecipients(`${ADDR_1} 10\n${ADDR_2} 0.000000001\n${ADDR_3} .5`)
    expect(recipients.map((r) => r.amount)).toEqual([10, 0.000000001, 0.5])
  })

  it('should ignore extra columns after the amount', () => {
    const { recipients, invalidLines } = parseRecipients(`${ADDR_1} 2 airdrop-batch-7 extra`)
    expect(recipients).toEqual([{ address: ADDR_1, amount: 2 }])
    expect(invalidLines).toEqual([])
  })

  it('should keep duplicate recipients as separate entries', () => {
    expect(parseRecipients(`${ADDR_1} 1\n${ADDR_1} 1`).recipients).toHaveLength(2)
  })

  it('should report a line without an amount', () => {
    expect(parseRecipients(ADDR_1).invalidLines).toEqual([{ line: 1, text: ADDR_1, reason: 'Missing amount' }])
  })

  it('should report an invalid address', () => {
    expect(parseRecipients('not-a-wallet 1').invalidLines).toEqual([{ line: 1, text: 'not-a-wallet 1', reason: 'Invalid address' }])
  })

  it.each([
    ['a decimal comma', '1,5'],
    ['a thousands separator', '1,000'],
    ['text', 'abc'],
    ['a number followed by text', '1.5abc'],
    ['scientific notation', '1e3'],
    ['a negative number', '-2'],
    ['a plus sign', '+2'],
    ['a currency suffix', '2SOL'],
  ])('should reject %s as amount instead of guessing', (_label, amount) => {
    const { recipients, invalidLines } = parseRecipients(`${ADDR_1} ${amount}`)
    expect(recipients).toEqual([])
    expect(invalidLines).toEqual([{ line: 1, text: `${ADDR_1} ${amount}`, reason: `Invalid amount "${amount}"` }])
  })

  it('should reject a zero amount', () => {
    expect(parseRecipients(`${ADDR_1} 0`).invalidLines).toEqual([{ line: 1, text: `${ADDR_1} 0`, reason: 'Amount must be greater than 0' }])
    expect(parseRecipients(`${ADDR_1} 0.0`).invalidLines[0].reason).toBe('Amount must be greater than 0')
  })

  it('should report the 1-based line number of each invalid line and keep valid lines', () => {
    const { recipients, invalidLines } = parseRecipients(['', `${ADDR_1} 1`, 'garbage 5', '', `${ADDR_2} x`, `${ADDR_3} 2`].join('\n'))

    expect(recipients.map((r) => r.address)).toEqual([ADDR_1, ADDR_3])
    expect(invalidLines.map((l) => l.line)).toEqual([3, 5])
  })
})

describe('toPlainDecimalString', () => {
  it.each([
    [1, '1'],
    [1.5, '1.5'],
    [0.1, '0.1'],
    [0.000000001, '0.000000001'],
    [0.00000015, '0.00000015'],
    [123456789.123, '123456789.123'],
    [1.5e21, '1500000000000000000000'],
  ])('should render %s as %s', (amount, expected) => {
    expect(toPlainDecimalString(amount)).toBe(expected)
  })
})

describe('formatRecipients', () => {
  it('should format recipients as "address amount" lines', () => {
    expect(
      formatRecipients([
        { address: ADDR_1, amount: 1.5 },
        { address: ADDR_2, amount: 2 },
      ])
    ).toBe(`${ADDR_1} 1.5\n${ADDR_2} 2`)
  })

  it('should round-trip through parseRecipients, including amounts that JavaScript prints in scientific notation', () => {
    const recipients = [
      { address: ADDR_1, amount: 1.5 },
      { address: ADDR_2, amount: 0.000000001 },
      { address: ADDR_3, amount: 1000000 },
    ]

    const parsed = parseRecipients(formatRecipients(recipients))
    expect(parsed.invalidLines).toEqual([])
    expect(parsed.recipients).toEqual(recipients)
  })

  it('should return an empty string for no recipients', () => {
    expect(formatRecipients([])).toBe('')
  })
})

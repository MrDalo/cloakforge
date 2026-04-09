import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { validateRequestBody } from '../validateRequestBody'

const testSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().min(0),
  email: z.string().email().optional(),
})

describe('validateRequestBody', () => {
  // ---------------------------------------------------------------------------
  // Success cases
  // ---------------------------------------------------------------------------

  it('returns success with parsed data for valid input', () => {
    const result = validateRequestBody({ name: 'Alice', age: 30 }, testSchema)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Alice')
      expect(result.data.age).toBe(30)
    }
  })

  it('includes optional fields when present', () => {
    const result = validateRequestBody({ name: 'Bob', age: 25, email: 'bob@example.com' }, testSchema)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe('bob@example.com')
    }
  })

  it('omits optional fields when absent', () => {
    const result = validateRequestBody({ name: 'Charlie', age: 40 }, testSchema)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBeUndefined()
    }
  })

  it('coerces schema defaults correctly', () => {
    const schemaWithDefault = z.object({ value: z.number().default(42) })
    const result = validateRequestBody({}, schemaWithDefault)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.value).toBe(42)
    }
  })

  // ---------------------------------------------------------------------------
  // Failure cases — ZodError
  // ---------------------------------------------------------------------------

  it('returns failure with error message for missing required fields', () => {
    const result = validateRequestBody({ age: 30 }, testSchema)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors).toContain('name')
    }
  })

  it('returns failure for wrong type', () => {
    const result = validateRequestBody({ name: 'Alice', age: 'not-a-number' }, testSchema)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors).toContain('age')
    }
  })

  it('returns failure for invalid email format', () => {
    const result = validateRequestBody({ name: 'Alice', age: 30, email: 'not-an-email' }, testSchema)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors).toContain('email')
    }
  })

  it('returns failure for empty string in min(1) field', () => {
    const result = validateRequestBody({ name: '', age: 30 }, testSchema)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(typeof result.errors).toBe('string')
    }
  })

  it('includes path in error message', () => {
    const result = validateRequestBody({ name: 123, age: 30 }, testSchema)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors).toContain('name')
    }
  })

  it('accumulates multiple field errors in the error string', () => {
    const result = validateRequestBody({}, testSchema)
    expect(result.success).toBe(false)
    if (!result.success) {
      // Both name and age should be mentioned
      expect(result.errors).toContain('name')
      expect(result.errors).toContain('age')
    }
  })

  // ---------------------------------------------------------------------------
  // Non-ZodError propagation
  // ---------------------------------------------------------------------------

  it('re-throws non-Zod errors from the schema', () => {
    const throwingSchema = z.string().transform(() => {
      throw new TypeError('unexpected internal error')
    })
    expect(() => validateRequestBody('anything', throwingSchema)).toThrow(TypeError)
  })

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------

  it('handles null input, returning validation failure', () => {
    const result = validateRequestBody(null, testSchema)
    expect(result.success).toBe(false)
  })

  it('handles undefined input, returning validation failure', () => {
    const result = validateRequestBody(undefined, testSchema)
    expect(result.success).toBe(false)
  })
})

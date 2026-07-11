import { describe, it, expect } from 'vitest'
import { cn } from '../utils'

// ---------------------------------------------------------------------------
// cn — basic string concatenation
// ---------------------------------------------------------------------------

describe('cn', () => {
  it('should return an empty string when called with no arguments', () => {
    expect(cn()).toBe('')
  })

  it('should return a single class unchanged', () => {
    expect(cn('foo')).toBe('foo')
  })

  it('should concatenate two classes with a space', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('should concatenate multiple classes with spaces', () => {
    expect(cn('a', 'b', 'c', 'd')).toBe('a b c d')
  })

  it('should concatenate three distinct classes', () => {
    expect(cn('px-4', 'py-2', 'rounded')).toBe('px-4 py-2 rounded')
  })

  // ---------------------------------------------------------------------------
  // Falsy inputs — clsx behavior
  // ---------------------------------------------------------------------------

  it('should ignore undefined values', () => {
    expect(cn('foo', undefined)).toBe('foo')
  })

  it('should ignore null values', () => {
    expect(cn('foo', null)).toBe('foo')
  })

  it('should ignore false values', () => {
    expect(cn('foo', false)).toBe('foo')
  })

  it('should ignore 0 values', () => {
    expect(cn('foo', 0)).toBe('foo')
  })

  it('should return empty string for only falsy inputs', () => {
    expect(cn(undefined, null, false)).toBe('')
  })

  it('should return empty string for empty string input', () => {
    expect(cn('')).toBe('')
  })

  // ---------------------------------------------------------------------------
  // Conditional class objects
  // ---------------------------------------------------------------------------

  it('should include a class when its condition is true', () => {
    expect(cn({ 'text-red-500': true })).toBe('text-red-500')
  })

  it('should exclude a class when its condition is false', () => {
    expect(cn({ 'text-red-500': false })).toBe('')
  })

  it('should include only classes with true conditions from an object', () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz')
  })

  it('should combine string classes with conditional objects', () => {
    expect(cn('base', { active: true, disabled: false })).toBe('base active')
  })

  it('should handle multiple conditional objects', () => {
    expect(cn({ a: true }, { b: false }, { c: true })).toBe('a c')
  })

  // ---------------------------------------------------------------------------
  // Array inputs
  // ---------------------------------------------------------------------------

  it('should handle a single flat array of strings', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar')
  })

  it('should handle nested arrays', () => {
    expect(cn(['foo', ['bar', 'baz']])).toBe('foo bar baz')
  })

  it('should handle arrays mixed with direct string arguments', () => {
    expect(cn('head', ['arr-a', 'arr-b'], 'tail')).toBe('head arr-a arr-b tail')
  })

  it('should handle arrays containing conditional objects', () => {
    expect(cn(['base', { active: true, hidden: false }])).toBe('base active')
  })

  it('should handle deeply nested arrays', () => {
    expect(cn([['deep', ['deeper']]])).toBe('deep deeper')
  })

  // ---------------------------------------------------------------------------
  // Tailwind conflict resolution — tailwind-merge behavior
  // ---------------------------------------------------------------------------

  it('should resolve conflicting text color classes — last wins', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('should resolve conflicting background color classes — last wins', () => {
    expect(cn('bg-red-500', 'bg-green-200')).toBe('bg-green-200')
  })

  it('should resolve conflicting padding classes — last wins', () => {
    expect(cn('p-4', 'p-8')).toBe('p-8')
  })

  it('should resolve conflicting horizontal padding — last wins', () => {
    expect(cn('px-2', 'px-6')).toBe('px-6')
  })

  it('should not merge non-conflicting Tailwind classes', () => {
    const result = cn('px-4', 'py-2')
    expect(result).toContain('px-4')
    expect(result).toContain('py-2')
  })

  it('should resolve conflicting font-size classes — last wins', () => {
    expect(cn('text-sm', 'text-lg')).toBe('text-lg')
  })

  it('should resolve conflicting font-weight classes — last wins', () => {
    expect(cn('font-bold', 'font-light')).toBe('font-light')
  })

  it('should resolve conflicting border-radius classes — last wins', () => {
    expect(cn('rounded', 'rounded-lg')).toBe('rounded-lg')
  })

  it('should resolve conflicting width classes — last wins', () => {
    expect(cn('w-4', 'w-full')).toBe('w-full')
  })

  it('should resolve conflicting display classes — last wins', () => {
    expect(cn('flex', 'block')).toBe('block')
  })

  it('should not strip non-conflicting Tailwind utilities', () => {
    const result = cn('flex', 'items-center', 'justify-between')
    expect(result).toContain('flex')
    expect(result).toContain('items-center')
    expect(result).toContain('justify-between')
  })

  it('should handle conditional Tailwind conflict resolution', () => {
    const isError = true
    expect(cn('text-gray-900', { 'text-red-500': isError })).toBe('text-red-500')
  })

  it('should handle conditional Tailwind — base wins when condition is false', () => {
    const isError = false
    expect(cn('text-gray-900', { 'text-red-500': isError })).toBe('text-gray-900')
  })

  // ---------------------------------------------------------------------------
  // Real-world component class scenarios
  // ---------------------------------------------------------------------------

  it('should merge button variant classes correctly', () => {
    const base = 'inline-flex items-center rounded-md px-4 py-2 text-sm font-medium'
    const variant = 'bg-primary text-primary-foreground hover:bg-primary/90'
    const result = cn(base, variant)
    expect(result).toContain('bg-primary')
    expect(result).toContain('text-sm')
    expect(result).toContain('rounded-md')
  })

  it('should override base button size when size class is passed last', () => {
    expect(cn('px-4 py-2', 'px-8 py-4')).toBe('px-8 py-4')
  })

  it('should handle disabled state pattern', () => {
    const isDisabled = true
    const result = cn('opacity-100 cursor-pointer', {
      'opacity-50 cursor-not-allowed': isDisabled,
    })
    expect(result).toContain('opacity-50')
    expect(result).toContain('cursor-not-allowed')
    expect(result).not.toContain('opacity-100')
  })

  it('should handle className prop merging pattern', () => {
    const defaultClass = 'text-sm text-gray-600'
    const userClass = 'text-base text-black'
    expect(cn(defaultClass, userClass)).toBe('text-base text-black')
  })

  it('should handle variant + size + className pattern', () => {
    const variant = 'bg-blue-500 text-white'
    const size = 'px-4 py-2 text-sm'
    const custom = 'w-full'
    const result = cn(variant, size, custom)
    expect(result).toContain('bg-blue-500')
    expect(result).toContain('text-sm')
    expect(result).toContain('w-full')
  })

  // ---------------------------------------------------------------------------
  // Performance / large class lists
  // ---------------------------------------------------------------------------

  it('should handle a large number of class strings without error', () => {
    const classes = Array.from({ length: 100 }, (_, i) => `class-${i}`)
    const result = cn(...classes)
    expect(result).toContain('class-0')
    expect(result).toContain('class-99')
  })

  it('should handle a large number of conflicting Tailwind classes — last wins', () => {
    const sizes = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl']
    expect(cn(...sizes)).toBe('text-2xl')
  })

  // ---------------------------------------------------------------------------
  // Integration — clsx + tailwind-merge working together
  // ---------------------------------------------------------------------------

  it('should apply clsx conditional logic before tailwind-merge conflict resolution', () => {
    const isLarge = true
    // clsx resolves conditionals first, then twMerge resolves conflicts
    expect(cn('text-sm', { 'text-lg': isLarge })).toBe('text-lg')
  })

  it('should keep non-conflicting classes from conditional objects', () => {
    const isActive = true
    const result = cn('rounded px-4', { 'bg-blue-500 text-white': isActive })
    expect(result).toContain('rounded')
    expect(result).toContain('px-4')
    expect(result).toContain('bg-blue-500')
    expect(result).toContain('text-white')
  })

  it('should handle mixed falsy and truthy conditional object values', () => {
    const result = cn({
      flex: true,
      hidden: false,
      'items-center': true,
      'justify-end': false,
    })
    expect(result).toBe('flex items-center')
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AppError } from '@/lib/errors'
import { reserveDiscountCouponUsage } from '../managementClient'

const mockEntryApi = {
  get: vi.fn(),
  update: vi.fn(),
  publish: vi.fn(),
}

vi.mock('contentful-management', () => ({
  createClient: () => ({ entry: mockEntryApi }),
}))

const mockServerConfig = {
  contentfulSpaceId: 'space',
  contentfulEnvironment: 'master',
  contentfulManagementToken: 'cma-token',
}
vi.mock('../../config/getServerConfig', () => ({
  default: () => mockServerConfig,
}))

interface CouponEntryOptions {
  version?: number
  remainingUsage?: number
  alreadyUsed?: number
  noUsageLimit?: boolean
  discountPercentage?: number
  name?: string
  published?: boolean
  archived?: boolean
  contentType?: string
}

const makeEntry = (options: CouponEntryOptions = {}) => ({
  sys: {
    id: 'entry-1',
    version: options.version ?? 5,
    publishedVersion: options.published === false ? undefined : (options.version ?? 5) - 1,
    archivedVersion: options.archived ? 3 : undefined,
    contentType: { sys: { id: options.contentType ?? 'discountCouponType' } },
  },
  fields: {
    name: { 'en-US': options.name ?? 'SAVE10' },
    discountPercentage: { 'en-US': options.discountPercentage ?? 10 },
    remainingUsage: { 'en-US': options.remainingUsage ?? 3 },
    alreadyUsed: { 'en-US': options.alreadyUsed ?? 7 },
    noUsageLimit: { 'en-US': options.noUsageLimit ?? false },
  },
})

const versionMismatch = (): Error => {
  const error = new Error('{"status":409}')
  error.name = 'VersionMismatch'
  return error
}

const expectAppError = async (promise: Promise<unknown>, status: number): Promise<void> => {
  const error = await promise.then(
    () => null,
    (caught: unknown) => caught
  )
  expect(error).toBeInstanceOf(AppError)
  expect((error as AppError).status).toBe(status)
}

describe('reserveDiscountCouponUsage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockServerConfig.contentfulManagementToken = 'cma-token'
    mockEntryApi.update.mockImplementation(async (_params: unknown, entry: { sys: { version: number } }) => ({
      ...entry,
      sys: { ...entry.sys, version: entry.sys.version + 1 },
    }))
    mockEntryApi.publish.mockResolvedValue({})
  })

  it('should decrement remainingUsage and increment alreadyUsed on the read version', async () => {
    mockEntryApi.get.mockResolvedValue(makeEntry({ version: 5, remainingUsage: 3, alreadyUsed: 7 }))

    const result = await reserveDiscountCouponUsage('entry-1', 'SAVE10')

    expect(result).toEqual({ code: 'SAVE10', discountPercentage: 10, remainingUsage: 2, noUsageLimit: false })
    const [params, written] = mockEntryApi.update.mock.calls[0]
    expect(params).toEqual({ spaceId: 'space', environmentId: 'master', entryId: 'entry-1' })
    // The version that was read is sent back (X-Contentful-Version) → optimistic concurrency
    expect(written.sys.version).toBe(5)
    expect(written.fields.remainingUsage).toEqual({ 'en-US': 2 })
    expect(written.fields.alreadyUsed).toEqual({ 'en-US': 8 })
    expect(mockEntryApi.publish).toHaveBeenCalledTimes(1)
  })

  it('should only count usage for noUsageLimit coupons', async () => {
    mockEntryApi.get.mockResolvedValue(makeEntry({ remainingUsage: 0, alreadyUsed: 41, noUsageLimit: true }))

    const result = await reserveDiscountCouponUsage('entry-1', 'SAVE10')

    expect(result.remainingUsage).toBe(0)
    const [, written] = mockEntryApi.update.mock.calls[0]
    expect(written.fields.remainingUsage).toEqual({ 'en-US': 0 })
    expect(written.fields.alreadyUsed).toEqual({ 'en-US': 42 })
  })

  it('should reject an exhausted coupon without writing', async () => {
    mockEntryApi.get.mockResolvedValue(makeEntry({ remainingUsage: 0 }))

    await expectAppError(reserveDiscountCouponUsage('entry-1', 'SAVE10'), 400)
    expect(mockEntryApi.update).not.toHaveBeenCalled()
  })

  it.each([
    ['unpublished', { published: false }],
    ['archived', { archived: true }],
    ['other content type', { contentType: 'blogPost' }],
    ['code mismatch', { name: 'OTHER1' }],
  ])('should reject a %s entry without writing', async (_label, options) => {
    mockEntryApi.get.mockResolvedValue(makeEntry(options))

    await expectAppError(reserveDiscountCouponUsage('entry-1', 'SAVE10'), 400)
    expect(mockEntryApi.update).not.toHaveBeenCalled()
  })

  it('should re-read and retry after a version conflict (concurrent reservation)', async () => {
    mockEntryApi.get
      .mockResolvedValueOnce(makeEntry({ version: 5, remainingUsage: 2 }))
      .mockResolvedValueOnce(makeEntry({ version: 7, remainingUsage: 1 }))
    mockEntryApi.update.mockRejectedValueOnce(versionMismatch())

    const result = await reserveDiscountCouponUsage('entry-1', 'SAVE10')

    expect(result.remainingUsage).toBe(0)
    expect(mockEntryApi.update).toHaveBeenCalledTimes(2)
    expect(mockEntryApi.update.mock.calls[1][1].sys.version).toBe(7)
  })

  it('should not hand out the last use twice when a concurrent request took it', async () => {
    mockEntryApi.get
      .mockResolvedValueOnce(makeEntry({ version: 5, remainingUsage: 1 }))
      .mockResolvedValueOnce(makeEntry({ version: 7, remainingUsage: 0 }))
    mockEntryApi.update.mockRejectedValueOnce(versionMismatch())

    await expectAppError(reserveDiscountCouponUsage('entry-1', 'SAVE10'), 400)
    expect(mockEntryApi.update).toHaveBeenCalledTimes(1)
  })

  it('should fail closed after repeated version conflicts', async () => {
    mockEntryApi.get.mockResolvedValue(makeEntry())
    mockEntryApi.update.mockRejectedValue(versionMismatch())

    await expectAppError(reserveDiscountCouponUsage('entry-1', 'SAVE10'), 503)
    expect(mockEntryApi.update).toHaveBeenCalledTimes(3)
  })

  it('should fail closed when the update fails for another reason', async () => {
    mockEntryApi.get.mockResolvedValue(makeEntry())
    mockEntryApi.update.mockRejectedValue(new Error('network down'))

    await expectAppError(reserveDiscountCouponUsage('entry-1', 'SAVE10'), 503)
    expect(mockEntryApi.update).toHaveBeenCalledTimes(1)
  })

  it('should keep the reservation when only publishing fails', async () => {
    mockEntryApi.get.mockResolvedValue(makeEntry({ remainingUsage: 3 }))
    mockEntryApi.publish.mockRejectedValue(new Error('publish failed'))

    const result = await reserveDiscountCouponUsage('entry-1', 'SAVE10')

    expect(result.remainingUsage).toBe(2)
  })

  it('should fail closed when the management token is not configured', async () => {
    mockServerConfig.contentfulManagementToken = ''

    await expectAppError(reserveDiscountCouponUsage('entry-1', 'SAVE10'), 503)
    expect(mockEntryApi.get).not.toHaveBeenCalled()
  })
})

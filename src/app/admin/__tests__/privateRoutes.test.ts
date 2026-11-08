import { describe, it, expect } from 'vitest'
import { metadata as adminMetadata } from '../layout'
import { metadata as accountMetadata } from '../../account/layout'
import robots from '../../robots'

describe('private route indexing', () => {
  it('should mark /admin and /account as noindex, nofollow', () => {
    expect(adminMetadata.robots).toEqual({ index: false, follow: false })
    expect(accountMetadata.robots).toEqual({ index: false, follow: false })
  })

  it('should not advertise private or debug paths in robots.txt', () => {
    const { rules } = robots()
    const disallow = (Array.isArray(rules) ? rules.flatMap((rule) => rule.disallow ?? []) : [rules.disallow ?? []]).flat()

    expect(disallow).toEqual(['/api/'])
  })
})

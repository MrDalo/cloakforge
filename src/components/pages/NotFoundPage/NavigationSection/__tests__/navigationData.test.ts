import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { navigationToolsData } from '../navigationData'

describe('navigationToolsData', () => {
  it.each(navigationToolsData.map((tool) => [tool.title, tool.href]))('should link %s to an existing tool route (%s)', (_title, href) => {
    expect(href).toMatch(/^\/tools\/[a-z-]+$/)
    expect(existsSync(join(process.cwd(), 'src/app', href, 'page.tsx'))).toBe(true)
  })
})

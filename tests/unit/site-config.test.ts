import { describe, expect, it } from 'vitest'
import { site } from '../../src/config/site'

describe('site config', () => {
  it('every address is https', () => {
    const addresses = [
      site.url,
      site.api,
      site.statusFile,
      site.repos.org,
      site.repos.server,
      site.repos.website,
      ...site.frameworks.flatMap((f) => (f.plugin ? [f.plugin.repo] : [])),
    ]
    for (const address of addresses) {
      expect(address.startsWith('https://'), address).toBe(true)
    }
  })

  it('framework ids are unique', () => {
    const ids = site.frameworks.map((f) => f.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("the status timeout is the design's 5 seconds", () => {
    expect(site.statusTimeoutMs).toBe(5000)
  })
})

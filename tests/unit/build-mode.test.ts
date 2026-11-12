import { describe, expect, it } from 'vitest'
import { isRelease, robotsTxt } from '../../src/lib/build-mode'

const url = 'https://www.schoolforbots.org'

describe('build mode', () => {
  it('only the release mode is a release', () => {
    expect(isRelease('release')).toBe(true)
    expect(isRelease('production')).toBe(false)
    expect(isRelease('development')).toBe(false)
    expect(isRelease('')).toBe(false)
  })

  it('robots.txt blocks everything outside release', () => {
    expect(robotsTxt('production', url)).toBe('User-agent: *\nDisallow: /\n')
  })

  it('robots.txt allows everything and points at the sitemap on release', () => {
    expect(robotsTxt('release', url)).toBe(
      'User-agent: *\nAllow: /\nSitemap: https://www.schoolforbots.org/sitemap-index.xml\n',
    )
  })
})

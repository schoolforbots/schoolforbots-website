import { describe, expect, it } from 'vitest'
import { distExists, readDist, readPage } from '../helpers'

const routes = ['/', '/docs/enroll/', '/404.html']

describe('preview build', () => {
  it('preview pages are noindex', () => {
    for (const route of routes) {
      const robots = readPage(route).querySelector('meta[name=robots]')
      expect(robots?.getAttribute('content'), route).toContain('noindex')
    }
  })

  it('preview robots.txt blocks everything', () => {
    expect(readDist('robots.txt')).toBe('User-agent: *\nDisallow: /\n')
  })

  it('pages are zh-CN', () => {
    for (const route of routes) {
      expect(readPage(route).documentElement.getAttribute('lang'), route).toBe('zh-CN')
    }
  })

  it('the coming-soon page is not part of the build', () => {
    expect(distExists('holding')).toBe(false)
  })
})

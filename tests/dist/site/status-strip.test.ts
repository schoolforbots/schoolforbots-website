import { describe, expect, it } from 'vitest'
import { site } from '../../../src/config/site'
import { readPage } from '../helpers'

describe('status strip', () => {
  it.each(['/', '/docs/help/cannot-connect/'])('the page %s carries the strip', (route) => {
    const page = readPage(route)
    const strips = page.querySelectorAll('[data-status-strip]')
    expect(strips).toHaveLength(1)
    const strip = strips[0]
    expect(strip.textContent).toContain('正在查学校状态…')
    expect(strip.querySelector('noscript')?.textContent).toContain('状态文件')
    expect(strip.querySelectorAll('svg[aria-hidden="true"]')).toHaveLength(4)
  })

  it('the noscript fallback links to the status file', () => {
    for (const route of ['/', '/docs/help/cannot-connect/']) {
      const html = readPage(route).querySelector('[data-status-strip] noscript')?.innerHTML ?? ''
      expect(html).toContain(site.statusFile)
    }
  })
})

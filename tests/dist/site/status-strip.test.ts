import { describe, expect, it } from 'vitest'
import { site } from '../../../src/config/site'
import { readDist, readPage } from '../helpers'

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

  it('without scripts the loading line is hidden, leaving the link to the status file', () => {
    for (const file of ['index.html', 'docs/help/cannot-connect/index.html']) {
      const html = readDist(file)
      const head = html.slice(0, html.indexOf('</head>'))
      const css = head.match(/<noscript><style>([^<]*)<\/style><\/noscript>/)?.[1] ?? ''
      const hidden = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
        .filter(([, , body]) => /display:\s*none/.test(body))
        .flatMap(([, list]) => list.split(',').map((s) => s.trim()))
      expect(hidden, file).toContain('html [data-status-text]')
    }
  })
})

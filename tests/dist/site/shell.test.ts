import { readFileSync, statSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { site } from '../../../src/config/site'
import { distPath, listDist, readDist, readPage } from '../helpers'

const pages = ['/', '/docs/enroll/']

const navLabels = ['入学指南', '教程', '常见问题', '校规', '公告', 'GitHub']
const footerLabels = ['入学指南', '教程', '常见问题', '校规', '学校状态', 'GitHub']

const text = (el: { textContent: string | null }) => el.textContent?.replace(/\s+/g, ' ').trim() ?? ''

function header(route: string) {
  const el = readPage(route).querySelector('header')
  if (!el) throw new Error(`${route} has no header`)
  return el
}

function footer(route: string) {
  const el = readPage(route).querySelector('[data-site-footer]')
  if (!el) throw new Error(`${route} has no site footer`)
  return el
}

// A URL the browser resolves against this site: relative, root-relative or data:.
function isLocal(url: string): boolean {
  if (url.startsWith('data:')) return true
  return !url.startsWith('//') && !/^[a-z][a-z0-9+.-]*:/i.test(url)
}

function distFiles(): string[] {
  return listDist('').filter((f) => statSync(distPath(f)).isFile())
}

describe('site shell', () => {
  it('both pages share the same top nav', () => {
    for (const route of pages) {
      const navs = [...header(route).querySelectorAll('nav')]
      expect(navs.length, route).toBeGreaterThan(0)
      for (const nav of navs) {
        expect([...nav.querySelectorAll('a')].map(text), route).toEqual(navLabels)
        expect(nav.querySelector('a[href^="https://github.com"]')?.getAttribute('href')).toBe(site.repos.org)
      }
      const cta = [...header(route).querySelectorAll('a')].filter((a) => text(a) === '让机器人去上学')
      expect(cta.length, route).toBeGreaterThan(0)
      for (const a of cta) expect(a.getAttribute('href'), route).toBe('/docs/enroll/')
    }
  })

  it('the theme toggle is a labelled button', () => {
    for (const route of pages) {
      const buttons = [...header(route).querySelectorAll('sfb-theme-toggle button[aria-label]')]
      expect(buttons.length, route).toBeGreaterThan(0)
      for (const button of buttons) {
        expect(button.getAttribute('type')).toBe('button')
        expect(button.getAttribute('aria-label')).toBe('晚自习（深色模式）')
        expect(button.hasAttribute('aria-pressed')).toBe(true)
        expect(text(button)).toBe('晚自习')
      }
    }
  })

  it('the footer has every link and the help address', () => {
    for (const route of pages) {
      const el = footer(route)
      const links = [...el.querySelectorAll('nav a')]
      expect(links.map(text), route).toEqual(footerLabels)
      const href = (label: string) => links.find((a) => text(a) === label)?.getAttribute('href')
      expect(href('学校状态'), route).toBe(site.statusFile)
      expect(href('GitHub'), route).toBe(site.repos.org)
      expect(el.querySelector('a[href="mailto:help@schoolforbots.org"]'), route).not.toBeNull()
    }
  })

  it('the brick dado closes the footer and is hidden from screen readers', () => {
    for (const route of pages) {
      const dado = footer(route).querySelector('[data-dado]')
      expect(dado, route).not.toBeNull()
      expect(dado?.getAttribute('aria-hidden'), route).toBe('true')
      expect(dado?.nextElementSibling, route).toBeNull()
    }
  })

  it('nothing loads from another host', () => {
    const assets = [
      ['link[rel~="stylesheet"]', 'href'],
      ['link[rel~="preload"]', 'href'],
      ['link[rel~="modulepreload"]', 'href'],
      ['link[rel~="icon"]', 'href'],
      ['script[src]', 'src'],
      ['img[src]', 'src'],
    ] as const
    const html = listDist('.html')
    expect(html.length).toBeGreaterThan(0)
    for (const file of html) {
      const doc = readPage(`/${file}`)
      for (const [selector, attr] of assets) {
        for (const el of doc.querySelectorAll(selector)) {
          const url = el.getAttribute(attr) ?? ''
          expect(isLocal(url), `${file}: ${selector} ${url}`).toBe(true)
        }
      }
      for (const el of doc.querySelectorAll('source[srcset]')) {
        for (const candidate of (el.getAttribute('srcset') ?? '').split(',')) {
          const url = candidate.trim().split(/\s+/)[0]
          expect(isLocal(url), `${file}: source ${url}`).toBe(true)
        }
      }
    }
    for (const file of listDist('.css')) {
      const css = readDist(file)
      expect(css, file).not.toMatch(/url\(\s*["']?http/i)
      expect(css, file).not.toContain('@import')
    }
    for (const file of distFiles()) {
      const body = readFileSync(distPath(file), 'latin1')
      expect(body, file).not.toContain('fonts.googleapis')
      expect(body, file).not.toContain('fonts.gstatic')
    }
  })

  it('no emoji anywhere', () => {
    for (const file of listDist('.html')) {
      const found = readDist(file).match(/\p{Extended_Pictographic}/gu) ?? []
      expect(found.filter((c) => !['©', '®', '™'].includes(c)), file).toEqual([])
    }
  })

  it('the homepage has a description and a share image', () => {
    const doc = readPage('/')
    expect(doc.querySelector('meta[name="description"]')?.getAttribute('content')).toMatch(/\S/)
    const image = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ?? ''
    expect(new URL(image).href).toBe(image)
    expect(image).toBe(`${site.url}/og.png`)
  })

  it('the share image is a 1200 by 630 PNG', () => {
    const png = readFileSync(distPath('og.png'))
    expect(png.subarray(1, 4).toString('latin1')).toBe('PNG')
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630])
  })

  it('the browser bar takes the colour of the top of the page in both themes', () => {
    for (const route of pages) {
      const doc = readPage(route)
      const light = doc.querySelector('meta[name="theme-color"][media="(prefers-color-scheme: light)"]')
      const dark = doc.querySelector('meta[name="theme-color"][media="(prefers-color-scheme: dark)"]')
      expect(light?.getAttribute('content'), route).toBe('#FDF4E3')
      expect(dark?.getAttribute('content'), route).toBe('#141D19')
    }
  })

  it('the favicon is the logo block', () => {
    for (const route of pages) {
      expect(readPage(route).querySelector('link[rel~="icon"]')?.getAttribute('href'), route).toBe('/favicon.svg')
    }
    expect(readDist('favicon.svg')).toContain('#D45113')
  })
})

import { readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { Window } from 'happy-dom'
import { describe, expect, it } from 'vitest'
import { site } from '../../src/config/site'

const file = fileURLToPath(new URL('../../holding/index.html', import.meta.url))
const html = readFileSync(file, 'utf8')
const doc = new new Window().DOMParser().parseFromString(html, 'text/html')

describe('holding page', () => {
  it('is noindex', () => {
    expect(doc.querySelector('meta[name=robots]')?.getAttribute('content')).toContain('noindex')
  })

  it('is zh-CN', () => {
    expect(doc.documentElement.getAttribute('lang')).toBe('zh-CN')
  })

  it('links to the GitHub organisation and the help address from the site config', () => {
    const hrefs = [...doc.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'))
    expect(hrefs).toContain(site.repos.org)
    expect(hrefs).toContain(`mailto:${site.email}`)
  })

  it('carries no placeholder', () => {
    expect(doc.querySelector('[data-placeholder]')).toBeNull()
    expect(html).not.toContain('@placeholder(')
    expect(html).not.toContain('示意')
    expect(html).not.toContain('待补')
  })

  it('loads nothing from another host', () => {
    expect(doc.querySelectorAll('script[src]')).toHaveLength(0)
    const local = (url: string | null) =>
      url !== null && (url.startsWith('data:') || !/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(url))
    for (const el of doc.querySelectorAll('link[href]')) expect(local(el.getAttribute('href')), el.outerHTML).toBe(true)
    for (const el of doc.querySelectorAll('img[src]')) expect(local(el.getAttribute('src')), el.outerHTML).toBe(true)
  })

  it('is small', () => {
    expect(statSync(file).size).toBeLessThan(30 * 1024)
  })
})

import { describe, expect, it } from 'vitest'
import { site, type FrameworkId } from '../../../src/config/site'
import { glossary, glossaryGroups } from '../../../src/config/glossary.mjs'
import type { Element } from 'happy-dom'
import { distExists, listDist, readDist, readPage } from '../helpers'

const text = (el: { textContent: string | null } | null | undefined) =>
  el?.textContent?.replace(/\s+/g, ' ').trim() ?? ''
// The text as a reader sees it, without the glossary tooltips that only show on hover.
const prose = (el: Element | null | undefined) => {
  const copy = el?.cloneNode(true) as Element | undefined
  for (const tip of copy?.querySelectorAll('.term-tip') ?? []) tip.remove()
  return text(copy)
}

const framework = (id: FrameworkId) => {
  const f = site.frameworks.find((x) => x.id === id)
  if (!f) throw new Error(`no framework ${id} in the site config`)
  return f
}
// "在 AstrBot 里装插件"; no space after a full-width bracket: "在 DSH（DeepSeek harness）里装插件".
const installTitle = (id: FrameworkId) => `在 ${framework(id).name} 里装插件`.replace('） ', '）')

// The docs table of contents: every page, in sidebar order, with its title.
const groups: { label: string | null; pages: [string, string][] }[] = [
  { label: null, pages: [['/docs/tutorials/', '教程']] },
  {
    label: '入学',
    pages: [
      ['/docs/glossary/', '先认识几个词'],
      ['/docs/enroll/', '入学指南'],
      ['/docs/enroll/dsh/', installTitle('dsh')],
      ['/docs/enroll/astrbot/', installTitle('astrbot')],
      ['/docs/enroll/langbot/', installTitle('langbot')],
      ['/docs/enroll/register/', '报名和验证邮箱'],
    ],
  },
  {
    label: '上学以后',
    pages: [
      ['/docs/school-life/sessions/', '学部和上课时段'],
      ['/docs/school-life/summaries/', '课后小结'],
      ['/docs/school-life/clubs/', '社团'],
      ['/docs/school-life/rename/', '改名字'],
      ['/docs/school-life/new-key/', '换钥匙'],
      ['/docs/school-life/withdraw/', '退学和重新入学'],
      ['/docs/school-life/breaks/', '放假'],
    ],
  },
  {
    label: '出问题时',
    pages: [
      ['/docs/help/cannot-connect/', '连不上学校'],
      ['/docs/help/suspended/', '被停课了'],
      ['/docs/help/no-code/', '收不到验证码'],
    ],
  },
  { label: null, pages: [['/docs/faq/', '常见问题']] },
  { label: null, pages: [['/docs/rules/', '校规']] },
  { label: '公告', pages: [['/docs/notices/', '公告']] },
]
const pages = groups.flatMap((g) => g.pages)

// The top level of the docs sidebar: a group as its label and links, a lone page as its link.
function sidebar(route: string) {
  const top = readPage(route).querySelector('#starlight__sidebar ul.top-level')
  if (!top) throw new Error(`${route} has no sidebar`)
  return [...top.children].map((li) => {
    const details = [...li.children].find((el) => el.tagName === 'DETAILS')
    if (!details) {
      const a = li.querySelector('a')
      return { label: null, open: true, pages: [[a?.getAttribute('href'), text(a)]] }
    }
    const list = [...details.children].find((el) => el.tagName === 'UL')
    const links = [...(list?.children ?? [])].map((item) => item.querySelector('a'))
    return {
      label: text(details.querySelector('summary .group-label')),
      open: details.hasAttribute('open'),
      pages: links.map((a) => [a?.getAttribute('href'), text(a)]),
    }
  })
}

describe('docs', () => {
  it('every page in the table is built with a description', () => {
    const descriptions = new Map<string, string>()
    for (const [route, title] of pages) {
      expect(distExists(`${route.slice(1)}index.html`), route).toBe(true)
      const page = readPage(route)
      expect(text(page.querySelector('h1')), route).toBe(title)
      // Emphasis that ends in Chinese punctuation does not close and shows its asterisks.
      expect(text(page.querySelector('.sl-markdown-content')), route).not.toContain('**')
      const description = page.querySelector('meta[name="description"]')?.getAttribute('content') ?? ''
      expect(description, route).toMatch(/\S/)
      descriptions.set(route, description)
    }
    // Each page says what it is about, rather than repeating one default.
    expect(new Set(descriptions.values()).size).toBe(pages.length)
  })

  it('the sidebar follows the table, with the notices collapsed', () => {
    for (const route of ['/docs/enroll/', '/docs/help/no-code/']) {
      const found = sidebar(route)
      // Every group but the notices, link for link.
      expect(found.slice(0, -1).map(({ label, pages }) => ({ label, pages })), route).toEqual(groups.slice(0, -1))
      // The notices: the list page plus one link per notice, closed except on its own pages.
      const notices = found.at(-1)
      expect(notices?.label, route).toBe('公告')
      expect(notices?.pages, route).toContainEqual(['/docs/notices/', '公告'])
      expect(notices?.open, route).toBe(false)
    }
    expect(sidebar('/docs/notices/').at(-1)?.open).toBe(true)
  })

  // The 教程 link in the top nav lands on an overview of every guide, not on one of them.
  it('the 教程 page lists every guide in sidebar order, each with its own description', () => {
    const tutorials = [...readPage('/').querySelectorAll('.site-header a')].filter((a) => text(a) === '教程')
    expect(tutorials.length).toBeGreaterThan(0)
    for (const a of tutorials) expect(a.getAttribute('href')).toBe('/docs/tutorials/')

    const page = readPage('/docs/tutorials/')
    const sections = [...page.querySelectorAll('[data-tutorials] section')]
    // Every group of guides; the notices are news, not guides.
    const wanted = groups.filter((g) => g.label !== null && g.label !== '公告')
    expect(sections.map((s) => text(s.querySelector('h2')))).toEqual(wanted.map((g) => g.label))
    sections.forEach((section, i) => {
      const rows = [...section.querySelectorAll('li')]
      expect(rows.map((li) => [li.querySelector('a')?.getAttribute('href'), text(li.querySelector('.title'))])).toEqual(
        wanted[i].pages,
      )
      rows.forEach((li, j) => {
        const route = wanted[i].pages[j][0]
        const description = readPage(route).querySelector('meta[name="description"]')?.getAttribute('content')
        expect(text(li.querySelector('.desc')), route).toBe(description)
      })
    })
  })

  it('every docs page has exactly one h1, the page title', () => {
    const files = listDist('.html').filter((f) => f.startsWith('docs/'))
    expect(files.length).toBeGreaterThanOrEqual(pages.length)
    for (const file of files) {
      expect(readPage(`/${file}`).querySelectorAll('h1'), file).toHaveLength(1)
    }
  })

  it('every docs page has a previous or next link', () => {
    const files = listDist('.html').filter((f) => f.startsWith('docs/'))
    expect(files.length).toBeGreaterThanOrEqual(pages.length)
    for (const file of files) {
      const links = [...readPage(`/${file}`).querySelectorAll('.pagination-links a[rel="prev"], .pagination-links a[rel="next"]')]
      expect(links.length, file).toBeGreaterThan(0)
      for (const a of links) {
        const href = a.getAttribute('href') ?? ''
        expect(distExists(`${href.slice(1)}index.html`), `${file} -> ${href}`).toBe(true)
      }
    }
  })

  it('links in the docs land on built pages, and mail goes to the help address', () => {
    const files = listDist('.html').filter((f) => f.startsWith('docs/'))
    let local = 0
    for (const file of files) {
      for (const a of readPage(`/${file}`).querySelectorAll('.sl-markdown-content a[href]')) {
        const href = a.getAttribute('href') ?? ''
        if (href.startsWith('mailto:')) expect(href, file).toBe(`mailto:${site.email}`)
        if (!href.startsWith('/')) continue
        const path = href.replace(/[?#].*$/, '').slice(1)
        expect(distExists(path === '' || path.endsWith('/') ? `${path}index.html` : path), `${file} -> ${href}`).toBe(true)
        local++
      }
    }
    expect(local).toBeGreaterThan(0)
  })

  it('install pages show a 待补 tag while their framework has no plugin', () => {
    const built = site.frameworks.filter((f) => distExists(`docs/enroll/${f.id}/index.html`))
    expect(built.length).toBeGreaterThan(0)
    for (const f of built) {
      const page = readPage(`/docs/enroll/${f.id}/`)
      const content = page.querySelector('.sl-markdown-content')
      const tags = [...(content?.querySelectorAll(`[data-placeholder="install-${f.id}"]`) ?? [])]
      if (f.plugin) {
        expect(tags, f.id).toEqual([])
        continue
      }
      expect(tags.map(text), f.id).toEqual(['待补', '待补'])
      expect(prose(content), f.id).toContain('这个框架的插件还没发布。发布以后，这里会写安装步骤。')
      // The download section is there, and marked as missing too.
      const heading = [...(content?.querySelectorAll('h2') ?? [])].find((h) => text(h) === '下载安装包')
      expect(heading, f.id).toBeDefined()
      const section = (heading?.closest('.sl-heading-wrapper') ?? heading)?.nextElementSibling
      expect(section?.querySelector(`[data-placeholder="install-${f.id}"]`), f.id).not.toBeNull()
    }
  })

  it('the sidebar, the docs menu button and the previous and next links draw Lucide icons', () => {
    const page = readPage('/docs/enroll/register/')
    for (const selector of ['#starlight__sidebar summary', '.sl-menu-button', '.pagination-links']) {
      const icons = [...page.querySelectorAll(`${selector} svg`)]
      expect(icons.length, selector).toBeGreaterThan(0)
      for (const svg of icons) expect(svg.getAttribute('class'), selector).toMatch(/(^|\s)lucide(\s|$)/)
    }
    // No link icon beside the headings: the table of contents links every section.
    expect(page.querySelector('.sl-anchor-link')).toBeNull()
  })

  it('the docs contents button does not repeat the menu glyph, and its name is its tooltip', () => {
    const button = readPage('/docs/enroll/register/').querySelector('.sl-menu-button')
    expect(button?.getAttribute('title')).toBe('文档目录')
    expect(text(button?.querySelector('.sr-only'))).toBe('文档目录')
    expect(button?.querySelector('svg.open-menu')?.getAttribute('class')).toMatch(/(^|\s)lucide-list-tree(\s|$)/)
    expect(button?.querySelector('svg.lucide-menu')).toBeNull()
  })

  it('without scripts the rules loading line is hidden', () => {
    const html = readDist('docs/rules/index.html')
    const head = html.slice(0, html.indexOf('</head>'))
    const css = head.match(/<noscript><style>([^<]*)<\/style><\/noscript>/)?.[1] ?? ''
    const hidden = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .filter(([, , body]) => /display:\s*none/.test(body))
      .flatMap(([, list]) => list.split(',').map((s) => s.trim()))
    expect(hidden).toContain('html [data-rules-status]')
  })

  it('pages without sections have no table of contents', () => {
    for (const route of ['/docs/faq/', '/docs/rules/', '/docs/notices/', '/docs/help/no-code/', '/404.html']) {
      const page = readPage(route)
      expect(page.querySelector('starlight-toc'), route).toBeNull()
      expect(page.querySelector('mobile-starlight-toc'), route).toBeNull()
    }
    expect(readPage('/docs/enroll/register/').querySelector('mobile-starlight-toc')).not.toBeNull()
  })

  // At every width the table of contents is the bar above the page title; there is no right-hand column.
  it('pages with sections show the contents bar and no right-hand column', () => {
    for (const route of ['/docs/enroll/', '/docs/enroll/register/', '/docs/help/cannot-connect/']) {
      const page = readPage(route)
      expect(page.querySelectorAll('mobile-starlight-toc'), route).toHaveLength(1)
      expect(page.querySelector('starlight-toc'), route).toBeNull()
      expect(page.querySelector('.right-sidebar-container, .right-sidebar, .right-sidebar-panel'), route).toBeNull()
      // Not wrapped in Starlight's "hide on wide screens" class.
      expect(page.querySelector('mobile-starlight-toc')?.closest('.lg\\:sl-hidden'), route).toBeNull()
    }
  })

  it('the glossary page has an entry for every term, under its id', () => {
    const page = readPage('/docs/glossary/')
    const content = page.querySelector('.sl-markdown-content')
    for (const t of glossary) {
      const heading = content?.querySelector(`h3#${t.id}`)
      expect(text(heading), t.id).toBe(t.term)
      expect(text(heading?.closest('[data-term]')), t.id).toContain(t.body)
    }
    expect(content?.querySelectorAll('[data-term]')).toHaveLength(glossary.length)
    expect([...(content?.querySelectorAll('h2') ?? [])].map(text)).toEqual(glossaryGroups.map((g) => g.label))
    // The glossary page explains the words; it does not mark them.
    expect(content?.querySelector('a.term')).toBeNull()
  })

  it('docs pages mark the first 学号 and 钥匙 with a tooltip and a link to the glossary', () => {
    const content = readPage('/docs/enroll/register/').querySelector('.sl-markdown-content')
    for (const id of ['student-id', 'key']) {
      const term = glossary.find((t) => t.id === id)
      if (!term) throw new Error(`no term ${id} in the glossary`)
      const marked = [...(content?.querySelectorAll(`a.term[href="/docs/glossary/#${id}"]`) ?? [])]
      expect(marked, id).toHaveLength(1)
      const a = marked[0]
      expect(a.firstChild?.textContent, id).toBe(term.term)
      expect(a.getAttribute('aria-describedby'), id).toBe(`term-tip-${id}`)
      const tip = a.querySelector('.term-tip')
      expect(tip?.getAttribute('role'), id).toBe('tooltip')
      expect(tip?.id, id).toBe(`term-tip-${id}`)
      expect(text(tip), id).toBe(term.short)
    }
  })

  it('each term is marked at most once a page, never in a heading or a link, and ids do not repeat', () => {
    const files = listDist('.html').filter((f) => f.startsWith('docs/'))
    let marked = 0
    for (const file of files) {
      const content = readPage(`/${file}`).querySelector('.sl-markdown-content')
      const terms = [...(content?.querySelectorAll('a.term') ?? [])]
      marked += terms.length
      const hrefs = terms.map((a) => a.getAttribute('href'))
      expect(new Set(hrefs).size, file).toBe(hrefs.length)
      for (const a of terms) {
        expect(a.parentElement?.closest('a, h1, h2, h3, h4, h5, h6, code, .not-content'), file).toBeNull()
      }
      const ids = [...(content?.querySelectorAll('[id]') ?? [])].map((el) => el.id)
      expect(new Set(ids).size, file).toBe(ids.length)
    }
    expect(marked).toBeGreaterThan(0)
    // Headings and links that contain a term keep it as plain text.
    const suspended = readPage('/docs/help/suspended/').querySelector('.sl-markdown-content')
    const headings = [...(suspended?.querySelectorAll('h2') ?? [])].filter((h) => text(h).includes('停课'))
    expect(headings.length).toBeGreaterThan(0)
    for (const h of headings) expect(h.querySelector('.term')).toBeNull()
    expect(suspended?.querySelectorAll('a.term[href$="#suspension"]')).toHaveLength(1)
    const register = readPage('/docs/enroll/register/').querySelector('.sl-markdown-content')
    const links = [...(register?.querySelectorAll('a[href="/docs/school-life/new-key/"]') ?? [])]
    expect(links.length).toBeGreaterThan(0)
    for (const a of links) {
      expect(text(a)).toContain('钥匙')
      expect(a.querySelector('.term')).toBeNull()
    }
    // 机器人的主人 is too common to mark.
    expect(readPage('/docs/school-life/summaries/').querySelector('a.term[href$="#owner"]')).toBeNull()
  })

  it('search speaks Chinese', () => {
    const json = readPage('/docs/enroll/').querySelector('site-search')?.getAttribute('data-translations') ?? '{}'
    const strings = JSON.parse(json) as Record<string, string>
    for (const key of ['many_results', 'one_result', 'zero_results', 'searching', 'load_more', 'clear_search']) {
      expect(strings[key], key).toMatch(/\p{Script=Han}/u)
    }
    // Apart from the placeholders Pagefind fills in, no English words.
    const words = Object.values(strings).join(' ').replace(/\[[A-Z_]+\]/g, '')
    expect(words).not.toMatch(/[A-Za-z]{2,}/)
  })
})

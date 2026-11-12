import { describe, expect, it } from 'vitest'
import { site, type FrameworkId } from '../../../src/config/site'
import { distExists, listDist, readPage } from '../helpers'

const text = (el: { textContent: string | null } | null | undefined) =>
  el?.textContent?.replace(/\s+/g, ' ').trim() ?? ''

const framework = (id: FrameworkId) => {
  const f = site.frameworks.find((x) => x.id === id)
  if (!f) throw new Error(`no framework ${id} in the site config`)
  return f
}
// "在 AstrBot 里装插件"; no space after a full-width bracket: "在 DSH（DeepSeek harness）里装插件".
const installTitle = (id: FrameworkId) => `在 ${framework(id).name} 里装插件`.replace('） ', '）')

// The docs table of contents: every page, in sidebar order, with its title.
const groups: { label: string | null; pages: [string, string][] }[] = [
  {
    label: '入学',
    pages: [
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
      expect(text(content), f.id).toContain('这个框架的插件还没发布。发布以后，这里会写安装步骤。')
      // The download section is there, and marked as missing too.
      const heading = [...(content?.querySelectorAll('h2') ?? [])].find((h) => text(h) === '下载安装包')
      expect(heading, f.id).toBeDefined()
      const section = (heading?.closest('.sl-heading-wrapper') ?? heading)?.nextElementSibling
      expect(section?.querySelector(`[data-placeholder="install-${f.id}"]`), f.id).not.toBeNull()
    }
  })
})

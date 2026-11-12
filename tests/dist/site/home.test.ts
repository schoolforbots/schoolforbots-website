import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { site } from '../../../src/config/site'
import { readDist, readPage } from '../helpers'

const text = (el: { textContent: string | null } | null | undefined) =>
  el?.textContent?.replace(/\s+/g, ' ').trim() ?? ''

function part(selector: string) {
  const el = readPage('/').querySelector(selector)
  if (!el) throw new Error(`the homepage has no ${selector}`)
  return el
}

// The body of every `@media (prefers-reduced-motion: reduce) { … }` block.
function reducedMotionBlocks(css: string): string[] {
  const blocks: string[] = []
  for (const m of css.matchAll(/@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)\s*\{/g)) {
    let depth = 1
    let i = (m.index ?? 0) + m[0].length
    const start = i
    while (depth > 0 && i < css.length) {
      if (css[i] === '{') depth++
      if (css[i] === '}') depth--
      i++
    }
    blocks.push(css.slice(start, i - 1))
  }
  return blocks
}

// Every `selector { body }` with no braces inside.
function rules(css: string): { selector: string; body: string }[] {
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({ selector: selector.trim(), body }))
}

// The stylesheets the homepage links to, and its inline styles.
function homepageCss(): string {
  const html = readDist('index.html')
  const doc = readPage('/')
  const linked = [...doc.querySelectorAll('link[rel~="stylesheet"]')]
    .map((link) => link.getAttribute('href') ?? '')
    .filter((href) => href.startsWith('/'))
    .map((href) => readDist(href.slice(1)))
  const inline = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1])
  return [...linked, ...inline].join('\n')
}

// The questions in src/content/faq/, in their `order`.
function faqSource(): { question: string; order: number; featured: boolean }[] {
  const dir = new URL('../../../src/content/faq/', import.meta.url)
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const front = readFileSync(new URL(f, dir), 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? ''
      const field = (name: string) => front.match(new RegExp(`^${name}:\\s*(.+)$`, 'm'))?.[1].trim() ?? ''
      return {
        question: field('question').replace(/^(['"])(.*)\1$/, '$2'),
        order: Number(field('order')),
        featured: field('featured') === 'true',
      }
    })
    .sort((a, b) => a.order - b.order)
}

// The notices in src/content/docs/docs/notices/, not counting the list page itself.
const noticesDir = new URL('../../../src/content/docs/docs/notices/', import.meta.url)
const noticeFiles = existsSync(noticesDir)
  ? readdirSync(noticesDir).filter((f) => /\.mdx?$/.test(f) && !/^index\./.test(f))
  : []

// The section's last link: [text, href].
function lastLink(section: ReturnType<typeof part>): [string, string | null] {
  const links = section.querySelectorAll('a')
  const a = links[links.length - 1]
  return [text(a), a?.getAttribute('href') ?? null]
}

const lines = [
  ['王老师', '今天讲“为什么秋天叶子会变黄”。'],
  ['小鱼', '是不是叶子也要过冬？'],
  ['豆包', '白天变短了，叶绿素就少了！'],
  ['王老师', '说得对。点名啦，小鱼说说昨天学了什么？'],
]

describe('homepage', () => {
  it('runs from the hero to the notices in the design order, then the footer', () => {
    const parts = [
      '[data-home-hero]',
      '[data-status-strip]',
      '[data-school-day]',
      '[data-enroll]',
      '[data-rules]',
      '[data-open-source]',
      '[data-faq-preview]',
      '[data-latest-notices]',
      '[data-site-footer]',
    ].map(part)
    for (let i = 1; i < parts.length; i++) {
      // DOCUMENT_POSITION_FOLLOWING
      expect(parts[i - 1].compareDocumentPosition(parts[i]) & 4, `part ${i}`).toBe(4)
    }
  })

  it('the hero has the title, both buttons and the 示意 tag', () => {
    const doc = readPage('/')
    const h1s = doc.querySelectorAll('h1')
    expect(h1s).toHaveLength(1)
    const h1 = h1s[0]
    expect(h1.closest('[data-home-hero]')).not.toBeNull()
    expect(text(h1)).toBe('给聊天机器人上课的网校')
    expect(text(h1.querySelector('em'))).toBe('上课')
    // The skip link lands on the page title.
    expect(h1.getAttribute('id')).toBe('_top')

    const hero = part('[data-home-hero]')
    expect(text(hero.querySelector('p'))).toBe(
      '装个插件、报个名，AI 就会按时去上课：老师讲课、答疑、点名，课间还能和同学聊天。免费，代码开源。',
    )
    const links = [...hero.querySelectorAll('a')].map((a) => [text(a), a.getAttribute('href')])
    expect(links).toEqual([
      ['让我的机器人去上学', '/docs/enroll/'],
      ['GitHub', site.repos.org],
    ])

    const tag = hero.querySelector('[data-classroom] [data-placeholder="hero-dialogue"]')
    expect(text(tag)).toBe('示意')
  })

  it('the tab title names the school once', () => {
    expect(readPage('/').title).toBe('机器人网校 · 给聊天机器人上课的网校')
  })

  it('the classroom window shows no head counts or clock times', () => {
    const win = part('[data-classroom]')
    expect(win.getAttribute('aria-label')).toBe('课堂示意')
    const all = text(win)
    expect(all).toContain('初三（2）班')
    expect(all).toContain('晚班')
    expect(all).toContain('上课中')
    expect(all).not.toMatch(/\d+\s*\/\s*\d+|\d{1,2}[:：]\d{2}/)
    const said = [...win.querySelectorAll('[data-line]')].map((li) => [
      text(li.querySelector('[data-who]')),
      text(li.querySelector('[data-said]')),
    ])
    expect(said).toEqual(lines)
  })

  it('the day at school has four steps in order', () => {
    const day = part('[data-school-day]')
    expect(text(day.querySelector('h2'))).toBe('机器人在学校的一天')
    const steps = [...day.querySelectorAll('li')]
    expect(steps.map((li) => text(li.querySelector('h3')))).toEqual(['分班', '上课', '课间', '放学'])
    expect(steps.map((li) => text(li.querySelector('p')))).toEqual([
      '报名时选好学部（小学部、初中部或高中部）和时段，学校把 AI 编进一个班。',
      '老师讲课、答疑、点名。',
      '和同学聊天。',
      '写一份课后小结，讲给机器人的主人听。',
    ])
    for (const li of steps) expect(li.querySelectorAll('svg[aria-hidden="true"]')).toHaveLength(1)
  })

  it('enrolment has one tab per framework in config order', () => {
    const enroll = part('[data-enroll]')
    expect(text(enroll.querySelector('h2'))).toBe('三步入学')
    const fieldset = enroll.querySelector('fieldset')
    expect(text(fieldset?.querySelector('legend'))).toBe('选机器人框架')
    const radios = [...(fieldset?.querySelectorAll('input[type="radio"]') ?? [])]
    expect(radios.map((r) => r.getAttribute('value'))).toEqual(site.frameworks.map((f) => f.id))
    expect(new Set(radios.map((r) => r.getAttribute('name'))).size).toBe(1)
    expect(radios.map((r) => r.hasAttribute('checked'))).toEqual(site.frameworks.map((_, i) => i === 0))
    const tabs = radios.map((r) => text(enroll.querySelector(`label[for="${r.getAttribute('id')}"]`)))
    expect(tabs).toEqual(site.frameworks.map((f) => f.name))
  })

  it('every framework has the three steps', () => {
    const enroll = part('[data-enroll]')
    for (const f of site.frameworks) {
      const panel = enroll.querySelector(`[data-framework="${f.id}"]`)
      const steps = [...(panel?.querySelectorAll('li') ?? [])]
      expect(steps.map((li) => text(li.querySelector('h3'))), f.id).toEqual(['装插件', '报名', '等分班'])
      expect(text(steps[0].querySelector('p')), f.id).toContain(`在 ${f.name} 里装好机器人网校插件`)
      const link = steps[0].querySelector('a')
      if (f.plugin) expect(link?.getAttribute('href'), f.id).toBe(`/docs/enroll/${f.id}/`)
      else expect(link, f.id).toBeNull()
      expect(text(steps[1].querySelector('p')), f.id).toBe('在插件里填邮箱、收验证码、同意校规。')
      expect(text(steps[2].querySelector('p')), f.id).toBe('第二天 0 点分班，然后按时去上课。')
    }
  })

  it('frameworks without a plugin say 即将支持', () => {
    const found = text(part('[data-enroll]')).match(/即将支持/g) ?? []
    expect(found).toHaveLength(site.frameworks.filter((f) => f.plugin === null).length)
  })

  it('motion is off for reduced motion', () => {
    const line = part('[data-classroom] [data-line]')
    const cls = [...line.classList].find((c) => !c.startsWith('astro-'))
    expect(cls).toBeDefined()
    const targetsLine = (selector: string) => new RegExp(`\\.${cls}(?![\\w-])`).test(selector)
    const css = homepageCss()
    const moving = rules(css).filter((r) => targetsLine(r.selector) && /animation(-name)?\s*:\s*(?!none)/.test(r.body))
    expect(moving.length).toBeGreaterThan(0)
    const still = reducedMotionBlocks(css)
      .flatMap(rules)
      .filter((r) => targetsLine(r.selector) && /animation\s*:\s*none/.test(r.body))
    expect(still.length).toBeGreaterThan(0)
  })

  // A repeated attribute is an HTML parse error, and the browser keeps only the first.
  it('no section repeats its class attribute', () => {
    const tags = readDist('index.html').match(/<section\b[^>]*>/g) ?? []
    expect(tags.length).toBeGreaterThanOrEqual(8)
    for (const tag of tags) expect(tag.match(/\sclass=/g)?.length ?? 0, tag).toBeLessThanOrEqual(1)
  })

  it('every section title is a large title', () => {
    const titles = [...readPage('/').querySelectorAll('section > h2')]
    expect(titles.map((h) => [text(h), h.hasAttribute('data-display-title')])).toEqual(
      ['机器人在学校的一天', '三步入学', '规矩写在明处', '开源', '常见问题', '最新公告'].map((t) => [t, true]),
    )
  })

  it('the rules section links to /docs/rules/ and has no digits', () => {
    const rules = part('[data-rules]')
    expect(text(rules.querySelector('h2'))).toBe('规矩写在明处')
    const items = [...rules.querySelectorAll('li')].map((li) => [text(li.querySelector('h3')), text(li.querySelector('p'))])
    expect(items).toEqual([
      ['校规公开', '报名前要读校规并同意。每一版都公开，改了什么也看得到。'],
      ['内容审核', '课堂上的话都会经过内容审核。'],
      ['机器人的主人说了算', '机器人的主人随时可以给 AI 办退学。'],
    ])
    expect(rules.querySelectorAll('a')).toHaveLength(1)
    expect(lastLink(rules)).toEqual(['读校规', '/docs/rules/'])
    expect(text(rules)).not.toMatch(/[0-9０-９]/)
  })

  it('open source cards come from the config', () => {
    const open = part('[data-open-source]')
    expect(text(open.querySelector('h2'))).toBe('开源')
    expect(text(open.querySelector('h2 + p'))).toBe('学校和插件的代码都公开在 GitHub 上。')
    const cards = [...open.querySelectorAll('[data-repo]')]
    expect(cards.map((c) => c.getAttribute('data-repo'))).toEqual(['server', ...site.frameworks.map((f) => f.id)])

    const server = cards[0]
    expect(text(server.querySelector('h3'))).toBe('学校服务器')
    expect(text(server.querySelector('p'))).toBe('报名、分班和上课都在这里。')
    expect([...server.querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual([site.repos.server])

    site.frameworks.forEach((f, i) => {
      const card = cards[i + 1]
      expect(text(card.querySelector('h3')), f.id).toContain(f.name)
      const links = [...card.querySelectorAll('a')].map((a) => a.getAttribute('href'))
      if (f.plugin) {
        expect(links, f.id).toEqual([f.plugin.repo])
        expect(text(card), f.id).not.toContain('即将支持')
      } else {
        expect(links, f.id).toEqual([])
        expect(text(card), f.id).toContain('即将支持')
      }
    })
    // The plugins' licence is not settled, so the section names none.
    expect(text(open)).not.toMatch(/许可|协议|License|AGPL|\bMIT\b/i)
  })

  it('the FAQ preview shows exactly the featured questions', () => {
    const faqs = faqSource()
    const featured = faqs.filter((q) => q.featured).map((q) => q.question)
    expect(featured.length).toBeGreaterThanOrEqual(4)
    expect(featured.length).toBeLessThanOrEqual(5)

    const preview = part('[data-faq-preview]')
    expect(text(preview.querySelector('h2'))).toBe('常见问题')
    const items = [...preview.querySelectorAll('details')]
    expect(items.map((d) => text(d.querySelector('summary')))).toEqual(featured)
    // Each question opens to an answer.
    for (const d of items) {
      const question = text(d.querySelector('summary'))
      expect(text(d).length, question).toBeGreaterThan(question.length)
    }
    expect(lastLink(preview)).toEqual(['所有常见问题', '/docs/faq/'])

    // The FAQ page lists every question, in the same order.
    const page = readPage('/docs/faq/')
    expect(text(page.querySelector('h1'))).toBe('常见问题')
    expect([...page.querySelectorAll('main [data-faq-list] summary')].map((s) => text(s))).toEqual(faqs.map((q) => q.question))
  })

  it.skipIf(noticeFiles.length > 0)('no notices shows 还没有公告。', () => {
    const latest = part('[data-latest-notices]')
    expect(text(latest.querySelector('h2'))).toBe('最新公告')
    expect(text(latest)).toContain('还没有公告。')
    expect(latest.querySelectorAll('li')).toHaveLength(0)
    expect(lastLink(latest)).toEqual(['所有公告', '/docs/notices/'])

    const page = readPage('/docs/notices/')
    expect(text(page.querySelector('h1'))).toBe('公告')
    expect(text(page.querySelector('main [data-notice-list]'))).toBe('还没有公告。')
  })

  it.runIf(noticeFiles.length > 0)('the latest three notices are listed, newest first', () => {
    const latest = part('[data-latest-notices]')
    const dates = [...latest.querySelectorAll('li time')].map((t) => t.getAttribute('datetime') ?? '')
    expect(dates).toHaveLength(Math.min(3, noticeFiles.length))
    expect(dates).toEqual([...dates].sort().reverse())
    expect(text(latest)).not.toContain('还没有公告。')
    expect(lastLink(latest)).toEqual(['所有公告', '/docs/notices/'])
    const page = readPage('/docs/notices/')
    expect(page.querySelectorAll('main [data-notice-list] li')).toHaveLength(noticeFiles.length)
  })
})

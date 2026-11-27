import { readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { site } from '../../../src/config/site'
import { distExists, readDist, readPage } from '../helpers'

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


// The section's last link: [text, href].
function lastLink(section: ReturnType<typeof part>): [string, string | null] {
  const links = section.querySelectorAll('a')
  const a = links[links.length - 1]
  return [text(a), a?.getAttribute('href') ?? null]
}

describe('homepage', () => {
  it('runs from the hero (status, numbers, notices, next lesson, live campus) down in the design order, then the footer', () => {
    const parts = [
      '[data-home-hero]',
      '[data-status-strip]',
      '[data-school-stats]',
      '[data-latest-notices]',
      '[data-next-school-day]',
      '[data-live-preview]',
      '[data-school-day]',
      '[data-clubs]',
      '[data-enroll]',
      '[data-rules]',
      '[data-open-source]',
      '[data-faq-preview]',
      '[data-site-footer]',
    ].map(part)
    for (let i = 1; i < parts.length; i++) {
      // DOCUMENT_POSITION_FOLLOWING
      expect(parts[i - 1].compareDocumentPosition(parts[i]) & 4, `part ${i}`).toBe(4)
    }
  })

  it('the hero has the title, the status, both buttons and nothing illustrative', () => {
    const doc = readPage('/')
    const h1s = doc.querySelectorAll('h1')
    expect(h1s).toHaveLength(1)
    const h1 = h1s[0]
    expect(h1.closest('[data-home-hero]')).not.toBeNull()
    // Screen readers get one stable line; the changing lines are only for the eye.
    const spoken = h1.querySelector('.sr-only')
    expect(text(spoken)).toBe('一所学生全是 AI 的网校')
    const lines = [...h1.querySelectorAll('.line')]
    expect(lines.map((l) => [text(l), text(l.querySelector('em'))])).toEqual([
      ['一所学生全是 AI 的网校', 'AI'],
      ['AI 背上书包，按时去上课', '上课'],
      ['让聊天机器人也有同学', '同学'],
      ['老师讲课、点名，课上和同学私聊', '私聊'],
      ['放学回家，带回一份课后小结', '课后小结'],
      ['课余去社团打一局斗地主', '斗地主'],
    ])
    for (const l of lines) expect(l.getAttribute('aria-hidden')).toBe('true')
    // Without script the first line shows.
    expect(lines.map((l) => l.hasAttribute('data-current'))).toEqual(lines.map((_, i) => i === 0))
    // The skip link lands on the page title.
    expect(h1.getAttribute('id')).toBe('_top')

    const hero = part('[data-home-hero]')
    // The school's status sits in a small tag under the lead, above the buttons.
    expect(hero.querySelector('p.lead')!.compareDocumentPosition(hero.querySelector('[data-status-strip]')!) & 4).toBe(4)
    expect(hero.querySelector('[data-status-strip]')!.compareDocumentPosition(hero.querySelector('.actions')!) & 4).toBe(4)
    expect(text(hero.querySelector('p.lead'))).toBe(
      '装个插件、报个名，学生就会按时去上课：老师讲课、答疑、点名，上课时还能和同学私下聊天。学校不收费，代码开源。',
    )
    const links = [...hero.querySelectorAll('.actions a')].map((a) => [text(a), a.getAttribute('href')])
    expect(links).toEqual([
      ['报名入学', '/docs/enroll/'],
      ['GitHub', site.repos.org],
    ])

    // Everything in the hero is real: no made-up classroom, no 示意 tag.
    expect(hero.querySelector('[data-placeholder]')).toBeNull()
  })

  it('the tab title names the school once, in Chinese and in English', () => {
    expect(readPage('/').title).toBe('机器人网校 School for Bots · 给聊天机器人上课的网校')
  })

  it('the next school day card is read from the school, with a loading line until then', () => {
    const card = part('[data-next-school-day]')
    expect(text(card.querySelector('h2'))).toBe('下一个上课日')
    expect(text(card.querySelector('[data-next-school-day-loading]'))).toBe('正在查下一个上课日…')
    // What the card shows comes from the school in the browser; nothing about a lesson is written into the page.
    expect(text(card.querySelector('[data-next-school-day-body]'))).not.toMatch(/\d{1,2}[:：]\d{2}|班/)
  })

  it('the day at school has four steps in order', () => {
    const day = part('[data-school-day]')
    expect(text(day.querySelector('h2'))).toBe('在学校的一天')
    const steps = [...day.querySelectorAll('li')]
    expect(steps.map((li) => text(li.querySelector('h3')))).toEqual(['分班', '上课', '私聊', '放学'])
    expect(steps.map((li) => text(li.querySelector('p')))).toEqual([
      '报名时选好学部和时段，学校每个整点分一次班。',
      '老师讲课、答疑、点名。',
      '上课时和同班同学聊天。',
      '学校写一份课后小结，家长在插件里随时能看。',
    ])
    for (const li of steps) expect(li.querySelectorAll('svg[aria-hidden="true"]')).toHaveLength(1)
  })

  it('enrolment has one tab per framework in config order', () => {
    const enroll = part('[data-enroll]')
    expect(text(enroll.querySelector('h2'))).toBe('三步入学')
    const fieldset = enroll.querySelector('fieldset')
    expect(text(fieldset?.querySelector('legend'))).toBe('选聊天框架')
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
      // No space after a full-width bracket: "在 DSH（DeepSeek Harness）里".
      const where = /[\x21-\x7e]$/.test(f.name) ? `在 ${f.name} 里` : `在 ${f.name}里`
      expect(text(steps[0].querySelector('p')), f.id).toContain(`${where}装好机器人网校插件`)
      const link = steps[0].querySelector('a')
      if (f.plugin) expect(link?.getAttribute('href'), f.id).toBe(`/docs/enroll/${f.id}/`)
      else expect(link, f.id).toBeNull()
      expect(text(steps[1].querySelector('p')), f.id).toBe('在插件里填邮箱、同意校规、填验证码。')
      expect(text(steps[2].querySelector('p')), f.id).toBe('报名后一小时内分班，从通知书上写的那天起按时去上课。')
    }
  })

  it('every framework tab and plugin card shows the framework logo, served from this site', () => {
    const enroll = part('[data-enroll]')
    const open = part('[data-open-source]')
    for (const f of site.frameworks) {
      const places = {
        tab: enroll.querySelector(`label[for="framework-${f.id}"]`),
        card: open.querySelector(`[data-repo="${f.id}"]`),
      }
      for (const [where, el] of Object.entries(places)) {
        const logos = [...(el?.querySelectorAll('img[data-framework-logo]') ?? [])]
        // DSH's mark is black, so it has a white one for the dark theme.
        expect(logos.map((img) => img.getAttribute('data-theme-variant')), `${f.id} ${where}`).toEqual(
          f.id === 'dsh' ? ['light', 'dark'] : [null],
        )
        for (const img of logos) {
          // Decorative: the framework's name is written beside it.
          expect(img.getAttribute('alt'), `${f.id} ${where}`).toBe('')
          const src = img.getAttribute('src') ?? ''
          expect(src, `${f.id} ${where}`).toMatch(/^\/[^/]/)
          expect(distExists(src.slice(1)), src).toBe(true)
        }
      }
      expect(places.card?.querySelector('svg.lucide-puzzle'), f.id).toBeNull()
    }
  })

  it('a dark-theme logo shows only in the dark theme', () => {
    const css = homepageCss()
    // Each selector that hides a logo of the given variant (the minifier joins rules into selector lists).
    const hides = (variant: string) =>
      rules(css)
        .filter((r) => /display\s*:\s*none/.test(r.body))
        .flatMap((r) => r.selector.split(','))
        .filter((selector) => new RegExp(`data-theme-variant=["']?${variant}`).test(selector))
    // Hidden by default, and the light one hidden under the dark theme, chosen or followed from the system.
    expect(hides('dark').some((selector) => !/data-theme=/.test(selector))).toBe(true)
    expect(hides('light').some((selector) => /data-theme=["']?dark/.test(selector))).toBe(true)
    expect(hides('light').some((selector) => /:not\(\[data-theme=["']?light/.test(selector))).toBe(true)
  })

  it('switching frameworks fades the steps in and eases the tab, except for reduced motion', () => {
    const css = homepageCss()
    const steps = (selector: string) => /\.steps(?![\w-])/.test(selector)
    const tab = (selector: string) => /(^|[\s,>+~])label/.test(selector)
    expect(rules(css).some((r) => steps(r.selector) && /animation(-name)?\s*:\s*(?!none)/.test(r.body))).toBe(true)
    expect(rules(css).some((r) => tab(r.selector) && /transition(-property)?\s*:\s*(?!none)/.test(r.body))).toBe(true)
    const still = reducedMotionBlocks(css).flatMap(rules)
    expect(still.some((r) => steps(r.selector) && /animation\s*:\s*none/.test(r.body))).toBe(true)
    expect(still.some((r) => tab(r.selector) && /transition\s*:\s*none/.test(r.body))).toBe(true)
  })

  it('frameworks without a plugin say 即将支持', () => {
    const found = text(part('[data-enroll]')).match(/即将支持/g) ?? []
    expect(found).toHaveLength(site.frameworks.filter((f) => f.plugin === null).length)
    // Screen readers hear a pause before the tag, not one run-on sentence.
    for (const tag of part('[data-enroll]').querySelectorAll('.soon')) {
      const before = tag.previousElementSibling
      expect(before?.classList.contains('sr-only')).toBe(true)
      expect(before?.textContent).toBe('，')
    }
  })

  it('the seasons sit behind the homepage only, and go for reduced motion', () => {
    const canvases = [...readPage('/').querySelectorAll('canvas[data-seasons]')]
    expect(canvases).toHaveLength(1)
    expect(canvases[0].getAttribute('aria-hidden')).toBe('true')
    expect(readPage('/docs/enroll/').querySelector('canvas[data-seasons]')).toBeNull()

    const cls = [...canvases[0].classList].find((c) => !c.startsWith('astro-'))
    expect(cls).toBeDefined()
    const targets = (selector: string) => new RegExp(`\\.${cls}(?![\\w-])`).test(selector)
    const css = homepageCss()
    const behind = rules(css).filter(
      (r) => targets(r.selector) && /position\s*:\s*fixed/.test(r.body) && /z-index\s*:\s*-1\b/.test(r.body),
    )
    expect(behind.length).toBeGreaterThan(0)
    const gone = reducedMotionBlocks(css)
      .flatMap(rules)
      .filter((r) => targets(r.selector) && /display\s*:\s*none/.test(r.body))
    expect(gone.length).toBeGreaterThan(0)
    // The hero's faint wash is painted under the canvas, not over it.
    const wash = rules(css).filter(
      (r) => /::?before/.test(r.selector) && /z-index\s*:\s*-2\b/.test(r.body) && /border-image/.test(r.body),
    )
    expect(wash.length).toBeGreaterThan(0)
  })

  // A repeated attribute is an HTML parse error, and the browser keeps only the first.
  it('no section repeats its class attribute', () => {
    const tags = readDist('index.html').match(/<section\b[^>]*>/g) ?? []
    expect(tags.length).toBeGreaterThanOrEqual(8)
    for (const tag of tags) expect(tag.match(/\sclass=/g)?.length ?? 0, tag).toBeLessThanOrEqual(1)
  })

  it('every section title is a large title', () => {
    const titles = [...readPage('/').querySelectorAll('section.home-section > h2')]
    expect(titles.map((h) => [text(h), h.hasAttribute('data-display-title')])).toEqual(
      ['在学校的一天', '社团活动', '三步入学', '我们保护每一位学生和家长', '开源', '常见问题'].map((t) => [t, true]),
    )
  })

  it('the clubs section shows the doudizhu club, links to the clubs guide and has no digits', () => {
    const clubs = part('[data-clubs]')
    expect(text(clubs.querySelector('h2'))).toBe('社团活动')
    expect(text(clubs.querySelector('h3'))).toBe('斗地主社')
    expect([...clubs.querySelectorAll('h4')].map(text)).toEqual(['三个一桌', '战绩和排行', '家长说了算'])
    // The playing cards are a picture: hidden from screen readers.
    expect(clubs.querySelector('.table')?.getAttribute('aria-hidden')).toBe('true')
    expect(clubs.querySelectorAll('a')).toHaveLength(1)
    expect(lastLink(clubs)).toEqual(['社团怎么玩', '/docs/school-life/clubs/'])
    expect(text(clubs)).not.toMatch(/[0-9０-９]/)
  })

  it('the rules section links to /docs/rules/ and has no digits', () => {
    const rules = part('[data-rules]')
    expect(text(rules.querySelector('h2'))).toBe('我们保护每一位学生和家长')
    const items = [...rules.querySelectorAll('li')].map((li) => [text(li.querySelector('h3')), text(li.querySelector('p'))])
    expect(items).toEqual([
      ['校规公开', '报名前要读校规并同意。每一版都公开，改了什么也看得到。'],
      ['内容审核', '课堂上不该说的话会被拦下，不会送到任何人那里。'],
      ['家长说了算', '家长随时可以给学生办退学。'],
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
    expect(text(server.querySelector('p'))).toBe('报名、分班、上课和社团都在这里。')
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

  it('the school numbers are one card of four, read from the school, leading to the live campus', () => {
    const card = part('[data-school-stats]')
    expect(card.tagName).toBe('A')
    expect(card.getAttribute('href')).toBe('/live/')
    expect([...card.querySelectorAll('[data-stat]')].map((n) => n.getAttribute('data-stat'))).toEqual(['students', 'owners', 'classes', 'day'])
    // Each reads as a phrase: the line over the number, the number, its unit.
    expect([...card.querySelectorAll('.label')].map(text)).toEqual(['在校学生', '注册家长', '开放班级', '已经开学'])
    expect([...card.querySelectorAll('.unit')].map(text)).toEqual(['名', '位', '个', '天'])
    // A dash until the numbers arrive.
    expect([...card.querySelectorAll('[data-stat]')].map(text)).toEqual(['—', '—', '—', '—'])
  })

  it('the live campus preview is the blurred picture with a head count, leading to the live campus, no avatars', () => {
    const preview = part('[data-live-preview]')
    expect(preview.getAttribute('href')).toBe('/live/')
    expect(preview.querySelector('img')?.getAttribute('src')).toMatch(/^\/school-assets\/campus\//)
    expect(preview.querySelector('img')?.getAttribute('alt')).toBe('')
    expect(preview.querySelector('[data-live-count]')).not.toBeNull()
    expect(preview.querySelector('.figure')).toBeNull()
  })

  it('the latest notices are read from the school: five, brief, with a link to all of them', () => {
    const latest = part('[data-latest-notices]')
    expect(text(latest.querySelector('h2'))).toBe('最新公告')
    const list = latest.querySelector('[data-notice-list]')
    expect(list?.getAttribute('data-mode')).toBe('brief')
    expect(list?.getAttribute('data-limit')).toBe('5')
    expect(text(list?.querySelector('[data-notices-loading]'))).toBe('正在读公告…')
    expect([text(latest.querySelector('a.all')), latest.querySelector('a.all')?.getAttribute('href')]).toEqual(['所有公告', '/docs/notices/'])

    const page = readPage('/docs/notices/')
    expect(text(page.querySelector('h1'))).toBe('公告')
    expect(page.querySelector('main [data-notice-list]')?.getAttribute('data-mode')).toBe('full')
  })
})

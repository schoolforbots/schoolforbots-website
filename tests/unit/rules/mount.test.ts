import { Window } from 'happy-dom'
import { describe, expect, it, vi } from 'vitest'
import { mountRules } from '../../../src/lib/rules/mount'

const server = 'https://github.com/schoolforbots/schoolforbots-server'
const rulesUrl = 'https://api.test/v1/school-rules'
const body = (text: string) => ({
  version: '2026-11-11',
  changes: '改了第 3 条。',
  url: 'https://api.test/rules/2026-11-11.md',
  text,
  versions: ['2026-05-01', '2026-11-11', '2026-08-20'],
})
const text = [
  '# 标题',
  '版本：2026-11-11',
  '本次修改：改了第 3 条。',
  '',
  '## 名词解释',
  '- 学校：机器人网校。',
  '',
  '第 3 条 第一行',
  '第二行',
].join('\n')

function setup(f: typeof fetch, calendarCors = true) {
  const doc = new Window().document
  const el = doc.createElement('div')
  // As SchoolRules.astro renders it: the loading line, a live region.
  if (calendarCors) el.innerHTML = '<p role="status" data-rules-status>正在读取校规…</p>'
  doc.body.appendChild(el)
  const run = () =>
    mountRules(el as unknown as HTMLElement, { fetch: f, timeoutMs: 1000, rulesUrl, serverRepo: server, calendarCors })
  return { el, run }
}
const reply = (b: unknown, status = 200) =>
  vi.fn(async () => new Response(JSON.stringify(b), { status })) as unknown as typeof fetch

describe('mountRules', () => {
  it('with calendarCors off it makes no request and leaves the container empty', async () => {
    const f = vi.fn() as unknown as typeof fetch
    const { el, run } = setup(f, false)
    await run()
    expect(f).not.toHaveBeenCalled()
    expect(el.textContent).toBe('')
  })

  it('renders the version, the changes, the blocks and the older versions', async () => {
    const { el, run } = setup(reply(body(text)))
    await run()
    expect(el.textContent).not.toContain('正在读取')
    expect(el.textContent).toContain('当前版本：2026-11-11')
    expect(el.textContent).toContain('本次修改：改了第 3 条。')
    expect(el.querySelector('h2')?.textContent).toBe('名词解释')
    expect(el.querySelector('li')?.textContent).toBe('学校：机器人网校。')
    const p = el.querySelector('p.rules-clause')!
    expect(p.querySelectorAll('br').length).toBe(1)
    expect(p.textContent).toBe('第 3 条 第一行第二行')
    const links = [...el.querySelectorAll('.rules-older a')]
    expect(links.map((a) => a.textContent)).toEqual(['2026-08-20', '2026-05-01'])
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      `${server}/blob/main/school-rules/2026-08-20.md`,
      `${server}/blob/main/school-rules/2026-05-01.md`,
    ])
    expect(el.querySelector('a.rules-source')?.getAttribute('href')).toBe(body(text).url)
  })

  it('text that looks like HTML stays text', async () => {
    const { el, run } = setup(reply(body('第 1 条 <img src=x onerror=alert(1)>')))
    await run()
    expect(el.querySelector('img')).toBeNull()
    expect(el.textContent).toContain('<img src=x onerror=alert(1)>')
  })

  it('a failed request says 校规暂时读不到 and drops the loading text', async () => {
    for (const f of [
      reply({}, 500),
      reply({ nope: 1 }),
      vi.fn(async () => {
        throw new TypeError('x')
      }) as unknown as typeof fetch,
    ]) {
      const { el, run } = setup(f)
      const status = el.querySelector('[role="status"]')
      await run()
      expect(el.textContent).toBe('校规暂时读不到，可以在 GitHub 上看。')
      // The same live region carries the new text, so it is announced.
      expect(el.querySelector('[role="status"]')).toBe(status)
    }
  })

  it('a failure without the loading line still lands in a live region', async () => {
    const doc = new Window().document
    const el = doc.createElement('div')
    doc.body.appendChild(el)
    await mountRules(el as unknown as HTMLElement, {
      fetch: reply({}, 500),
      timeoutMs: 1000,
      rulesUrl,
      serverRepo: server,
      calendarCors: true,
    })
    expect(el.querySelector('[role="status"]')?.textContent).toBe('校规暂时读不到，可以在 GitHub 上看。')
  })

  it('calls fetch with the url and only a signal', async () => {
    const f = reply(body(text)) as unknown as ReturnType<typeof vi.fn>
    const { run } = setup(f as unknown as typeof fetch)
    await run()
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(rulesUrl)
    expect(Object.keys(init)).toEqual(['signal'])
  })
})

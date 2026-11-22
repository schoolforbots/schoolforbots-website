// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { parseNotice } from '../../../src/lib/school/notices'
import { renderNotices } from '../../../src/lib/school/notices-mount'
import { general, notice } from './fixtures'

const now = new Date('2026-11-22T10:00:00+08:00')
const list = [
  notice(),
  general(1, '2026-11-18T20:00:00+08:00'),
  general(3, '2026-11-17T09:00:00+08:00'),
  general(4, '2026-11-16T09:00:00+08:00'),
].map((n) => parseNotice(n)!)

function root(mode: 'brief' | 'full', limit?: number): HTMLElement {
  const el = document.createElement('div')
  el.dataset.mode = mode
  if (limit) el.dataset.limit = String(limit)
  el.innerHTML = '<p data-notices-loading>正在读公告…</p>'
  return el
}

describe('drawing the notices', () => {
  it('brief: a row per notice, up to the limit, each a link to it on the notices page', () => {
    const el = root('brief', 3)
    renderNotices(el, { kind: 'school', notices: list, more: false }, now)
    const rows = [...el.querySelectorAll('ul.rows a')]
    expect(rows).toHaveLength(3)
    expect(rows[0].getAttribute('href')).toBe('/docs/notices/#notice-2')
    expect(rows[0].querySelector('time')?.textContent).toBe('11月20日 18:30')
    expect(rows[0].querySelector('.tag')?.textContent).toBe('维护')
    expect(el.querySelector('[data-notices-loading]')).toBeNull()
  })

  it('full: each notice with its anchor, time, maintenance window and text', () => {
    const el = root('full')
    const updated = parseNotice(notice({ updatedAt: '2026-11-21T09:00:00+08:00' }))!
    renderNotices(el, { kind: 'school', notices: [updated], more: false }, now)
    const article = el.querySelector('article')!
    expect(article.id).toBe('notice-2')
    expect(article.querySelector('.meta')?.textContent).toBe('发布于 11月20日 18:30，11月21日 09:00 更新')
    expect(article.querySelector('.window')?.textContent).toBe('维护时间：11月24日 02:00–03:00')
    expect([...article.querySelectorAll('.body li')].map((li) => li.textContent)).toEqual(['斗地主社关门', '报名暂停'])
  })

  it("says when the list is the status file's copy, when there are none, and when nothing could be read", () => {
    const copy = root('brief', 3)
    renderNotices(copy, { kind: 'sentinel', notices: list, fetchedAt: '2026-11-22T01:30:00Z' }, now)
    expect(copy.querySelector('.state')?.textContent).toBe('暂时连不上学校。下面是 11月22日 09:30 留下的最近几条公告。')
    expect(copy.querySelectorAll('ul.rows li')).toHaveLength(3)

    const empty = root('brief', 3)
    renderNotices(empty, { kind: 'school', notices: [], more: false }, now)
    expect(empty.textContent).toBe('还没有公告。')

    const down = root('full')
    renderNotices(down, { kind: 'unreachable' }, now)
    expect(down.querySelector('.state')?.textContent).toBe('暂时连不上学校，公告读不到。 怎么办')
    expect(down.querySelector('a')?.getAttribute('href')).toBe('/docs/help/cannot-connect/')
  })
})

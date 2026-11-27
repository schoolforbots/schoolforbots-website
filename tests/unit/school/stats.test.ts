// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { parseStats, resolveStats, schoolDays } from '../../../src/lib/school/stats'
import { renderStats } from '../../../src/lib/school/stats-mount'
import { fakeFetch } from './fixtures'

const stats = (over: Record<string, unknown> = {}) => ({
  generatedAt: '2026-11-27T12:00:00.000Z',
  students: {
    total: 86,
    byDivision: [{ division: 'primary', students: 31 }, { division: 'junior', students: 34 }, { division: 'senior', students: 21 }],
    bySlot: [{ slot: 'morning', students: 18 }, { slot: 'afternoon', students: 25 }, { slot: 'evening', students: 43 }],
  },
  owners: 71,
  classes: { total: 9, bySlotAndDivision: [{ slot: 'evening', division: 'senior', classes: 2, students: 21 }] },
  clubs: { doudizhu: { gamesToday: 57 } },
  aiTypes: [{ aiType: 'deepseek', students: 60 }, { aiType: 'claude', students: 26 }, { aiType: 'other', students: 0 }],
  ...over,
})

describe('the school numbers', () => {
  it('reads the numbers and refuses malformed answers', () => {
    expect(parseStats(stats())?.students.total).toBe(86)
    // A division or slot the school leaves out counts as none.
    expect(parseStats(stats({ students: { total: 3, byDivision: [{ division: 'junior', students: 3 }], bySlot: [] } }))?.students.byDivision.primary).toBe(0)
    // The counts come as a list, as the school sends them.
    expect(parseStats(stats({ students: { total: 3, byDivision: { junior: 3 }, bySlot: [] } }))).toBeUndefined()
    expect(parseStats(stats({ owners: -1 }))).toBeUndefined()
    expect(parseStats(stats({ owners: 1.5 }))).toBeUndefined()
    expect(parseStats(stats({ classes: { total: 1, bySlotAndDivision: [{ slot: 'night', division: 'senior', classes: 1, students: 1 }] } }))).toBeUndefined()
    expect(parseStats(stats({ clubs: {} }))).toBeUndefined()
    expect(parseStats({})).toBeUndefined()
    expect(parseStats(stats())?.aiTypes).toHaveLength(3)
    // A school that does not count by type yet has none; a malformed count is refused.
    expect(parseStats({ ...stats(), aiTypes: undefined })?.aiTypes).toEqual([])
    expect(parseStats(stats({ aiTypes: [{ aiType: 'claude', students: -2 }] }))).toBeUndefined()
  })

  it('lists the robot types with students, each with its avatar and a bar against the largest', () => {
    const root = document.createElement('div')
    root.innerHTML = '<ul data-stat-ai-types></ul>'
    renderStats(root, { stats: parseStats(stats())!, days: { kind: 'open', days: 1 } })
    const rows = [...root.querySelectorAll('[data-stat-ai-types] > li')]
    expect(rows.map((li) => [li.querySelector('.name')?.textContent, li.querySelector('.count')?.textContent])).toEqual([
      ['DeepSeek', '60'],
      ['Claude', '26'],
    ])
    expect(rows[0].querySelector('.avatar img')?.getAttribute('src')).toMatch(/^\/school-assets\/avatars\/deepseek\./)
    expect(rows.map((li) => (li.querySelector('.bar') as HTMLElement).style.width)).toEqual(['100%', `${(26 / 60) * 100}%`])
    renderStats(root, { stats: null, days: null })
    expect(root.querySelector('[data-stat-ai-types]')?.textContent).toBe('—')
  })

  it('draws each bar as its share of the largest in its group, and none without numbers', () => {
    const root = document.createElement('div')
    root.innerHTML = '<ul data-bar-group><span data-bar="division-primary"></span><span data-bar="division-junior"></span><span data-bar="division-senior"></span></ul>'
    renderStats(root, { stats: parseStats(stats())!, days: { kind: 'open', days: 1 } })
    const widths = () => [...root.querySelectorAll<HTMLElement>('[data-bar]')].map((b) => b.style.width)
    expect(widths()).toEqual([`${(31 / 34) * 100}%`, '100%', `${(21 / 34) * 100}%`])
    renderStats(root, { stats: null, days: null })
    for (const w of widths()) expect(w).toMatch(/^0(px)?$/)
  })

  it('tells numbers from an unreachable school', async () => {
    const url = 'https://api.test/v1/school/stats'
    const read = (answer: unknown) => resolveStats({ url, timeoutMs: 1000, fetch: fakeFetch({ [url]: answer }) })
    expect((await read(stats())).kind).toBe('stats')
    expect((await read(500)).kind).toBe('unreachable')
    expect((await read({ nope: true })).kind).toBe('unreachable')
  })

  it('counts the days the school has been open, or until it opens', () => {
    expect(schoolDays('2026-11-01', '2026-11-01')).toEqual({ kind: 'open', days: 1 })
    expect(schoolDays('2026-11-01', '2026-11-27')).toEqual({ kind: 'open', days: 27 })
    expect(schoolDays('2026-11-30', '2026-11-28')).toEqual({ kind: 'before', days: 2 })
    expect(schoolDays(null, '2026-11-27')).toEqual({ kind: 'unset' })
  })

  it('reads each tile as a phrase: 已经开学 9 天, 离开学还有 2 天, 开学日期 待定', () => {
    const root = document.createElement('div')
    root.innerHTML = '<span data-stat-label="day"></span><span data-stat="day"></span><span data-stat-unit="day"></span>'
    const read = () => ['label', '', 'unit'].map((k) => root.querySelector(k ? `[data-stat-${k}="day"]` : '[data-stat="day"]')?.textContent)
    renderStats(root, { stats: parseStats(stats())!, days: { kind: 'open', days: 9 } })
    expect(read()).toEqual(['已经开学', '9', '天'])
    renderStats(root, { stats: parseStats(stats())!, days: { kind: 'before', days: 2 } })
    expect(read()).toEqual(['离开学还有', '2', '天'])
    renderStats(root, { stats: parseStats(stats())!, days: { kind: 'unset' } })
    expect(read()).toEqual(['开学日期', '待定', ''])
    renderStats(root, { stats: null, days: null })
    expect(read()).toEqual(['已经开学', '—', '天'])
  })

  it('fills each number in, or a dash when the school cannot be read', () => {
    const root = document.createElement('div')
    root.innerHTML = '<span data-stat="students"></span><span data-stat="division-junior"></span><span data-stat="day"></span>'
    renderStats(root, { stats: parseStats(stats())!, days: { kind: 'open', days: 27 } })
    expect([...root.querySelectorAll('[data-stat]')].map((n) => n.textContent)).toEqual(['86', '34', '27'])
    expect(root.dataset.state).toBe('ready')
    renderStats(root, { stats: null, days: null })
    expect([...root.querySelectorAll('[data-stat]')].map((n) => n.textContent)).toEqual(['—', '—', '—'])
    expect(root.dataset.state).toBe('unreachable')
  })
})

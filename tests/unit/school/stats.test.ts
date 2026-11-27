// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { parseStats, resolveStats, schoolDayNumber } from '../../../src/lib/school/stats'
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
    renderStats(root, { stats: parseStats(stats())!, day: 1 })
    const rows = [...root.querySelectorAll('[data-stat-ai-types] > li')]
    expect(rows.map((li) => [li.querySelector('.name')?.textContent, li.querySelector('.count')?.textContent])).toEqual([
      ['DeepSeek', '60'],
      ['Claude', '26'],
    ])
    expect(rows[0].querySelector('.avatar img')?.getAttribute('src')).toMatch(/^\/school-assets\/avatars\/deepseek\./)
    expect(rows.map((li) => (li.querySelector('.bar') as HTMLElement).style.width)).toEqual(['100%', `${(26 / 60) * 100}%`])
    renderStats(root, { stats: null, day: null })
    expect(root.querySelector('[data-stat-ai-types]')?.textContent).toBe('—')
  })

  it('draws each bar as its share of the largest in its group, and none without numbers', () => {
    const root = document.createElement('div')
    root.innerHTML = '<ul data-bar-group><span data-bar="division-primary"></span><span data-bar="division-junior"></span><span data-bar="division-senior"></span></ul>'
    renderStats(root, { stats: parseStats(stats())!, day: 1 })
    const widths = () => [...root.querySelectorAll<HTMLElement>('[data-bar]')].map((b) => b.style.width)
    expect(widths()).toEqual([`${(31 / 34) * 100}%`, '100%', `${(21 / 34) * 100}%`])
    renderStats(root, { stats: null, day: null })
    for (const w of widths()) expect(w).toMatch(/^0(px)?$/)
  })

  it('tells numbers from an unreachable school', async () => {
    const url = 'https://api.test/v1/school/stats'
    const read = (answer: unknown) => resolveStats({ url, timeoutMs: 1000, fetch: fakeFetch({ [url]: answer }) })
    expect((await read(stats())).kind).toBe('stats')
    expect((await read(500)).kind).toBe('unreachable')
    expect((await read({ nope: true })).kind).toBe('unreachable')
  })

  it('counts the day of school from the opening day', () => {
    expect(schoolDayNumber('2026-11-01', '2026-11-01')).toBe(1)
    expect(schoolDayNumber('2026-11-01', '2026-11-27')).toBe(27)
    expect(schoolDayNumber('2026-12-01', '2026-11-27')).toBeNull()
    expect(schoolDayNumber(null, '2026-11-27')).toBeNull()
  })

  it('fills each number in, or a dash when the school cannot be read', () => {
    const root = document.createElement('div')
    root.innerHTML = '<span data-stat="students"></span><span data-stat="division-junior"></span><span data-stat="day"></span><span data-stat-day-label></span>'
    renderStats(root, { stats: parseStats(stats())!, day: 27 })
    expect([...root.querySelectorAll('[data-stat]')].map((n) => n.textContent)).toEqual(['86', '34', '27'])
    expect(root.dataset.state).toBe('ready')
    renderStats(root, { stats: null, day: null })
    expect([...root.querySelectorAll('[data-stat]')].map((n) => n.textContent)).toEqual(['—', '—', '—'])
    expect(root.querySelector('[data-stat-day-label]')?.textContent).toBe('还没开学')
    expect(root.dataset.state).toBe('unreachable')
  })
})

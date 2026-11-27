// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { parseStats, resolveStats, schoolDayNumber } from '../../../src/lib/school/stats'
import { renderStats } from '../../../src/lib/school/stats-mount'
import { fakeFetch } from './fixtures'

const stats = (over: Record<string, unknown> = {}) => ({
  generatedAt: '2026-11-27T12:00:00.000Z',
  students: { total: 86, byDivision: { primary: 31, junior: 34, senior: 21 }, bySlot: { morning: 18, afternoon: 25, evening: 43 } },
  owners: 71,
  classes: { total: 9, groups: [{ slot: 'evening', division: 'senior', classes: 2, students: 21 }] },
  clubs: { doudizhu: { gamesToday: 57 } },
  ...over,
})

describe('the school numbers', () => {
  it('reads the numbers and refuses malformed answers', () => {
    expect(parseStats(stats())?.students.total).toBe(86)
    // A division or slot the school leaves out counts as none.
    expect(parseStats(stats({ students: { total: 3, byDivision: { junior: 3 }, bySlot: {} } }))?.students.byDivision.primary).toBe(0)
    expect(parseStats(stats({ owners: -1 }))).toBeUndefined()
    expect(parseStats(stats({ owners: 1.5 }))).toBeUndefined()
    expect(parseStats(stats({ classes: { total: 1, groups: [{ slot: 'night', division: 'senior', classes: 1, students: 1 }] } }))).toBeUndefined()
    expect(parseStats(stats({ clubs: {} }))).toBeUndefined()
    expect(parseStats({})).toBeUndefined()
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

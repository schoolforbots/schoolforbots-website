// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { parseSchoolDay, resolveSchoolDay } from '../../../src/lib/school/next-school-day'
import { renderSchoolDay } from '../../../src/lib/school/next-school-day-mount'
import { fakeFetch, schoolDay } from './fixtures'

const URL_ = 'https://api.test/v1/next-school-day'
// Monday 2026-11-23, 08:00 in Beijing: before the first slot.
const morning = new Date('2026-11-23T08:00:00+08:00')

function card(): HTMLElement {
  const root = document.createElement('section')
  root.innerHTML = '<div data-next-school-day-body></div>'
  return root
}

const texts = (root: HTMLElement, selector: string) => [...root.querySelectorAll(selector)].map((n) => n.textContent)

function show(over: Record<string, unknown>, now: Date): HTMLElement {
  const root = card()
  renderSchoolDay(root, { kind: 'day', day: parseSchoolDay({ day: schoolDay(over) })! }, now)
  return root
}

describe('the next school day', () => {
  it('reads a day, no day, and refuses malformed answers', () => {
    expect(parseSchoolDay({ day: schoolDay() })?.divisions).toHaveLength(3)
    expect(parseSchoolDay({ day: null })).toBeNull()
    expect(parseSchoolDay({})).toBeUndefined()
    expect(parseSchoolDay({ day: schoolDay({ kind: 'holiday' }) })).toBeUndefined()
    expect(parseSchoolDay({ day: schoolDay({ slots: [{ slot: 'night', startsAt: 'x', endsAt: 'x', doorsOpenAt: 'x' }] }) })).toBeUndefined()
    expect(parseSchoolDay({ day: schoolDay({ divisions: [{ division: 'college', kind: 'lesson', subject: null, title: null }] }) })).toBeUndefined()
  })

  it('tells a day, a break with no day set and an unreachable school apart', async () => {
    const read = (answer: unknown) => resolveSchoolDay({ url: URL_, timeoutMs: 1000, fetch: fakeFetch({ [URL_]: answer }) })
    expect((await read({ day: schoolDay() })).kind).toBe('day')
    expect((await read({ day: null })).kind).toBe('none')
    expect((await read('fail')).kind).toBe('unreachable')
    expect((await read(500)).kind).toBe('unreachable')
    expect((await read({ nope: 1 })).kind).toBe('unreachable')
  })

  it('shows the day, the three slots, and every division with its subject and title, 备课中 or 自习', () => {
    const root = show({}, morning)
    expect(root.querySelector('.badge')?.textContent).toBe('下一个上课日')
    expect(root.querySelector('.near')?.textContent).toBe('今天')
    expect(root.querySelector('.day')?.textContent).toBe('11月23日 周一')
    expect(root.querySelector('.study')).toBeNull()
    expect(texts(root, '.slots li')).toEqual(['上午班10:00–10:30', '下午班15:00–15:30', '晚班20:00–20:30'])
    const rows = [...root.querySelectorAll('.divisions li')].map((li) => [
      li.querySelector('.division')?.textContent,
      li.querySelector('.subject')?.textContent ?? null,
      li.querySelector('.topic')?.textContent,
    ])
    expect(rows).toEqual([
      ['小学部', '科学', '为什么秋天叶子会变黄'],
      ['初中部', '科学', '备课中'],
      ['高中部', null, '自习：回顾这一周的课'],
    ])
  })

  it('marks the slot under way and the slots already over', () => {
    const root = show({}, new Date('2026-11-23T15:10:00+08:00'))
    expect(root.querySelector('.badge.live')?.textContent).toBe('正在上课')
    expect(texts(root, '.slots li')).toEqual(['上午班10:00–10:30已下课', '下午班15:00–15:30上课中', '晚班20:00–20:30'])
    expect(root.querySelector('.slots .live .slot')?.textContent).toBe('下午班')

    const between = show({}, new Date('2026-11-23T16:00:00+08:00'))
    expect(between.querySelector('.badge.live')).toBeNull()
  })

  it('names tomorrow, and a day further off by its date, and a weekend study day', () => {
    expect(show({}, new Date('2026-11-22T21:00:00+08:00')).querySelector('.near')?.textContent).toBe('明天')
    const later = show({}, new Date('2026-11-20T21:00:00+08:00'))
    expect(later.querySelector('.near')).toBeNull()
    expect(later.querySelector('.day')?.textContent).toBe('11月23日 周一')

    const weekend = show(
      {
        date: '2026-11-28',
        kind: 'study',
        divisions: ['primary', 'junior', 'senior'].map((division) => ({ division, kind: 'study', subject: null, title: null })),
      },
      new Date('2026-11-27T21:00:00+08:00'),
    )
    expect(weekend.querySelector('.day')?.textContent).toBe('11月28日 周六')
    expect(weekend.querySelector('.study')?.textContent).toBe('周末自习')
    expect(weekend.querySelector('.subject')).toBeNull()
  })

  it('says so on a break with no day set, or when the school cannot be reached', () => {
    const none = card()
    renderSchoolDay(none, { kind: 'none' }, morning)
    expect(none.textContent).toContain('开学的日子还没定')
    const down = card()
    renderSchoolDay(down, { kind: 'unreachable' }, morning)
    expect(down.textContent).toContain('暂时连不上学校')
    expect(down.dataset.state).toBe('unreachable')
  })
})

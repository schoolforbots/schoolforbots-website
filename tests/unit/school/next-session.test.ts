// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { parseNextSession, resolveNextSession } from '../../../src/lib/school/next-session'
import { renderNextSession } from '../../../src/lib/school/next-session-mount'
import { fakeFetch, session } from './fixtures'

const URL_ = 'https://api.test/v1/next-session'
const now = new Date('2026-11-23T10:00:00+08:00')

function card(): HTMLElement {
  const root = document.createElement('section')
  root.innerHTML = '<div data-next-session-body></div>'
  return root
}

describe('the next lesson', () => {
  it('reads a session, no session, and refuses malformed answers', () => {
    expect(parseNextSession({ session: session() })?.divisions).toHaveLength(2)
    expect(parseNextSession({ session: null })).toBeNull()
    expect(parseNextSession({})).toBeUndefined()
    expect(parseNextSession({ session: session({ slot: 'night' }) })).toBeUndefined()
    expect(parseNextSession({ session: session({ divisions: [{ division: 'college', subject: null, title: null }] }) })).toBeUndefined()
  })

  it('tells a lesson, no lessons and an unreachable school apart', async () => {
    const read = (answer: unknown) => resolveNextSession({ url: URL_, timeoutMs: 1000, fetch: fakeFetch({ [URL_]: answer }) })
    expect((await read({ session: session() })).kind).toBe('session')
    expect((await read({ session: null })).kind).toBe('none')
    expect((await read('fail')).kind).toBe('unreachable')
    expect((await read(500)).kind).toBe('unreachable')
    expect((await read({ nope: 1 })).kind).toBe('unreachable')
  })

  it('shows when, the slot, and each division with its subject and title, or 备课中', () => {
    const root = card()
    renderNextSession(root, { kind: 'session', session: parseNextSession({ session: session() })! }, now)
    expect(root.querySelector('.badge')?.textContent).toBe('下一节课')
    expect(root.querySelector('.day')?.textContent).toBe('今天 19:30–20:00')
    expect(root.querySelector('.slot')?.textContent).toBe('晚班')
    expect(root.querySelector('.doors')?.textContent).toBe('19:15 开门')
    const rows = [...root.querySelectorAll('.divisions li')].map((li) => [
      li.querySelector('.division')?.textContent,
      li.querySelector('.subject')?.textContent ?? null,
      li.querySelector('.topic')?.textContent,
    ])
    expect(rows).toEqual([
      ['小学部', '科学', '为什么秋天叶子会变黄'],
      ['高中部', '科学', '备课中'],
    ])
  })

  it('marks a lesson under way and a weekend study', () => {
    const live = card()
    renderNextSession(live, { kind: 'session', session: parseNextSession({ session: session({ inProgress: true }) })! }, now)
    expect(live.querySelector('.badge.live')?.textContent).toBe('正在上课')
    expect(live.querySelector('.doors')?.textContent).toBe('20:00 下课')

    const study = card()
    const weekend = session({ kind: 'study', divisions: [{ division: 'junior', subject: null, title: null }] })
    renderNextSession(study, { kind: 'session', session: parseNextSession({ session: weekend })! }, now)
    expect(study.querySelector('.subject')).toBeNull()
    expect(study.querySelector('.topic')?.textContent).toBe('自习：回顾这一周的课')
  })

  it('says so when there are no lessons soon or the school cannot be reached', () => {
    const none = card()
    renderNextSession(none, { kind: 'none' }, now)
    expect(none.textContent).toContain('近期没有课')
    const down = card()
    renderNextSession(down, { kind: 'unreachable' }, now)
    expect(down.textContent).toContain('暂时连不上学校')
    expect(down.dataset.state).toBe('unreachable')
  })
})

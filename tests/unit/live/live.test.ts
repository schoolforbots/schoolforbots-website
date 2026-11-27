import { describe, expect, it } from 'vitest'
import { buildScene, parseClassLive, parseClubLive, placeSummary, readLive, stepText } from '../../../src/lib/live/live'
import { look, slots } from '../../../src/lib/live/map'
import manifest from '../../../src/data/school-assets.json'
import { fakeFetch } from '../school/fixtures'

const named = (studentId: number, aiName: string, aiType: string | null = 'claude', avatar: unknown = null) => ({ anonymous: false, studentId, aiName, anonId: null, aiType, avatar })
const anon = (anonId: string) => ({ anonymous: true, studentId: null, aiName: null, anonId, aiType: null, avatar: null })

const room = (over: Record<string, unknown> = {}) => ({
  division: 'junior',
  slot: 'afternoon',
  classNo: 2,
  teacher: { name: '李老师' },
  kind: 'lesson',
  title: '光的折射',
  step: { name: 'segment', segment: 2, segments: 4 },
  startsAt: '2026-11-27T07:00:00.000Z',
  endsAt: '2026-11-27T07:30:00.000Z',
  students: [named(12, '小鲸'), anon('k3j9x0a8b7c6')],
  ...over,
})
const classLive = (classrooms: unknown[] = [room()]) => ({ generatedAt: '2026-11-27T07:10:00.000Z', classrooms })

const table = (over: Record<string, unknown> = {}) => ({
  tableId: 'tA9x',
  table: 1,
  playing: true,
  gamesPlayed: 3,
  seats: [
    { seat: 0, player: { bot: false, person: named(19, '豆豆') }, online: true },
    { seat: 1, player: { bot: true, name: '陪练一号' }, online: true },
    { seat: 2, player: null, online: false },
  ],
  waiting: [],
  spectators: [anon('zz1')],
  ...over,
})
const clubLive = (over: Record<string, unknown> = {}) => ({
  generatedAt: '2026-11-27T07:10:01.000Z',
  open: true,
  lobby: [named(26, '星河')],
  tables: [table()],
  ...over,
})

describe('the live snapshots', () => {
  it('reads a class snapshot and refuses malformed ones', () => {
    expect(parseClassLive(classLive())?.classrooms[0].students).toHaveLength(2)
    expect(parseClassLive(classLive([room({ step: { name: 'nap' } })]))).toBeUndefined()
    // An anonymous student comes with neither a number nor a name, a named one with both.
    expect(parseClassLive(classLive([room({ students: [{ anonymous: true, studentId: null, aiName: null, anonId: null }] })]))).toBeUndefined()
    expect(parseClassLive(classLive([room({ students: [{ anonymous: false, studentId: null, aiName: 'x', anonId: null }] })]))).toBeUndefined()
    expect(parseClassLive({ classrooms: [] })).toBeUndefined()
  })

  it('reads a club snapshot, its bots and empty seats', () => {
    const club = parseClubLive(clubLive())!
    expect(club.tables[0].seats.map((s) => s.kind)).toEqual(['student', 'bot', 'empty'])
    expect(parseClubLive(clubLive({ tables: [table({ tableId: 4 })] }))).toBeUndefined()
    expect(parseClubLive(clubLive({ open: 'yes' }))).toBeUndefined()
    // A student's seat says bot: false and carries the person.
    expect(parseClubLive(clubLive({ tables: [table({ seats: [{ seat: 0, player: named(1, 'x'), online: true }] })] }))).toBeUndefined()
  })

  it('puts everyone where they are, anonymous students without a number', () => {
    const scene = buildScene(parseClassLive(classLive()), parseClubLive(clubLive()))
    const who = Object.fromEntries(scene.figures.map((f) => [f.key, f]))
    expect(who['s:12']).toMatchObject({ place: 'junior', name: '小鲸', number: '#0012' })
    expect(who['s:12'].status).toContain('讲第 2/4 段')
    expect(who['anon:class:k3j9x0a8b7c6']).toMatchObject({ kind: 'anonymous', name: '匿名同学', number: null })
    expect(who['s:26'].place).toBe('plaza')
    expect(who['s:19'].status).toBe('1 号桌 · 在打第 4 局')
    expect(who['anon:club:zz1'].status).toBe('1 号桌 · 在旁边看')
    expect(who['teacher:junior:afternoon:2'].kind).toBe('teacher')
    expect(Object.values(who).filter((f) => f.kind === 'sparring')).toHaveLength(1)
    // Teachers and sparring bots are not counted as students.
    expect(scene.students).toBe(5)
    // No figure says a student number for an anonymous student.
    expect(scene.figures.filter((f) => f.kind === 'anonymous').every((f) => f.number === null && !/#\d/.test(f.status))).toBe(true)
  })

  it('says what each place is doing', () => {
    const scene = buildScene(parseClassLive(classLive()), parseClubLive(clubLive()))
    expect(placeSummary(scene, 'junior')).toBe('1 个班 · 2 名在上课 · 光的折射')
    expect(placeSummary(scene, 'primary')).toBe('现在没有课')
    expect(placeSummary(scene, 'doudizhu')).toBe('1 桌在打 · 2 名在社团')
    expect(placeSummary(scene, 'plaza')).toBe('1 名在闲逛')
    const closed = buildScene(undefined, parseClubLive(clubLive({ open: false, lobby: [], tables: [] })))
    expect(placeSummary(closed, 'doudizhu')).toBe('上课时段关门')
    expect(placeSummary(closed, 'junior')).toBe('暂时看不到')
  })

  it('names each step of a lesson', () => {
    expect(stepText({ name: 'doors', segment: null, segments: null }, 'lesson')).toBe('等上课')
    expect(stepText({ name: 'call_on', segment: null, segments: null }, 'lesson')).toBe('点名回答')
    expect(stepText({ name: 'segment', segment: 1, segments: 3 }, 'study')).toBe('自习')
    expect(stepText({ name: 'segment', segment: 2, segments: 4 }, 'lesson')).toBe('讲第 2/4 段')
    expect(stepText({ name: 'segment', segment: 0, segments: 0 }, 'study')).toBe('自习')
  })

  it('shows what one service says when the other does not answer', async () => {
    const api = 'https://api.test'
    const scene = await readLive({ api, timeoutMs: 1000, fetch: fakeFetch({ [`${api}/v1/class/live`]: 503, [`${api}/v1/club/live`]: clubLive() }) })
    expect(scene.classReached).toBe(false)
    expect(scene.clubReached).toBe(true)
    expect(scene.students).toBe(3)
  })
})

describe('laying avatars out', () => {
  it('keeps every avatar inside its ground, each in its own spot', () => {
    const area: [number, number, number, number] = [0.1, 0.2, 0.3, 0.2]
    for (const n of [1, 2, 7, 23, 40]) {
      const at = slots(area, n, 1.6)
      expect(at).toHaveLength(n)
      for (const [x, y] of at) {
        expect(x).toBeGreaterThanOrEqual(0.1)
        expect(x).toBeLessThanOrEqual(0.4)
        expect(y).toBeGreaterThanOrEqual(0.2)
        expect(y).toBeLessThanOrEqual(0.4)
      }
      expect(new Set(at.map(([x, y]) => `${x.toFixed(4)},${y.toFixed(4)}`)).size).toBe(n)
    }
    expect(slots(area, 0, 1.6)).toEqual([])
  })
})

describe('the campus picture for the hour', () => {
  it('runs a scene past midnight and falls back to night', async () => {
    const { inHours, campusImage } = await import('../../../src/lib/live/scene')
    expect(inHours('18:00-06:00', 23 * 60)).toBe(true)
    expect(inHours('18:00-06:00', 5 * 60 + 59)).toBe(true)
    expect(inHours('18:00-06:00', 6 * 60)).toBe(false)
    expect(inHours('06:00-18:00', 12 * 60)).toBe(true)
    const scenes = { night: { image: 'campus/night.webp', hours: '18:00-06:00' }, day: { image: 'campus/day.webp', hours: '06:00-18:00' } }
    // 12:00 and 20:00 in Beijing.
    expect(campusImage(new Date('2026-11-27T04:00:00Z'), scenes)).toBe('/school-assets/campus/day.webp')
    expect(campusImage(new Date('2026-11-27T12:00:00Z'), scenes)).toBe('/school-assets/campus/night.webp')
    // No day picture yet: night all day.
    expect(campusImage(new Date('2026-11-27T04:00:00Z'), { ...scenes, day: null })).toBe('/school-assets/campus/night.webp')
  })
})

describe('avatars', () => {
  const palette = manifest.palette as Record<string, string>
  const types = manifest.aiTypes as Record<string, { avatars: { image: string }[]; default: { background: string; border: string } }>

  it('dress a named student in their type, in the colours their owner chose or the type defaults', () => {
    const scene = buildScene(
      parseClassLive(
        classLive([
          room({
            students: [
              named(1, 'a', 'claude', { background: 'pink', border: null }),
              named(2, 'b', 'robot9000', null),
              named(3, 'c', 'qwen', { background: 'neon', border: 'white' }),
            ],
          }),
        ]),
      ),
      undefined,
    )
    const by = (key: string) => look(scene.figures.find((f) => f.key === key)!)
    expect(by('s:1')).toEqual({ image: `/school-assets/${types.claude.avatars[0].image}`, background: palette.pink, border: palette[types.claude.default.border] })
    // A type the page does not know is drawn as the fallback type.
    expect(by('s:2').image).toBe(`/school-assets/${types[manifest.fallbackAiType].avatars[0].image}`)
    // A colour the page does not know falls back to the type's default.
    expect(by('s:3').background).toBe(palette[types.qwen.default.background])
    expect(by('s:3').border).toBe(palette.white)
  })

  it('give anonymous students, teachers and sparring bots their fixed characters', () => {
    const scene = buildScene(parseClassLive(classLive()), parseClubLive(clubLive()))
    for (const kind of ['anonymous', 'teacher', 'sparring'] as const) {
      const f = scene.figures.find((x) => x.kind === kind)!
      const c = manifest.characters[kind]
      expect(look(f)).toEqual({ image: `/school-assets/${c.avatars[0].image}`, background: palette[c.colors.background], border: palette[c.colors.border] })
    }
  })

  it('never carry a type for an anonymous student, whatever the school sends', () => {
    const club = parseClubLive(clubLive({ lobby: [{ ...anon('q1'), aiType: 'claude', avatar: { background: 'red', border: 'red' } }] }))!
    expect(club.lobby[0]).toMatchObject({ aiType: null, avatar: null })
  })
})

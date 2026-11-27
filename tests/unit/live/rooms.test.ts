import { describe, expect, it } from 'vitest'
import manifest from '../../../src/data/school-assets.json'
import { buildScene, parseClassLive, parseClubLive } from '../../../src/lib/live/live'
import { classroomSeats, depth, focusPoint, hashOf, HALL_TABLES, layoutFor, panelFor, parseHash, pictureFor, type View } from '../../../src/lib/live/rooms'

const named = (studentId: number, aiName = `机器人${studentId}`) => ({ anonymous: false, studentId, aiName, anonId: null, aiType: 'claude', avatar: null })
const anon = (anonId: string) => ({ anonymous: true, studentId: null, aiName: null, anonId, aiType: null, avatar: null })

const room = (classNo: number, students: unknown[], over: Record<string, unknown> = {}) => ({
  division: 'junior',
  slot: 'evening',
  classNo,
  teacher: { name: '李老师' },
  kind: 'lesson',
  title: '光的折射',
  step: { name: 'segment', segment: 2, segments: 4 },
  startsAt: '2026-11-27T12:30:00.000Z',
  endsAt: '2026-11-27T13:00:00.000Z',
  students,
  ...over,
})
const table = (n: number, over: Record<string, unknown> = {}) => ({
  tableId: `t${n}`,
  table: n,
  playing: true,
  gamesPlayed: 3,
  seats: [
    { seat: 0, player: { bot: false, person: named(100 + n * 3) }, online: true },
    { seat: 1, player: { bot: true, name: '陪练小一' }, online: true },
    { seat: 2, player: null, online: false },
  ],
  waiting: [],
  spectators: [named(200 + n)],
  ...over,
})

const scene = (rooms: unknown[], tables: unknown[] = [], open = true) =>
  buildScene(
    parseClassLive({ generatedAt: '2026-11-27T12:40:00.000Z', classrooms: rooms }),
    parseClubLive({ generatedAt: '2026-11-27T12:40:00.000Z', open, lobby: [], tables }),
  )

const NOON = new Date('2026-11-27T04:00:00Z')

describe('the views in the address', () => {
  it('reads and writes each view', () => {
    const views: View[] = [
      { kind: 'campus' },
      { kind: 'building', division: 'junior', room: null },
      { kind: 'building', division: 'senior', room: 'senior-evening-2' },
      { kind: 'hall' },
      { kind: 'table', tableId: 'Ab3_x' },
    ]
    for (const v of views) expect(parseHash(hashOf(v))).toEqual(v)
    expect(parseHash('')).toEqual({ kind: 'campus' })
    expect(parseHash('#nowhere')).toEqual({ kind: 'campus' })
  })
})

describe('inside a classroom', () => {
  it('seats the front rows first: the first seat is nearer the teacher than the last', () => {
    const seats = classroomSeats()
    const total = manifest.rooms.classroom.rows.reduce((n, r) => n + r.seats, 0)
    expect(seats).toHaveLength(total)
    const t = manifest.rooms.classroom.teacher
    const d = (p: [number, number]) => Math.hypot(p[0] - t[0], p[1] - t[1])
    expect(d(seats[0])).toBeLessThan(d(seats[seats.length - 1]))
  })

  it('puts the teacher at the lectern and the students by student number, the anonymous after', () => {
    const s = scene([room(1, [named(30), anon('zz'), named(12), named(21)])])
    const layout = layoutFor(s, { kind: 'building', division: 'junior', room: null }, NOON)
    expect(layout.view).toEqual({ kind: 'building', division: 'junior', room: 'junior-evening-1' })
    expect(layout.placed[0].figure.kind).toBe('teacher')
    expect(layout.placed[0].at).toEqual(manifest.rooms.classroom.teacher)
    expect(layout.placed.slice(1).map((p) => p.figure.number ?? p.figure.name)).toEqual(['#0012', '#0021', '#0030', '匿名同学'])
    const seats = classroomSeats()
    expect(layout.placed.slice(1).map((p) => p.at)).toEqual(seats.slice(0, 4))
    expect(layout.picture.image).toMatch(/^\/school-assets\/rooms\//)
  })

  it('shows the class the address names, or the first when it is gone, and no one when there is none', () => {
    const s = scene([room(1, [named(1)]), room(2, [named(2)])])
    expect(layoutFor(s, { kind: 'building', division: 'junior', room: 'junior-evening-2' }, NOON).placed.map((p) => p.figure.key)).toContain('s:2')
    expect(layoutFor(s, { kind: 'building', division: 'junior', room: 'junior-evening-9' }, NOON).view).toMatchObject({ room: 'junior-evening-1' })
    const none = layoutFor(s, { kind: 'building', division: 'primary', room: null }, NOON)
    expect(none.placed).toEqual([])
    expect(panelFor(s, none).info).toEqual(['小学部现在没有课。'])
  })
})

describe('in the club', () => {
  it('seats each player in their seat of the hall, the onlookers beside, a label over each table', () => {
    const s = scene([], [table(1), table(2)])
    const layout = layoutFor(s, { kind: 'hall' }, NOON)
    const spot = manifest.rooms.clubHall.tables[0]
    expect(layout.placed.find((p) => p.figure.key === 's:103')?.at).toEqual(spot.seats[0])
    expect(layout.placed.find((p) => p.figure.kind === 'sparring')?.at).toEqual(spot.seats[1])
    const [x, y, w, h] = spot.spectators
    const watcher = layout.placed.find((p) => p.figure.key === 's:201')!.at
    expect(watcher[0]).toBeGreaterThanOrEqual(x)
    expect(watcher[0]).toBeLessThanOrEqual(x + w)
    expect(watcher[1]).toBeGreaterThanOrEqual(y)
    expect(watcher[1]).toBeLessThanOrEqual(y + h)
    expect(layout.marks.map((m) => [m.name, m.tag, m.href])).toEqual([
      ['1 号桌', '第 4 局', '#club/t1'],
      ['2 号桌', '第 4 局', '#club/t2'],
    ])
  })

  it('draws as many tables as the hall has, and the panel lists them all', () => {
    const tables = Array.from({ length: HALL_TABLES + 2 }, (_, i) => table(i + 1))
    const s = scene([], tables)
    const layout = layoutFor(s, { kind: 'hall' }, NOON)
    expect(layout.marks).toHaveLength(HALL_TABLES)
    const panel = panelFor(s, layout)
    expect(panel.here?.links).toHaveLength(HALL_TABLES + 2)
    expect(panel.info.join('')).toContain('还有 2 桌')
  })

  it('shows a table up close, its seats in play throwing to the pile; a table that is gone falls back to the hall', () => {
    const s = scene([], [table(1)])
    const close = layoutFor(s, { kind: 'table', tableId: 't1' }, NOON)
    expect(close.placed.find((p) => p.figure.key === 's:103')?.at).toEqual(manifest.rooms.clubTable.seats[0])
    expect(close.pile).toEqual(manifest.rooms.clubTable.pile)
    expect(close.playing).toHaveLength(2)
    expect(layoutFor(s, { kind: 'table', tableId: 'gone' }, NOON).view).toEqual({ kind: 'hall' })
  })
})

describe('the panel', () => {
  it('says where the reader is, leads back up, and lists the places with their counts', () => {
    const s = scene([room(1, [named(1), named(2)]), room(2, [named(3)])], [table(1)])
    const inClass = panelFor(s, layoutFor(s, { kind: 'building', division: 'junior', room: 'junior-evening-2' }, NOON))
    expect(inClass.trail.map((t) => t.name)).toEqual(['全景', '初中部', '晚班·2 班'])
    expect(inClass.back).toEqual({ name: '全景', href: '#' })
    expect(inClass.here?.links.map((l) => [l.name, l.current])).toEqual([
      ['晚班·1 班', false],
      ['晚班·2 班', true],
    ])
    expect(inClass.places.map((p) => [p.name, p.tag, p.current])).toEqual([
      ['全景', '5', false],
      ['小学部', '', false],
      ['初中部', '3', true],
      ['高中部', '', false],
      ['社团活动中心', '2', false],
    ])

    const atTable = panelFor(s, layoutFor(s, { kind: 'table', tableId: 't1' }, NOON))
    expect(atTable.trail.map((t) => t.name)).toEqual(['全景', '社团活动中心', '1 号桌'])
    expect(atTable.back?.name).toBe('社团活动中心')

    const campus = panelFor(s, layoutFor(s, { kind: 'campus' }, NOON))
    expect(campus.back).toBeNull()
    expect(campus.here).toBeNull()
  })

  it('says when the club is closed', () => {
    const s = scene([], [], false)
    const panel = panelFor(s, layoutFor(s, { kind: 'hall' }, NOON))
    expect(panel.info).toEqual(['斗地主社在上课的时段关门，下课以后再开。'])
    expect(panel.places.find((p) => p.name === '社团活动中心')?.tag).toBe('关门')
  })
})

describe('pictures for the hour', () => {
  it('picks the scene whose hours hold the time in Beijing', () => {
    const r = { width: 10, height: 5, scenes: { morning: { image: 'a.webp', hours: '06:00-12:00' }, evening: { image: 'b.webp', hours: '18:00-06:00' } } }
    // 09:00 and 23:00 in Beijing; 14:00 is in neither, so the first scene.
    expect(pictureFor(r, new Date('2026-11-27T01:00:00Z')).image).toBe('/school-assets/a.webp')
    expect(pictureFor(r, new Date('2026-11-27T15:00:00Z')).image).toBe('/school-assets/b.webp')
    expect(pictureFor(r, new Date('2026-11-27T06:00:00Z')).image).toBe('/school-assets/a.webp')
  })
})

describe('going in and out', () => {
  it('knows how deep each view is', () => {
    expect([{ kind: 'campus' }, { kind: 'building', division: 'junior', room: null }, { kind: 'hall' }, { kind: 'table', tableId: 'x' }].map((v) => depth(v as View))).toEqual([0, 1, 1, 2])
  })

  it('zooms towards the building on the campus, and towards the table in the hall', () => {
    const s = scene([], [table(1), table(2)])
    const area = manifest.campus.locations.junior.area as number[]
    expect(focusPoint({ kind: 'campus' }, { kind: 'building', division: 'junior', room: null }, s)).toEqual([area[0] + area[2] / 2, area[1] + area[3] / 2])
    expect(focusPoint({ kind: 'hall' }, { kind: 'table', tableId: 't2' }, s)).toEqual(manifest.rooms.clubHall.tables[1].center)
    expect(focusPoint({ kind: 'hall' }, { kind: 'table', tableId: 'gone' }, s)).toEqual([0.5, 0.5])
  })
})

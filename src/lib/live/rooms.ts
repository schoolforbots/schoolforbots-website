// Where everyone goes on each picture of the live campus, as plain data the map
// draws (map.ts). There are four views:
//
// - the campus: everyone in the open ground of their place (the three divisions'
//   buildings, the club centre, the plaza);
// - a classroom: one class, the teacher at the lectern and the students in the
//   seats, by student number from the front rows back (anonymous students after);
// - the club hall: six tables at a time (more are paged through), each player in
//   their seat, the ones waiting and watching beside the table;
// - one table up close: its three seats, the pile in the middle, the onlookers.
//
// The views are named in the page's address (#junior/junior-evening-2, #club,
// #club/page/2, #club/<tableId>), so a view can be shared and the browser's back
// button leaves it.
import manifest from '../../data/school-assets.json'
import type { Division } from '../school/next-school-day'
import { inHours } from './scene'
import { classKey, className, divisionNames, PLACES, slotNames, stepText, type Classroom, type Figure, type PlaceKey, type Scene, type Table } from './live'

export type Point = [number, number]
export type Box = [number, number, number, number]

export type View =
  | { kind: 'campus' }
  /** A division's building: one of its classes, or the first one when `room` is null or gone. */
  | { kind: 'building'; division: Division; room: string | null }
  /** The club hall, its tables `page` at a time (1 is the first six). */
  | { kind: 'hall'; page: number }
  | { kind: 'table'; tableId: string }

const DIVISIONS: readonly Division[] = ['primary', 'junior', 'senior']

/** The view an address names; anything it does not name is the campus. */
export function parseHash(hash: string): View {
  const [where, which, page] = decodeURIComponent(hash.replace(/^#\/?/, '')).split('/')
  if ((DIVISIONS as readonly string[]).includes(where)) return { kind: 'building', division: where as Division, room: which || null }
  if (where === 'club') {
    if (which === 'page') return { kind: 'hall', page: Math.max(1, Number.parseInt(page ?? '1', 10) || 1) }
    return which ? { kind: 'table', tableId: which } : { kind: 'hall', page: 1 }
  }
  return { kind: 'campus' }
}

export function hashOf(view: View): string {
  switch (view.kind) {
    case 'campus':
      return '#'
    case 'building':
      return view.room ? `#${view.division}/${view.room}` : `#${view.division}`
    case 'hall':
      return view.page > 1 ? `#club/page/${view.page}` : '#club'
    case 'table':
      return `#club/${encodeURIComponent(view.tableId)}`
  }
}

// ---------------------------------------------------------------------------
// Pictures

interface Scenes {
  [name: string]: { image: string; hours: string } | null
}

export interface Picture {
  image: string
  width: number
  height: number
  /** An avatar's diameter, as a share of the picture's width. */
  avatarSize: number
}

type Room = { width: number; height: number; avatarSize: number; scenes: Scenes }
const rooms = manifest.rooms as unknown as {
  classroom: Room & { teacher: Point; rows: { from: Point; to: Point; seats: number }[] }
  clubHall: Room & { tables: { center: Point; seats: Point[]; spectators: Box }[] }
  clubTable: Room & { seats: Point[]; pile: Point; spectators: Box }
}
const campus = manifest.campus as unknown as { width: number; height: number; avatarSize?: number; scenes: Scenes; locations: Record<string, { label: string; labelAt: Point; area: Box | null; reserved?: boolean }> }

const minutesOf = (now: Date) => {
  const [h, m] = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .format(now)
    .split(':')
    .map(Number)
  return h * 60 + m
}

/** The picture of a place for the hour (Beijing time): the scene whose hours hold it, or the first scene with one. */
export function pictureFor(place: { width: number; height: number; avatarSize?: number; scenes: Scenes }, now: Date, fallbackSize = 0.022): Picture {
  const at = minutesOf(now)
  const scenes = Object.values(place.scenes).filter((s): s is { image: string; hours: string } => s !== null)
  const scene = scenes.find((s) => inHours(s.hours, at)) ?? scenes[0]
  return { image: `/school-assets/${scene.image}`, width: place.width, height: place.height, avatarSize: place.avatarSize ?? fallbackSize }
}

// ---------------------------------------------------------------------------
// Layouts

export interface Mark {
  /** Where the mark sits, and the view it opens. */
  at: Point
  href: string
  name: string
  tag: string
  title: string
  busy: boolean
}

export interface Layout {
  view: View
  picture: Picture
  placed: { figure: Figure; at: Point }[]
  extra: { count: number; at: Point }[]
  /** Places or tables to go into, drawn as labels over the picture. */
  marks: Mark[]
  /** For a table up close: where the cards are played, and from which seats. */
  pile: Point | null
  playing: Point[]
}

const isStudent = (f: Figure) => f.kind === 'student' || f.kind === 'anonymous'

/**
 * Where each of `n` avatars goes in `area` (fractions of the picture), in rows, with the picture's aspect `aspect`
 * (width over height), as the centre of each avatar.
 */
export function slots(area: Box, n: number, aspect: number): Point[] {
  if (n === 0) return []
  const [x, y, w, h] = area
  // Columns so the cells are about square on screen.
  const cols = Math.max(1, Math.min(n, Math.round(Math.sqrt((n * w * aspect) / h))))
  const rows = Math.ceil(n / cols)
  const out: Point[] = []
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / cols)
    const inRow = r === rows - 1 ? n - r * cols : cols
    const c = i % cols
    // A small stagger on odd rows, and the last row centred.
    const cx = x + (w * (c + 0.5 + (cols - inRow) / 2)) / cols + (r % 2 ? w / cols / 4 : 0)
    const cy = y + (h * (r + 0.5)) / rows
    out.push([Math.min(x + w, cx), cy])
  }
  return out
}

/**
 * How many avatars fit in `area` side by side without overlapping, at `size` (a share of the width) on a picture of
 * `aspect` (width over height). More than this and the last spot becomes a "+N".
 */
export function capacity(area: Box, size: number, aspect: number): number {
  const [, , w, h] = area
  return Math.max(1, Math.floor(w / size) * Math.floor((h * aspect) / size))
}

/** People in `area`, as many as fit, the rest folded into a "+N" in the last spot. */
function fill(layout: Layout, people: Figure[], area: Box): void {
  const aspect = layout.picture.width / layout.picture.height
  const max = capacity(area, layout.picture.avatarSize, aspect)
  const shown = people.length > max ? people.slice(0, max - 1) : people
  const at = slots(area, shown.length + (shown.length < people.length ? 1 : 0), aspect)
  shown.forEach((figure, i) => layout.placed.push({ figure, at: at[i] }))
  if (shown.length < people.length) layout.extra.push({ count: people.length - shown.length, at: at[shown.length] })
}

/** The order of students in a class: named ones by student number, then the anonymous ones. */
function byNumber(a: Figure, b: Figure): number {
  const n = (f: Figure) => (f.number ? Number(f.number.slice(1)) : Number.MAX_SAFE_INTEGER)
  return n(a) - n(b) || a.key.localeCompare(b.key)
}

export const CLASSROOM_AVATAR_SCALE = 2

/** The classroom's seats, front rows (nearest the teacher) first, each row from one end to the other. */
export function classroomSeats(): Point[] {
  const { teacher, rows } = rooms.classroom
  const mid = (r: { from: Point; to: Point }) => [(r.from[0] + r.to[0]) / 2, (r.from[1] + r.to[1]) / 2]
  const dist = (r: { from: Point; to: Point }) => Math.hypot(mid(r)[0] - teacher[0], mid(r)[1] - teacher[1])
  return [...rows]
    .sort((a, b) => dist(a) - dist(b))
    .flatMap((r) =>
      Array.from({ length: r.seats }, (_, k): Point => {
        const t = (k + 0.5) / r.seats
        return [r.from[0] + (r.to[0] - r.from[0]) * t, r.from[1] + (r.to[1] - r.from[1]) * t]
      }),
    )
}

function empty(view: View, picture: Picture): Layout {
  return { view, picture, placed: [], extra: [], marks: [], pile: null, playing: [] }
}

export function layoutCampus(scene: Scene, now: Date): Layout {
  const layout = empty({ kind: 'campus' }, pictureFor(campus, now, 0.025))
  for (const key of PLACES) {
    const area = campus.locations[key]?.area
    if (!area) continue
    const rank = (f: Figure) => (f.kind === 'teacher' ? 0 : 1)
    const here = scene.figures
      .filter((f) => f.place === key)
      .map((f, i) => ({ f, i }))
      .sort((a, b) => rank(a.f) - rank(b.f) || (a.f.tableId ?? '').localeCompare(b.f.tableId ?? '') || a.i - b.i)
      .map((x) => x.f)
    fill(layout, here, area)
  }
  return layout
}

/** The class a building view shows: the one it names, or else the division's first class on now; null when none is. */
export function classFor(scene: Scene, view: Extract<View, { kind: 'building' }>): Classroom | null {
  const rooms = scene.classrooms.filter((c) => c.division === view.division)
  return rooms.find((c) => classKey(c) === view.room) ?? rooms[0] ?? null
}

export function layoutClassroom(scene: Scene, view: Extract<View, { kind: 'building' }>, now: Date): Layout {
  const c = classFor(scene, view)
  // The classroom's seats are small on its picture: its avatars are drawn at twice the size the manifest suggests, a
  // little over a seat's width, so neighbours in a row overlap a little.
  const picture = pictureFor(rooms.classroom, now)
  const layout = empty({ ...view, room: c ? classKey(c) : null }, { ...picture, avatarSize: picture.avatarSize * CLASSROOM_AVATAR_SCALE })
  if (!c) return layout
  const here = scene.figures.filter((f) => f.room === classKey(c))
  const teacher = here.find((f) => f.role === 'teacher')
  if (teacher) layout.placed.push({ figure: teacher, at: rooms.classroom.teacher })
  const seats = classroomSeats()
  const pupils = here.filter((f) => f.role === 'pupil').sort(byNumber)
  const shown = pupils.length > seats.length ? pupils.slice(0, seats.length - 1) : pupils
  shown.forEach((figure, i) => layout.placed.push({ figure, at: seats[i] }))
  if (shown.length < pupils.length) layout.extra.push({ count: pupils.length - shown.length, at: seats[seats.length - 1] })
  return layout
}

/** The tables in the order they are numbered. */
const tablesInOrder = (scene: Scene) => [...scene.tables].sort((a, b) => a.table - b.table)

export const HALL_TABLES = rooms.clubHall.tables.length

/** How many pages of tables the hall has (one even when there are none). */
export const hallPages = (scene: Scene) => Math.max(1, Math.ceil(scene.tables.length / HALL_TABLES))

/** The page of the hall a table is on; 1 for a table that is gone. */
export function pageOf(scene: Scene, tableId: string): number {
  const i = tablesInOrder(scene).findIndex((t) => t.tableId === tableId)
  return i < 0 ? 1 : Math.floor(i / HALL_TABLES) + 1
}

/** The tables on a page of the hall, the page kept within the pages there are. */
function onPage(scene: Scene, page: number): { page: number; tables: Table[] } {
  const p = Math.min(Math.max(1, page), hallPages(scene))
  return { page: p, tables: tablesInOrder(scene).slice((p - 1) * HALL_TABLES, p * HALL_TABLES) }
}

export function tableTag(t: Table): string {
  return t.playing ? `第 ${t.gamesPlayed + 1} 局` : '等开局'
}

export function layoutHall(scene: Scene, page: number, now: Date): Layout {
  const shown = onPage(scene, page)
  const layout = empty({ kind: 'hall', page: shown.page }, pictureFor(rooms.clubHall, now))
  shown.tables.forEach((t, i) => {
      const spot = rooms.clubHall.tables[i]
      const here = scene.figures.filter((f) => f.tableId === t.tableId)
      for (const f of here) if (f.role === 'seated' && f.seat !== null && spot.seats[f.seat]) layout.placed.push({ figure: f, at: spot.seats[f.seat] })
      fill(layout, here.filter((f) => f.role === 'waiting' || f.role === 'watching'), spot.spectators)
      const watching = here.filter((f) => f.role !== 'seated').length
      layout.marks.push({
        at: [spot.center[0], spot.center[1] - 0.075],
        href: hashOf({ kind: 'table', tableId: t.tableId }),
        name: `${t.table} 号桌`,
        tag: tableTag(t),
        title: `${t.table} 号桌 · ${tableTag(t)}${watching ? ` · ${watching} 名在旁边` : ''}`,
        busy: t.playing,
      })
    })
  return layout
}

export function layoutTable(scene: Scene, tableId: string, now: Date): Layout {
  const layout = empty({ kind: 'table', tableId }, pictureFor(rooms.clubTable, now))
  const t = scene.tables.find((x) => x.tableId === tableId)
  if (!t) return layout
  const here = scene.figures.filter((f) => f.tableId === tableId)
  for (const f of here) {
    if (f.role === 'seated' && f.seat !== null && rooms.clubTable.seats[f.seat]) {
      layout.placed.push({ figure: f, at: rooms.clubTable.seats[f.seat] })
      if (t.playing) layout.playing.push(rooms.clubTable.seats[f.seat])
    }
  }
  fill(layout, here.filter((f) => f.role === 'waiting' || f.role === 'watching'), rooms.clubTable.spectators)
  layout.pile = rooms.clubTable.pile
  return layout
}

/** The layout of `view`: a table or class that is gone falls back to the hall or the division's first class. */
export function layoutFor(scene: Scene, view: View, now: Date): Layout {
  switch (view.kind) {
    case 'campus':
      return layoutCampus(scene, now)
    case 'building':
      return layoutClassroom(scene, view, now)
    case 'hall':
      return layoutHall(scene, view.page, now)
    case 'table':
      return scene.tables.some((t) => t.tableId === view.tableId) ? layoutTable(scene, view.tableId, now) : layoutHall(scene, 1, now)
  }
}

// ---------------------------------------------------------------------------
// The panel: where the reader is, the way back, the places, and what can be seen in this one.

export interface PanelLink {
  href: string
  name: string
  tag: string
  current: boolean
}

export interface Panel {
  /** Where the reader is, from the campus down: each step but the last is a link. */
  trail: { name: string; href: string }[]
  /** The view one level up; null on the campus. */
  back: { name: string; href: string } | null
  /** Every place one can go into, with how many students are there. */
  places: PanelLink[]
  /** What there is to see here: the division's classes, or the club's tables on this page of the hall. */
  here: { title: string; count: string; links: PanelLink[] } | null
  /** Turning the hall's pages, when it has more than one. */
  pager: { page: number; pages: number; prev: string | null; next: string | null } | null
  /** A line or two about what is shown. */
  info: string[]
}

const count = (scene: Scene, place: PlaceKey) => scene.figures.filter((f) => f.place === place && isStudent(f)).length

export function panelFor(scene: Scene, layout: Layout): Panel {
  const view = layout.view
  const campusStep = { name: '全景', href: hashOf({ kind: 'campus' }) }
  const places: PanelLink[] = [
    { href: '#', name: '全景', tag: String(scene.students || ''), current: view.kind === 'campus' },
    ...DIVISIONS.map((d) => ({
      href: hashOf({ kind: 'building', division: d, room: null }),
      name: divisionNames[d],
      tag: scene.classReached ? String(count(scene, d) || '') : '—',
      current: view.kind === 'building' && view.division === d,
    })),
    {
      href: hashOf({ kind: 'hall', page: 1 }),
      name: '社团活动中心',
      tag: !scene.clubReached ? '—' : scene.clubOpen === false ? '关门' : String(count(scene, 'club') || ''),
      current: view.kind === 'hall' || view.kind === 'table',
    },
  ]

  if (view.kind === 'campus') {
    return { trail: [campusStep], back: null, places, here: null, pager: null, info: ['点一栋楼或社团活动中心，进去看看。'] }
  }

  if (view.kind === 'building') {
    const building = { name: divisionNames[view.division], href: hashOf({ ...view, room: null }) }
    const classes = scene.classrooms.filter((c) => c.division === view.division)
    const c = classes.find((x) => classKey(x) === view.room) ?? null
    const here = classes.length
      ? {
          title: '这个学部正在上课的班',
          count: `共 ${classes.length} 个`,
          links: classes.map((x) => ({
            href: hashOf({ kind: 'building', division: view.division, room: classKey(x) }),
            name: `${slotNames[x.slot]}·${x.classNo} 班`,
            tag: `${stepText(x.step, x.kind)} · ${x.students.length} 人`,
            current: c !== null && classKey(x) === classKey(c),
          })),
        }
      : null
    const info = !scene.classReached
      ? ['暂时看不到上课的情况。']
      : c
        ? [className(c), [c.kind === 'study' ? '自习' : c.title ?? '备课中', stepText(c.step, c.kind), `${c.students.length} 名在线`].join(' · ')]
        : [`${divisionNames[view.division]}现在没有课。`]
    return {
      trail: [campusStep, ...(c ? [building, { name: `${slotNames[c.slot]}·${c.classNo} 班`, href: hashOf(view) }] : [building])],
      back: { name: '全景', href: campusStep.href },
      places,
      here,
      pager: null,
      info,
    }
  }

  // The hall, or a table up close: the tables of the page it is on, and the pages.
  const tables = tablesInOrder(scene)
  const page = view.kind === 'hall' ? view.page : pageOf(scene, view.tableId)
  const shown = onPage(scene, page)
  const pages = hallPages(scene)
  const hallStep = { name: '社团活动中心', href: hashOf({ kind: 'hall', page: shown.page }) }
  const here = tables.length
    ? {
        title: '牌桌',
        count: pages > 1 ? `共 ${tables.length} 张 · 第 ${shown.page}/${pages} 页` : `共 ${tables.length} 张`,
        links: shown.tables.map((t) => ({
          href: hashOf({ kind: 'table', tableId: t.tableId }),
          name: `${t.table} 号桌`,
          tag: `${tableTag(t)} · ${t.spectators.length + t.waiting.length} 人观战`,
          current: view.kind === 'table' && view.tableId === t.tableId,
        })),
      }
    : null
  const pager =
    pages > 1
      ? {
          page: shown.page,
          pages,
          prev: shown.page > 1 ? hashOf({ kind: 'hall', page: shown.page - 1 }) : null,
          next: shown.page < pages ? hashOf({ kind: 'hall', page: shown.page + 1 }) : null,
        }
      : null

  if (view.kind === 'table') {
    const t = tables.find((x) => x.tableId === view.tableId)!
    return {
      trail: [campusStep, hallStep, { name: `${t.table} 号桌`, href: hashOf(view) }],
      back: { name: '社团活动中心', href: hallStep.href },
      places,
      here,
      pager,
      info: [`斗地主 · ${tableTag(t)}${t.gamesPlayed ? ` · 已经打完 ${t.gamesPlayed} 局` : ''}`, `${t.spectators.length} 名在旁边看${t.waiting.length ? `，${t.waiting.length} 名等座位` : ''}`],
    }
  }

  const info = !scene.clubReached
    ? ['暂时看不到社团的情况。']
    : scene.clubOpen === false
      ? ['斗地主社在上课的时段关门，下课以后再开。']
      : tables.length
        ? [`${tables.length} 张牌桌 · ${count(scene, 'club')} 名在社团`, ...(pages > 1 ? [`大厅一次摆 ${HALL_TABLES} 张，翻页看其余的。`] : [])]
        : ['开着门，还没有人开桌。']
  return { trail: [campusStep, hallStep], back: { name: '全景', href: campusStep.href }, places, here, pager, info }
}

/**
 * The title over a room, so rooms drawn on the same picture can be told apart: the class (初中部·晚班·2 班), the hall
 * (with its page when it has several), the table. None on the campus, and none for a building with no class on.
 */
export function roomTitle(scene: Scene, layout: Layout): string | null {
  const view = layout.view
  if (view.kind === 'building') {
    const c = classFor(scene, view)
    return c ? className(c) : `${divisionNames[view.division]} · 现在没有课`
  }
  if (view.kind === 'hall') {
    const pages = hallPages(scene)
    return pages > 1 ? `社团活动中心 · 第 ${view.page}/${pages} 页` : '社团活动中心'
  }
  if (view.kind === 'table') {
    const t = scene.tables.find((x) => x.tableId === view.tableId)
    return t ? `斗地主社 · ${t.table} 号桌` : '斗地主社'
  }
  return null
}

// ---------------------------------------------------------------------------
// Going in and out: how deep a view is, and where in the outer picture the inner one is.

/** The campus is 0; a classroom and the club hall 1; a table up close 2. */
export function depth(view: View): number {
  return view.kind === 'campus' ? 0 : view.kind === 'table' ? 2 : 1
}

const centre = (b: Box): Point => [b[0] + b[2] / 2, b[1] + b[3] / 2]

/**
 * Where `inner` is on the picture of `outer`, to zoom towards when going in and away from when coming out: a division's
 * building or the club centre on the campus, a table in the hall (the hall's middle for a table it has no room to draw).
 */
export function focusPoint(outer: View, inner: View, scene: Scene): Point {
  if (outer.kind === 'campus') {
    const key = inner.kind === 'building' ? inner.division : 'club'
    const area = campus.locations[key]?.area
    return area ? centre(area) : [0.5, 0.5]
  }
  if (outer.kind === 'hall' && inner.kind === 'table') {
    const i = tablesInOrder(scene).findIndex((t) => t.tableId === inner.tableId)
    // Only a table on the page the hall shows has a spot in it.
    const spot = i >= 0 && Math.floor(i / HALL_TABLES) + 1 === outer.page ? rooms.clubHall.tables[i % HALL_TABLES] : undefined
    return spot ? spot.center : [0.5, 0.5]
  }
  return [0.5, 0.5]
}

// The live campus, read in the browser from the school's two snapshots, each made
// every five seconds and the same for everyone:
//
// - GET /v1/class/live: the classrooms with their doors open, where each class is
//   in its lesson, and the students connected to it;
// - GET /v1/club/live: whether the doudizhu club is open, who is in its lobby (the
//   plaza on the map), and each table: who sits at it, who waits, who watches.
//
// A student shows their AI's name and student number, or, if their owner made them
// anonymous, neither: only that an anonymous student is there. The clubs close
// while lessons are on, so no student is in both. This file reads the two answers
// and puts them together into one scene: who is where, and what each place says.
import { fetchJson } from '../status/fetch-json'
import type { Division, Slot } from '../school/next-school-day'

export type StepName = 'doors' | 'opening' | 'segment' | 'qa' | 'call_on' | 'dismissal'

export interface LivePerson {
  anonymous: boolean
  studentId: number | null
  aiName: string | null
  /** For an anonymous student: a random id that lasts while they stay connected to the one service. */
  anonId: string | null
  /** The robot type the owner chose (deepseek, claude, ...); null for an anonymous student. */
  aiType: string | null
  /** The avatar's colours, names from the palette; null (or a null colour) means the type's default. */
  avatar: AvatarColors | null
}

export interface AvatarColors {
  background: string | null
  border: string | null
}

export interface Classroom {
  division: Division
  slot: Slot
  classNo: number
  teacher: { name: string }
  kind: 'lesson' | 'study'
  title: string | null
  step: { name: StepName; segment: number | null; segments: number | null }
  startsAt: string
  endsAt: string
  students: LivePerson[]
}

export type Seat = { kind: 'student'; person: LivePerson; online: boolean } | { kind: 'bot'; name: string } | { kind: 'empty' }

export interface Table {
  tableId: string
  table: number
  playing: boolean
  gamesPlayed: number
  seats: Seat[]
  waiting: LivePerson[]
  spectators: LivePerson[]
}

export interface ClassLive {
  generatedAt: string
  classrooms: Classroom[]
}

export interface ClubLive {
  generatedAt: string
  open: boolean
  lobby: LivePerson[]
  tables: Table[]
}

const DIVISIONS: readonly Division[] = ['primary', 'junior', 'senior']
const SLOTS: readonly Slot[] = ['morning', 'afternoon', 'evening']
const STEPS: readonly StepName[] = ['doors', 'opening', 'segment', 'qa', 'call_on', 'dismissal']

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const isTime = (v: unknown): v is string => typeof v === 'string' && !Number.isNaN(Date.parse(v))
const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0
const isCountOrNull = (v: unknown): v is number | null => v === null || isCount(v)
const isStringOrNull = (v: unknown): v is string | null => v === null || typeof v === 'string'

function parsePerson(v: unknown): LivePerson | undefined {
  if (!isObject(v) || typeof v.anonymous !== 'boolean') return undefined
  if (v.anonymous) {
    if (typeof v.anonId !== 'string' || v.anonId === '') return undefined
    return { anonymous: true, studentId: null, aiName: null, anonId: v.anonId, aiType: null, avatar: null }
  }
  if (!isCount(v.studentId) || typeof v.aiName !== 'string') return undefined
  // The type and colours are for drawing only: one the page cannot read is drawn as the default, not refused.
  const aiType = typeof v.aiType === 'string' ? v.aiType : null
  const a = v.avatar
  const avatar = isObject(a)
    ? { background: typeof a.background === 'string' ? a.background : null, border: typeof a.border === 'string' ? a.border : null }
    : null
  return { anonymous: false, studentId: v.studentId, aiName: v.aiName, anonId: null, aiType, avatar }
}

function parsePeople(v: unknown): LivePerson[] | undefined {
  if (!Array.isArray(v)) return undefined
  const out: LivePerson[] = []
  for (const p of v) {
    const person = parsePerson(p)
    if (!person) return undefined
    out.push(person)
  }
  return out
}

export function parseClassLive(body: unknown): ClassLive | undefined {
  if (!isObject(body) || !isTime(body.generatedAt) || !Array.isArray(body.classrooms)) return undefined
  const classrooms: Classroom[] = []
  for (const c of body.classrooms) {
    if (!isObject(c) || !DIVISIONS.includes(c.division as Division) || !SLOTS.includes(c.slot as Slot)) return undefined
    if (!isCount(c.classNo) || !isObject(c.teacher) || typeof c.teacher.name !== 'string') return undefined
    if ((c.kind !== 'lesson' && c.kind !== 'study') || !isStringOrNull(c.title)) return undefined
    if (!isObject(c.step) || !STEPS.includes(c.step.name as StepName)) return undefined
    const segment = c.step.segment ?? null
    const segments = c.step.segments ?? null
    if (!isCountOrNull(segment) || !isCountOrNull(segments)) return undefined
    if (!isTime(c.startsAt) || !isTime(c.endsAt)) return undefined
    const students = parsePeople(c.students)
    if (!students) return undefined
    classrooms.push({
      division: c.division as Division,
      slot: c.slot as Slot,
      classNo: c.classNo,
      teacher: { name: c.teacher.name },
      kind: c.kind,
      title: c.title,
      step: { name: c.step.name as StepName, segment, segments },
      startsAt: c.startsAt,
      endsAt: c.endsAt,
      students,
    })
  }
  return { generatedAt: body.generatedAt, classrooms }
}

// A seat's `player`: null when empty, `{ bot: true, name }` for a sparring bot, `{ bot: false, person }` for a student.
function parseSeat(v: unknown): Seat | undefined {
  if (!isObject(v)) return undefined
  const p = v.player
  if (p === null) return { kind: 'empty' }
  if (!isObject(p)) return undefined
  if (p.bot === true) return typeof p.name === 'string' ? { kind: 'bot', name: p.name } : undefined
  const person = p.bot === false ? parsePerson(p.person) : undefined
  if (!person || typeof v.online !== 'boolean') return undefined
  return { kind: 'student', person, online: v.online }
}

export function parseClubLive(body: unknown): ClubLive | undefined {
  if (!isObject(body) || !isTime(body.generatedAt) || typeof body.open !== 'boolean') return undefined
  const lobby = parsePeople(body.lobby)
  if (!lobby || !Array.isArray(body.tables)) return undefined
  const tables: Table[] = []
  for (const t of body.tables) {
    if (!isObject(t) || typeof t.tableId !== 'string' || !isCount(t.table)) return undefined
    if (typeof t.playing !== 'boolean' || !isCount(t.gamesPlayed) || !Array.isArray(t.seats)) return undefined
    const seats: Seat[] = []
    for (const s of t.seats) {
      const seat = parseSeat(s)
      if (!seat) return undefined
      seats.push(seat)
    }
    const waiting = parsePeople(t.waiting)
    const spectators = parsePeople(t.spectators)
    if (!waiting || !spectators) return undefined
    tables.push({ tableId: t.tableId, table: t.table, playing: t.playing, gamesPlayed: t.gamesPlayed, seats, waiting, spectators })
  }
  return { generatedAt: body.generatedAt, open: body.open, lobby, tables }
}

// ---------------------------------------------------------------------------
// The scene: everyone on the map, and what each place says.

export type PlaceKey = Division | 'doudizhu' | 'plaza'
export const PLACES: readonly PlaceKey[] = ['primary', 'junior', 'senior', 'doudizhu', 'plaza']

export type FigureKind = 'student' | 'anonymous' | 'teacher' | 'sparring'

export interface Figure {
  /**
   * Who this is, the same from one snapshot to the next: a named student by their student number (the same in class
   * and in the club, so they can walk from one to the other); an anonymous student by the service and their anonId;
   * a teacher by their class; a sparring bot by its table and seat.
   */
  key: string
  kind: FigureKind
  place: PlaceKey
  /** The name to show: the AI's name, 匿名同学, the teacher's or the bot's name. */
  name: string
  /** `#0012`, for a named student only. */
  number: string | null
  /** What they are doing, in a few words. */
  status: string
  /** The table they are at, for the people of the club. */
  tableId: string | null
  /** A named student's robot type and colours, to pick their avatar; null for everyone else. */
  aiType: string | null
  avatar: AvatarColors | null
}

export interface Scene {
  figures: Figure[]
  classrooms: Classroom[]
  tables: Table[]
  /** Whether each service answered; a place whose service did not shows no one. */
  classReached: boolean
  clubReached: boolean
  clubOpen: boolean | null
  /** Students on the map (teachers and sparring bots not counted). */
  students: number
  generatedAt: string | null
}

export const studentNumber = (id: number) => `#${String(id).padStart(4, '0')}`

export const slotNames: Record<Slot, string> = { morning: '上午班', afternoon: '下午班', evening: '晚班' }
export const divisionNames: Record<Division, string> = { primary: '小学部', junior: '初中部', senior: '高中部' }
export const placeNames: Record<PlaceKey, string> = { ...divisionNames, doudizhu: '斗地主社', plaza: '广场' }

export function stepText(step: Classroom['step'], kind: Classroom['kind']): string {
  switch (step.name) {
    case 'doors':
      return '等上课'
    case 'opening':
      return '开场'
    case 'segment':
      // A study hall has no segments (`segments` is 0).
      if (kind === 'study' || !step.segments) return kind === 'study' ? '自习' : '讲课'
      return step.segment !== null ? `讲第 ${step.segment}/${step.segments} 段` : '讲课'
    case 'qa':
      return '答问'
    case 'call_on':
      return '点名回答'
    case 'dismissal':
      return '下课'
  }
}

export const className = (c: Pick<Classroom, 'division' | 'slot' | 'classNo'>) =>
  `${divisionNames[c.division]}·${slotNames[c.slot]}·${c.classNo} 班`

function studentFigure(p: LivePerson, service: 'class' | 'club', place: PlaceKey, status: string, tableId: string | null): Figure {
  if (p.anonymous) return { key: `anon:${service}:${p.anonId}`, kind: 'anonymous', place, name: '匿名同学', number: null, status, tableId, aiType: null, avatar: null }
  return { key: `s:${p.studentId}`, kind: 'student', place, name: p.aiName ?? '', number: studentNumber(p.studentId ?? 0), status, tableId, aiType: p.aiType, avatar: p.avatar }
}

export function buildScene(cls: ClassLive | undefined, club: ClubLive | undefined): Scene {
  const figures: Figure[] = []
  const classrooms = cls?.classrooms ?? []
  for (const c of classrooms) {
    const where = className(c)
    const step = stepText(c.step, c.kind)
    figures.push({ key: `teacher:${c.division}:${c.slot}:${c.classNo}`, kind: 'teacher', place: c.division, name: c.teacher.name, number: null, status: `${where}的老师`, tableId: null, aiType: null, avatar: null })
    for (const p of c.students) figures.push(studentFigure(p, 'class', c.division, `在${where}上课 · ${step}`, null))
  }
  const tables = club?.tables ?? []
  if (club) {
    for (const p of club.lobby) figures.push(studentFigure(p, 'club', 'plaza', '在广场闲逛', null))
    for (const t of tables) {
      const game = t.playing ? `在打第 ${t.gamesPlayed + 1} 局` : '等开局'
      t.seats.forEach((s, i) => {
        if (s.kind === 'student') figures.push(studentFigure(s.person, 'club', 'doudizhu', s.online ? `${t.table} 号桌 · ${game}` : `${t.table} 号桌 · 暂时离开`, t.tableId))
        else if (s.kind === 'bot') figures.push({ key: `bot:${t.tableId}:${i}`, kind: 'sparring', place: 'doudizhu', name: s.name, number: null, status: `${t.table} 号桌的陪练 · ${game}`, tableId: t.tableId, aiType: null, avatar: null })
      })
      for (const p of t.waiting) figures.push(studentFigure(p, 'club', 'doudizhu', `${t.table} 号桌 · 等座位`, t.tableId))
      for (const p of t.spectators) figures.push(studentFigure(p, 'club', 'doudizhu', `${t.table} 号桌 · 在旁边看`, t.tableId))
    }
  }
  const times = [cls?.generatedAt, club?.generatedAt].filter((t): t is string => t !== undefined)
  return {
    figures,
    classrooms,
    tables,
    classReached: cls !== undefined,
    clubReached: club !== undefined,
    clubOpen: club ? club.open : null,
    students: figures.filter((f) => f.kind === 'student' || f.kind === 'anonymous').length,
    generatedAt: times.length ? times.sort()[0] : null,
  }
}

/** What each place's label says under its name. */
export function placeSummary(scene: Scene, place: PlaceKey): string {
  const here = scene.figures.filter((f) => f.place === place && (f.kind === 'student' || f.kind === 'anonymous')).length
  if (place === 'plaza') {
    if (!scene.clubReached) return '暂时看不到'
    return here ? `${here} 名在闲逛` : '现在没有人'
  }
  if (place === 'doudizhu') {
    if (!scene.clubReached) return '暂时看不到'
    if (scene.clubOpen === false) return '上课时段关门'
    const playing = scene.tables.filter((t) => t.playing).length
    if (!scene.tables.length) return '开着门 · 还没有人开桌'
    return `${playing} 桌在打 · ${here} 名在社团`
  }
  if (!scene.classReached) return '暂时看不到'
  const rooms = scene.classrooms.filter((c) => c.division === place)
  if (!rooms.length) return '现在没有课'
  const title = rooms.find((c) => c.title)?.title
  return [`${rooms.length} 个班`, `${here} 名在上课`, title].filter(Boolean).join(' · ')
}

export interface LiveSources {
  api: string
  timeoutMs: number
  fetch: typeof fetch
}

export async function readLive(src: LiveSources): Promise<Scene> {
  const get = (path: string) => fetchJson(`${src.api}${path}`, { fetch: src.fetch, timeoutMs: src.timeoutMs }).catch(() => ({ kind: 'unreachable' as const }))
  const [cls, club] = await Promise.all([get('/v1/class/live'), get('/v1/club/live')])
  return buildScene(cls.kind === 'ok' ? parseClassLive(cls.body) : undefined, club.kind === 'ok' ? parseClubLive(club.body) : undefined)
}

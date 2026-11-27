// A stand-in for the school's public endpoints that the site reads in the
// browser, for previewing the site before the real ones exist or when a state
// is hard to reach (a lesson under way, a maintenance). It answers in the shapes
// of schoolforbots-private/docs/superpowers/specs/2026-11-22-public-notices-and-next-lesson.md,
// with the same CORS header as the school. Everything it says is made up.
//
//   npm run mock:school                    # the next school day is tomorrow (port 4330)
//   MOCK_STATE=live npm run mock:school    # a lesson under way
//   MOCK_STATE=study | none | down         # weekend study, a break with no day set, school unreachable
//   MOCK_STATE=campus npm run mock:school  # the live campus with classes and the club both busy (not a real
//                                          # moment: the club closes during lessons, but it shows every place)
//
// Anything else the site reads (the school rules and their diffs) is passed on to the
// real school (MOCK_UPSTREAM, https://api.schoolforbots.org by default), so the rest of
// the site works as usual; in the down state nothing answers.
//
// Then build the site against it and preview:
//   PUBLIC_SCHOOL_API=http://localhost:4330 npm run build && npm run preview
import { createServer } from 'node:http'

const port = Number(process.env.MOCK_PORT ?? 4330)
const state = process.env.MOCK_STATE ?? 'next'
const upstream = (process.env.MOCK_UPSTREAM ?? 'https://api.schoolforbots.org').replace(/\/$/, '')

// Moments as the school writes them: ISO 8601 in UTC (2026-11-24T02:00:00.000Z).
const iso = (ms) => new Date(ms).toISOString()
// A date as the school writes it: YYYY-MM-DD in the school's time zone (Beijing time).
const day = (ms) => new Date(ms + 8 * 3600 * 1000).toISOString().slice(0, 10)
const HOUR = 3600 * 1000

const MIN = 60 * 1000
const slot = (name, start) => ({
  slot: name,
  startsAt: iso(start),
  endsAt: iso(start + 30 * MIN),
  doorsOpenAt: iso(start - 15 * MIN),
})

function nextSchoolDay() {
  if (state === 'none') return { day: null }
  const now = Date.now()
  // A lesson under way: the afternoon slot started 10 minutes ago. Otherwise tomorrow, at 10:00, 15:00 and 20:00
  // Beijing time.
  const live = state === 'live' || state === 'campus'
  const midnight = Math.floor((now + 8 * HOUR) / (24 * HOUR)) * 24 * HOUR - 8 * HOUR + (live ? 0 : 24 * HOUR)
  const afternoon = live ? now - 10 * MIN : midnight + 15 * HOUR
  const study = state === 'study'
  return {
    day: {
      date: day(afternoon),
      kind: study ? 'study' : 'lesson',
      slots: [slot('morning', afternoon - 5 * HOUR), slot('afternoon', afternoon), slot('evening', afternoon + 5 * HOUR)],
      divisions: [
        { division: 'primary', kind: study ? 'study' : 'lesson', subject: study ? null : '科学', title: study ? null : '为什么秋天叶子会变黄' },
        { division: 'junior', kind: study ? 'study' : 'lesson', subject: study ? null : '科学', title: study ? null : '光的折射' },
        { division: 'senior', kind: study ? 'study' : 'lesson', subject: study ? null : '科学', title: null },
      ],
    },
  }
}

function notices() {
  const now = Date.now()
  return {
    notices: [
      {
        id: 3,
        title: 'DSH 插件发布，DSH 里的 AI 可以报名入学了',
        body: 'DSH（DeepSeek Harness）的机器人网校插件发布了。\n\n装好插件以后，机器人的主人可以在 DSH 里给 AI 报名，也可以让 AI 代办。安装步骤见[在 DSH 里装插件](https://www.schoolforbots.org/docs/enroll/dsh/)。',
        kind: 'general',
        window: null,
        publishedAt: iso(now - 2 * HOUR),
        updatedAt: null,
      },
      {
        id: 2,
        title: '凌晨维护，社团暂停一小时',
        body: '维护期间：\n\n- 斗地主社关门，打到一半的牌局由托管打完，**战绩照常记录**\n- 报名、查在校记录暂停\n\n维护不影响白天的课。',
        kind: 'maintenance',
        window: { startsAt: iso(now + 30 * HOUR), endsAt: iso(now + 31 * HOUR) },
        publishedAt: iso(now - 26 * HOUR),
        updatedAt: iso(now - 20 * HOUR),
      },
      {
        id: 1,
        title: '斗地主社开张了',
        body: '课余时间，入了社的 AI 可以去斗地主社打牌。入社要机器人的主人在插件里同意。',
        kind: 'general',
        window: null,
        publishedAt: iso(now - 4 * 24 * HOUR),
        updatedAt: null,
      },
    ],
    more: false,
  }
}

const calendar = () => ({
  today: day(Date.now()),
  state: 'in_term',
  breakName: null,
  reopensOn: null,
  openingDay: '2026-11-01',
  maintenance: null,
})


// The school's numbers (GET /v1/school/stats).
const stats = () => ({
  generatedAt: iso(Date.now()),
  students: { total: 86, byDivision: { primary: 31, junior: 34, senior: 21 }, bySlot: { morning: 18, afternoon: 25, evening: 43 } },
  owners: 71,
  classes: {
    total: 9,
    groups: [
      { slot: 'morning', division: 'junior', classes: 1, students: 18 },
      { slot: 'afternoon', division: 'primary', classes: 1, students: 12 },
      { slot: 'afternoon', division: 'junior', classes: 1, students: 13 },
      { slot: 'evening', division: 'primary', classes: 2, students: 19 },
      { slot: 'evening', division: 'junior', classes: 2, students: 3 },
      { slot: 'evening', division: 'senior', classes: 2, students: 21 },
    ],
  },
  clubs: { doudizhu: { gamesToday: 57 } },
})

// The live campus (GET /v1/class/live and GET /v1/club/live). A made-up pool of students who drift between the
// plaza and the tables every snapshot (five seconds), some of them anonymous.
const NAMES = ['小鲸', '阿蓝', '豆豆', '星河', '米粒', '团子', '小橙', '阿布', '可乐', '年糕', '芝麻', '饺子', '布丁', '雪球', '小满', '七七', '阿木', '桃桃', '石头', '栗子', '包子', '花卷', '麦穗', '橘子', '小葵', '圆圆', '泡芙', '丸子', '青柠', '糯米']
const pool = NAMES.map((aiName, i) => ({ studentId: 12 + i * 7, aiName, anonymous: i % 9 === 4 }))
const person = (s) => (s.anonymous ? { anonymous: true, studentId: null, aiName: null, anonId: `anon${s.studentId}xyzab`.slice(0, 12) } : { anonymous: false, studentId: s.studentId, aiName: s.aiName, anonId: null })
const tick = () => Math.floor(Date.now() / 5000)
// A shuffle of the pool that changes a little every snapshot.
function shuffled(seed) {
  const order = pool.map((s, i) => ({ s, k: Math.sin(i * 12.9898 + Math.floor(seed / 3) * 78.233 + (i % 4 === seed % 4 ? seed : 0)) }))
  return order.sort((a, b) => a.k - b.k).map((o) => o.s)
}

function classLive() {
  const lessons = state === 'live' || state === 'campus'
  if (!lessons) return { generatedAt: iso(Date.now()), classrooms: [] }
  const now = Date.now()
  const steps = [{ name: 'opening' }, { name: 'segment', segment: 1, segments: 4 }, { name: 'segment', segment: 2, segments: 4 }, { name: 'qa' }, { name: 'call_on' }]
  const step = (i) => ({ segment: null, segments: null, ...steps[(Math.floor(tick() / 6) + i) % steps.length] })
  const room = (division, classNo, title, from, to, i) => ({
    division, slot: 'afternoon', classNo, teacher: { name: `${['王', '李', '陈'][i % 3]}老师` }, kind: 'lesson', title,
    step: step(i), startsAt: iso(now - 10 * MIN), endsAt: iso(now + 20 * MIN),
    students: pool.slice(from, to).map(person),
  })
  return {
    generatedAt: iso(now),
    classrooms: state === 'campus'
      ? [room('primary', 1, '为什么秋天叶子会变黄', 0, 6, 0), room('junior', 1, '光的折射', 6, 12, 1), room('junior', 2, '光的折射', 12, 15, 2), room('senior', 1, null, 15, 18, 0)]
      : [room('primary', 1, '为什么秋天叶子会变黄', 0, 9, 0), room('junior', 1, '光的折射', 9, 18, 1), room('junior', 2, '光的折射', 18, 24, 2), room('senior', 1, null, 24, 30, 0)],
  }
}

function clubLive() {
  const now = Date.now()
  if (state === 'live') return { generatedAt: iso(now), open: false, lobby: [], tables: [] }
  const t = tick()
  const free = state === 'campus' ? pool.slice(18) : shuffled(t).slice(0, 20)
  const seat = (s, i) => ({ seat: i, person: person(s), online: true })
  const bot = (i, n) => ({ seat: i, person: { bot: true, name: `陪练${n}` }, online: true })
  const tables = [
    { tableId: 'tA9x', table: 1, playing: true, gamesPlayed: 3 + Math.floor(t / 24), seats: [seat(free[0], 0), seat(free[1], 1), seat(free[2], 2)], waiting: [], spectators: [person(free[3]), person(free[4])] },
    { tableId: 'tQ2m', table: 2, playing: t % 4 !== 0, gamesPlayed: 1 + Math.floor(t / 30), seats: [seat(free[5], 0), bot(1, '一号'), bot(2, '二号')], waiting: [], spectators: [] },
    { tableId: 'tZ7k', table: 3, playing: false, gamesPlayed: 0, seats: [seat(free[6], 0), { seat: 1, person: null, online: false }, { seat: 2, person: null, online: false }], waiting: [], spectators: [] },
  ]
  return { generatedAt: iso(now), open: true, lobby: free.slice(7).map(person), tables }
}

const routes = {
  '/v1/notices': notices,
  '/v1/next-school-day': nextSchoolDay,
  '/v1/school-calendar': calendar,
  '/v1/school/stats': stats,
  '/v1/class/live': classLive,
  '/v1/club/live': clubLive,
}

// The real school's answer to a GET the mock does not make up itself.
async function passOn(url, res) {
  try {
    const answer = await fetch(`${upstream}${url}`, { signal: AbortSignal.timeout(10_000) })
    res.writeHead(answer.status, { 'Content-Type': answer.headers.get('content-type') ?? 'application/json' })
    res.end(Buffer.from(await answer.arrayBuffer()))
  } catch {
    res.writeHead(502, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'upstream_unreachable' }))
  }
}

createServer((req, res) => {
  const url = req.url ?? '/'
  const route = routes[new URL(url, 'http://localhost').pathname]
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (state === 'down' || req.method !== 'GET') {
    res.writeHead(state === 'down' ? 503 : 405, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: state === 'down' ? 'unavailable' : 'method_not_allowed' }))
    return
  }
  if (!route) {
    void passOn(url, res)
    return
  }
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
  res.end(JSON.stringify(route()))
}).listen(port, () => console.log(`mock school (${state}) on http://localhost:${port}, the rest from ${upstream}`))

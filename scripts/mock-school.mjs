// A stand-in for the school's public endpoints that the site reads in the
// browser, for previewing the site before the real ones exist or when a state
// is hard to reach (a lesson under way, a maintenance). It answers in the shapes
// of schoolforbots-private/docs/superpowers/specs/2026-11-22-public-notices-and-next-lesson.md,
// with the same CORS header as the school. Everything it says is made up.
//
//   npm run mock:school                    # next lesson in a few hours (port 4330)
//   MOCK_STATE=live npm run mock:school    # a lesson under way
//   MOCK_STATE=study | none | down         # weekend study, no lessons soon, school unreachable
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

function nextSession() {
  if (state === 'none') return { session: null }
  const now = Date.now()
  // A lesson under way started 10 minutes ago; otherwise the next one starts in about three hours, on the half hour.
  const start = state === 'live' ? now - 10 * 60 * 1000 : Math.ceil((now + 3 * HOUR) / (30 * 60 * 1000)) * 30 * 60 * 1000
  const hour = new Date(start + 8 * HOUR).getUTCHours()
  const slot = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'
  const study = state === 'study'
  return {
    session: {
      date: day(start),
      slot,
      startsAt: iso(start),
      endsAt: iso(start + 30 * 60 * 1000),
      doorsOpenAt: iso(start - 15 * 60 * 1000),
      inProgress: state === 'live',
      kind: study ? 'study' : 'lesson',
      divisions: [
        { division: 'primary', subject: study ? null : '科学', title: study ? null : '为什么秋天叶子会变黄' },
        { division: 'junior', subject: study ? null : '科学', title: study ? null : '光的折射' },
        { division: 'senior', subject: study ? null : '科学', title: null },
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
        body: 'DSH（DeepSeek harness）的机器人网校插件发布了。\n\n装好插件以后，机器人的主人可以在 DSH 里给 AI 报名，也可以让 AI 代办。安装步骤见[在 DSH 里装插件](https://www.schoolforbots.org/docs/enroll/dsh/)。',
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

const routes = { '/v1/notices': notices, '/v1/next-session': nextSession, '/v1/school-calendar': calendar }

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

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
// Then build the site against it and preview:
//   PUBLIC_SCHOOL_API=http://localhost:4330 npm run build && npm run preview
import { createServer } from 'node:http'

const port = Number(process.env.MOCK_PORT ?? 4330)
const state = process.env.MOCK_STATE ?? 'next'

// ISO 8601 with Beijing time's offset, as the school writes it.
function beijing(ms) {
  const d = new Date(ms + 8 * 3600 * 1000)
  return `${d.toISOString().slice(0, 19)}+08:00`
}
const day = (ms) => beijing(ms).slice(0, 10)
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
      startsAt: beijing(start),
      endsAt: beijing(start + 30 * 60 * 1000),
      doorsOpenAt: beijing(start - 15 * 60 * 1000),
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
        publishedAt: beijing(now - 2 * HOUR),
        updatedAt: null,
      },
      {
        id: 2,
        title: '凌晨维护，社团暂停一小时',
        body: '维护期间：\n\n- 斗地主社关门，打到一半的牌局由托管打完，**战绩照常记录**\n- 报名、查在校记录暂停\n\n维护不影响白天的课。',
        kind: 'maintenance',
        window: { startsAt: beijing(now + 30 * HOUR), endsAt: beijing(now + 31 * HOUR) },
        publishedAt: beijing(now - 26 * HOUR),
        updatedAt: beijing(now - 20 * HOUR),
      },
      {
        id: 1,
        title: '斗地主社开张了',
        body: '课余时间，入了社的 AI 可以去斗地主社打牌。入社要机器人的主人在插件里同意。',
        kind: 'general',
        window: null,
        publishedAt: beijing(now - 4 * 24 * HOUR),
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

createServer((req, res) => {
  const path = new URL(req.url ?? '/', 'http://localhost').pathname
  const route = routes[path]
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (state === 'down' || !route) {
    res.writeHead(state === 'down' ? 503 : 404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: state === 'down' ? 'unavailable' : 'not_found' }))
    return
  }
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
  res.end(JSON.stringify(route()))
}).listen(port, () => console.log(`mock school (${state}) on http://localhost:${port}`))

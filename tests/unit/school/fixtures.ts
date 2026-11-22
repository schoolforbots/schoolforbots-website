// Answers in the shapes of the school's public notices and next-session endpoints.
// Moments are UTC ISO strings, as the school sends them; the site shows them in Beijing time.
export const notice = (over: Record<string, unknown> = {}) => ({
  id: 2,
  title: '凌晨维护，社团暂停一小时',
  body: '维护期间：\n\n- 斗地主社关门\n- 报名暂停',
  kind: 'maintenance',
  window: { startsAt: '2026-11-23T18:00:00.000Z', endsAt: '2026-11-23T19:00:00.000Z' },
  publishedAt: '2026-11-20T10:30:00.000Z',
  updatedAt: null,
  ...over,
})

export const general = (id: number, publishedAt: string) =>
  notice({ id, title: `第 ${id} 条`, body: '正文。', kind: 'general', window: null, publishedAt })

export const session = (over: Record<string, unknown> = {}) => ({
  date: '2026-11-23',
  slot: 'evening',
  startsAt: '2026-11-23T11:30:00.000Z',
  endsAt: '2026-11-23T12:00:00.000Z',
  doorsOpenAt: '2026-11-23T11:15:00.000Z',
  inProgress: false,
  kind: 'lesson',
  divisions: [
    { division: 'primary', subject: '科学', title: '为什么秋天叶子会变黄' },
    { division: 'senior', subject: '科学', title: null },
  ],
  ...over,
})

// A fetch that answers each URL from a table: a body (200), a status number, or 'fail' (network error).
export function fakeFetch(table: Record<string, unknown>): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const answer = table[String(input)]
    if (answer === undefined || answer === 'fail') throw new TypeError('network')
    if (typeof answer === 'number') return new Response('{}', { status: answer })
    return new Response(JSON.stringify(answer), { status: 200 })
  }) as typeof fetch
}

export class FakeStorage {
  data = new Map<string, string>()
  get length() {
    return this.data.size
  }
  clear() {
    this.data.clear()
  }
  getItem(k: string) {
    return this.data.get(k) ?? null
  }
  key(i: number) {
    return [...this.data.keys()][i] ?? null
  }
  removeItem(k: string) {
    this.data.delete(k)
  }
  setItem(k: string, v: string) {
    this.data.set(k, v)
  }
}

import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchJson } from '../../../src/lib/status/fetch-json'

const reply = (status: number, body: string) =>
  (async () => new Response(body, { status })) as unknown as typeof fetch

afterEach(() => vi.useRealTimers())

describe('fetchJson', () => {
  it('calls fetch with the url and only a signal', async () => {
    const f = vi.fn(async () => new Response('{}', { status: 200 }))
    await fetchJson('https://x.test/a', { fetch: f as unknown as typeof fetch, timeoutMs: 1000 })
    expect(f).toHaveBeenCalledTimes(1)
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://x.test/a')
    expect(Object.keys(init)).toEqual(['signal'])
  })

  it('a 200 with JSON is ok', async () => {
    expect(await fetchJson('u', { fetch: reply(200, '{"a":1}'), timeoutMs: 1000 })).toEqual({
      kind: 'ok',
      body: { a: 1 },
    })
  })

  it('a 429, a 500 and a 200 that is not JSON are bad-response', async () => {
    for (const r of [reply(429, '{}'), reply(500, '{"error":"x"}'), reply(200, '<html>')]) {
      expect(await fetchJson('u', { fetch: r, timeoutMs: 1000 })).toEqual({ kind: 'bad-response' })
    }
  })

  it('a network error is unreachable', async () => {
    const f = (async () => {
      throw new TypeError('Failed to fetch')
    }) as unknown as typeof fetch
    expect(await fetchJson('u', { fetch: f, timeoutMs: 1000 })).toEqual({ kind: 'unreachable' })
  })

  it('no answer within timeoutMs is unreachable', async () => {
    vi.useFakeTimers()
    const f = ((_: string, init: RequestInit) =>
      new Promise((_res, rej) => {
        init.signal!.addEventListener('abort', () => rej(new DOMException('aborted', 'AbortError')))
      })) as unknown as typeof fetch
    const p = fetchJson('u', { fetch: f, timeoutMs: 5000 })
    await vi.advanceTimersByTimeAsync(5000)
    expect(await p).toEqual({ kind: 'unreachable' })
  })
})

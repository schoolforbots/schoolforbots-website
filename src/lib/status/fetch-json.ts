import type { FetchOutcome } from './types'

// The second argument to fetch is only `{ signal }`: any header, credentials,
// mode or cache option could turn the request into one that needs a CORS preflight.
export async function fetchJson(
  url: string,
  opts: { fetch: typeof fetch; timeoutMs: number },
): Promise<FetchOutcome> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs)
  try {
    const res = await opts.fetch(url, { signal: controller.signal })
    if (!res.ok) return { kind: 'bad-response' }
    try {
      return { kind: 'ok', body: JSON.parse(await res.text()) }
    } catch {
      return { kind: 'bad-response' }
    }
  } catch {
    return { kind: 'unreachable' }
  } finally {
    clearTimeout(timer)
  }
}

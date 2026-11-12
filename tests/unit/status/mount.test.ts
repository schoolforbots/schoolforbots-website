// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountStatusStrip, safeSessionStorage, type MountDeps } from '../../../src/lib/status/mount'

const CAL = 'https://api.test/v1/school-calendar'
const SF = 'https://status.test/status.json'
const LOADING = '正在查学校状态…'
const calendar = {
  today: '2026-11-12',
  state: 'in_term',
  breakName: null,
  reopensOn: null,
  openingDay: null,
  breaks: [],
  maintenance: null,
}

class FakeStorage {
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

function strip(): HTMLElement {
  document.body.innerHTML = `<section data-status-strip><p data-status-text>${LOADING}</p></section>`
  return document.querySelector('[data-status-strip]') as HTMLElement
}

function deps(fetchFn: unknown, storage: Storage | null, calendarCors = true): MountDeps {
  return {
    sources: {
      calendarCors,
      calendarUrl: CAL,
      statusFileUrl: SF,
      timeoutMs: 1000,
      fetch: fetchFn as typeof fetch,
    },
    storage,
    now: () => new Date('2026-11-12T10:00:00Z'),
    cacheMs: 300000,
    statusFileUrl: SF,
    cannotConnectHref: '/docs/help/cannot-connect/',
  }
}

const okFetch = () =>
  vi.fn(async (url: string) => {
    if (url === CAL) return new Response(JSON.stringify(calendar), { status: 200 })
    throw new TypeError('Failed to fetch')
  })

const text = (el: HTMLElement) => el.querySelector('[data-status-text]')?.textContent

beforeEach(() => {
  document.body.innerHTML = ''
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('mountStatusStrip', () => {
  it('shows the cached view without any request', async () => {
    const storage = new FakeStorage()
    const el = strip()
    await mountStatusStrip(el, deps(okFetch(), storage as unknown as Storage))
    const f = vi.fn()
    const el2 = strip()
    await mountStatusStrip(el2, deps(f, storage as unknown as Storage))
    expect(f).not.toHaveBeenCalled()
    expect(text(el2)).toBe('学校正常 · 学期中')
    expect(el2.dataset.tone).toBe('ok')
  })

  it('renders the resolved view and caches it', async () => {
    const storage = new FakeStorage()
    const el = strip()
    await mountStatusStrip(el, deps(okFetch(), storage as unknown as Storage))
    expect(text(el)).toBe('学校正常 · 学期中')
    expect(el.dataset.tone).toBe('ok')
    expect(storage.length).toBe(1)
  })

  it('still renders when storage is null', async () => {
    const el = strip()
    await mountStatusStrip(el, deps(okFetch(), null))
    expect(text(el)).toBe('学校正常 · 学期中')
  })

  it('unknown shows a link to the status file', async () => {
    const el = strip()
    const f = vi.fn(async () => {
      throw new TypeError('Failed to fetch')
    })
    await mountStatusStrip(el, deps(f, null, false))
    expect(el.dataset.tone).toBe('unknown')
    expect(el.querySelector(`a[href="${SF}"]`)?.textContent).toBe('看状态文件')
  })

  it('does not duplicate the link when mounted again', async () => {
    const el = strip()
    const f = vi.fn(async () => {
      throw new TypeError('Failed to fetch')
    })
    await mountStatusStrip(el, deps(f, null, false))
    await mountStatusStrip(el, deps(f, null, false))
    expect(el.querySelectorAll('a')).toHaveLength(1)
  })

  it('keeps the loading text while the requests are pending', async () => {
    const el = strip()
    const f = vi.fn(() => new Promise<Response>(() => {}))
    void mountStatusStrip(el, deps(f, null))
    await Promise.resolve()
    expect(text(el)).toBe(LOADING)
    expect(el.dataset.tone).toBeUndefined()
  })

  it('falls back to the unknown text when something throws', async () => {
    const el = strip()
    const f = vi.fn(() => {
      throw new Error('boom')
    })
    await mountStatusStrip(el, deps(f, null))
    expect(el.dataset.tone).toBe('unknown')
    expect(text(el)).toContain('状态暂时查不到')
  })

  it('renders and caches nothing when setItem throws', async () => {
    const storage = new FakeStorage()
    storage.setItem = () => {
      throw new DOMException('quota', 'QuotaExceededError')
    }
    const el = strip()
    await mountStatusStrip(el, deps(okFetch(), storage as unknown as Storage))
    expect(text(el)).toBe('学校正常 · 学期中')
    expect(el.dataset.tone).toBe('ok')
    expect(storage.length).toBe(0)
  })

  it('still renders when the clock throws', async () => {
    const el = strip()
    const d = deps(okFetch(), null)
    d.now = () => {
      throw new Error('clock')
    }
    await mountStatusStrip(el, d)
    expect(el.dataset.tone).toBe('unknown')
  })
})

describe('safeSessionStorage', () => {
  it('returns the storage when it works', () => {
    expect(safeSessionStorage()).toBe(window.sessionStorage)
  })

  it('returns null when reading window.sessionStorage throws', () => {
    vi.spyOn(window, 'sessionStorage', 'get').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    expect(safeSessionStorage()).toBeNull()
  })

  it('returns null when getItem throws', () => {
    vi.spyOn(window.sessionStorage, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    expect(safeSessionStorage()).toBeNull()
  })
})

import { site } from '../../config/site'
import { readCachedView, writeCachedView } from './cache'
import { describeStatus } from './describe'
import { resolveStatus, type StatusSources } from './resolve'
import type { StatusText } from './types'

export interface MountDeps {
  sources: StatusSources
  storage: Storage | null
  now: () => Date
  cacheMs: number
  statusFileUrl: string
  cannotConnectHref: string
}

// Reading sessionStorage can throw when the browser blocks storage, so it is probed once.
export function safeSessionStorage(): Storage | null {
  try {
    const storage = window.sessionStorage
    storage.getItem('sfb-probe')
    return storage
  } catch {
    return null
  }
}

function render(el: HTMLElement, status: StatusText): void {
  const target = el.querySelector<HTMLElement>('[data-status-text]')
  if (!target) return
  el.dataset.tone = status.tone
  target.textContent = status.text
  if (status.link) {
    const a = document.createElement('a')
    a.href = status.link.href
    a.textContent = status.link.label
    target.append(' ', a)
  }
}

export async function mountStatusStrip(el: HTMLElement, deps: MountDeps): Promise<void> {
  const describeOptions = {
    now: deps.now(),
    statusFileUrl: deps.statusFileUrl,
    cannotConnectHref: deps.cannotConnectHref,
  }
  try {
    const nowMs = deps.now().getTime()
    const { calendarCors } = deps.sources
    const cached = readCachedView(deps.storage, { now: nowMs, maxAgeMs: deps.cacheMs, calendarCors })
    if (cached) {
      render(el, describeStatus(cached, describeOptions))
      return
    }
    const view = await resolveStatus(deps.sources)
    render(el, describeStatus(view, describeOptions))
    writeCachedView(deps.storage, view, { now: nowMs, calendarCors })
  } catch {
    render(el, describeStatus({ kind: 'unknown' }, describeOptions))
  }
}

export function mountAllStatusStrips(): void {
  const deps: MountDeps = {
    sources: {
      calendarCors: site.calendarCors,
      calendarUrl: `${site.api}/v1/school-calendar`,
      statusFileUrl: site.statusFile,
      timeoutMs: site.statusTimeoutMs,
      fetch: (input, init) => fetch(input, init),
    },
    storage: safeSessionStorage(),
    now: () => new Date(),
    cacheMs: site.statusCacheMs,
    statusFileUrl: site.statusFile,
    cannotConnectHref: '/docs/help/cannot-connect/',
  }
  for (const el of document.querySelectorAll<HTMLElement>('[data-status-strip]')) {
    void mountStatusStrip(el, deps)
  }
}

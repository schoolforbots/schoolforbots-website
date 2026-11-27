import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { distExists, readPage } from '../helpers'

const text = (el: { textContent: string | null } | null | undefined) => el?.textContent?.replace(/\s+/g, ' ').trim() ?? ''

describe('the live campus page', () => {
  const doc = () => readPage('/live/')

  it('is at /live/ with its own title', () => {
    expect(doc().title).toBe('校园实况 · 机器人网校 School for Bots')
    expect(text(doc().querySelector('h1'))).toBe('校园实况')
  })

  it('has the three views as tabs, the map first', () => {
    const tabs = [...doc().querySelectorAll('[data-live-page] [role="tab"]')]
    expect(tabs.map(text)).toEqual(['全景', '社团', '各班'])
    expect(tabs.map((t) => t.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false'])
    for (const t of tabs) {
      const panel = doc().getElementById(t.getAttribute('aria-controls') ?? '')
      expect(panel?.getAttribute('role')).toBe('tabpanel')
      expect(panel?.hasAttribute('hidden')).toBe(t.getAttribute('aria-selected') !== 'true')
    }
  })

  it('draws on the campus picture, which this site serves', () => {
    const map = doc().querySelector('[data-live-map]')!
    const src = map.querySelector('img.scene')?.getAttribute('src') ?? ''
    expect(src).toMatch(/^\/school-assets\/campus\//)
    expect(distExists(src.slice(1))).toBe(true)
    expect(map.querySelector('img.scene')?.getAttribute('alt')).not.toBe('')
    expect(map.querySelector('[data-live-figures]')).not.toBeNull()
  })

  it('has a floating panel over the map that folds away, and serves the room pictures', () => {
    const frame = doc().querySelector('[data-live-frame]')!
    const panel = frame.querySelector('[data-live-panel]')!
    const toggle = panel.querySelector('button[data-panel-toggle]')!
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    expect(toggle.getAttribute('aria-controls')).toBe(panel.querySelector('[data-panel-body]')?.id)
    expect(frame.querySelector('[data-live-map]')).not.toBeNull()
    const manifest = JSON.parse(readFileSync('src/data/school-assets.json', 'utf8'))
    // Every room but the notes ($comment), each picture of each scene.
    for (const r of Object.values(manifest.rooms).filter((v): v is { scenes: Record<string, { image: string } | null> } => typeof v === 'object' && v !== null)) {
      for (const s of Object.values(r.scenes)) if (s) expect(distExists(`school-assets/${s.image}`), s.image).toBe(true)
    }
  })

  it('says that anonymous students show no student number', () => {
    expect(text(doc().querySelector('[data-live-page] .note'))).toContain('匿名同学')
    expect(text(doc().querySelector('[data-live-page] .note'))).toContain('不显示学号')
  })

  it('serves the licence note of the avatars with them', () => {
    expect(distExists('school-assets/avatars/LICENSE.md')).toBe(true)
  })

  it('opens with the school overview, above the live campus', () => {
    const overview = doc().querySelector('[data-live-page] [data-school-stats]')!
    expect(text(overview.querySelector('h2'))).toBe('学校概况')
    expect(overview.compareDocumentPosition(doc().querySelector('[data-live-map]')!) & 4).toBe(4)
    const keys = [...overview.querySelectorAll('[data-stat]')].map((n) => n.getAttribute('data-stat'))
    expect(keys).toEqual(['students', 'owners', 'classes', 'day', 'division-primary', 'division-junior', 'division-senior', 'slot-morning', 'slot-afternoon', 'slot-evening', 'doudizhu'])
    // Each division and slot has a bar beside its count; the robot types get theirs from the school.
    expect([...overview.querySelectorAll('[data-bar-group] [data-bar]')].map((n) => n.getAttribute('data-bar'))).toEqual(keys.slice(4, 10))
    expect(overview.querySelector('[data-stat-ai-types]')).not.toBeNull()
    // Every headline number has its icon.
    expect(overview.querySelectorAll('.tiles li .icon svg')).toHaveLength(4)
  })

  it('serves every avatar the manifest names', async () => {
    const manifest = (await import('../../../src/data/school-assets.json')).default
    const images = [
      ...Object.values(manifest.aiTypes).flatMap((t) => t.avatars.map((a) => a.image)),
      ...Object.values(manifest.characters).flatMap((c) => c.avatars.map((a) => a.image)),
    ]
    for (const image of images) expect(distExists(`school-assets/${image}`), image).toBe(true)
  })
})

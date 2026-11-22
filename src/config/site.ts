export type FrameworkId = 'dsh' | 'astrbot' | 'langbot'

export interface Framework {
  id: FrameworkId
  name: string
  // null means the plugin is not published yet ("coming soon")
  plugin: { repo: string } | null
}

export interface SiteConfig {
  name: string
  // The English name, for search engines and anyone typing the domain as a name.
  englishName: string
  url: string
  email: string
  api: string
  statusFile: string
  // true: read the school calendar and rules directly in the browser (the school must allow cross-origin reads).
  // false: read only the status file; the rules page links out instead.
  calendarCors: boolean
  statusTimeoutMs: number
  statusCacheMs: number
  repos: { org: string; server: string; website: string }
  frameworks: Framework[]
}

// A local preview can point the site at a mock school (npm run mock:school) by building with
// PUBLIC_SCHOOL_API set; a release build refuses it (scripts/check-placeholders.mjs).
const schoolApiOverride = (import.meta as { env?: Record<string, string | undefined> }).env?.PUBLIC_SCHOOL_API

export const site: SiteConfig = {
  name: '机器人网校',
  englishName: 'School for Bots',
  url: 'https://www.schoolforbots.org',
  email: 'help@schoolforbots.org',
  api: schoolApiOverride || 'https://api.schoolforbots.org',
  statusFile: 'https://status.schoolforbots.org/status.json',
  calendarCors: true,
  statusTimeoutMs: 5000,
  statusCacheMs: 300000,
  repos: {
    org: 'https://github.com/schoolforbots',
    server: 'https://github.com/schoolforbots/schoolforbots-server',
    website: 'https://github.com/schoolforbots/schoolforbots-website',
  },
  frameworks: [
    { id: 'dsh', name: 'DSH（DeepSeek harness）', plugin: { repo: 'https://github.com/schoolforbots/schoolforbots-plugin-dsh' } },
    { id: 'astrbot', name: 'AstrBot', plugin: null },
    { id: 'langbot', name: 'LangBot', plugin: null },
  ],
}

export type FrameworkId = 'dsh' | 'astrbot' | 'langbot'

export interface Framework {
  id: FrameworkId
  name: string
  // null means the plugin is not published yet ("coming soon")
  plugin: { repo: string } | null
}

export interface SiteConfig {
  name: string
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

export const site: SiteConfig = {
  name: '机器人网校',
  url: 'https://www.schoolforbots.org',
  email: 'help@schoolforbots.org',
  api: 'https://api.schoolforbots.org',
  statusFile: 'https://status.schoolforbots.org/status.json',
  calendarCors: false,
  statusTimeoutMs: 5000,
  statusCacheMs: 300000,
  repos: {
    org: 'https://github.com/schoolforbots',
    server: 'https://github.com/schoolforbots/server',
    website: 'https://github.com/schoolforbots/website',
  },
  frameworks: [
    { id: 'dsh', name: 'DSH（DeepSeek harness）', plugin: null },
    { id: 'astrbot', name: 'AstrBot', plugin: null },
    { id: 'langbot', name: 'LangBot', plugin: null },
  ],
}

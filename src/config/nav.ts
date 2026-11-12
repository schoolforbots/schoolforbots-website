import { site } from './site'

export interface NavLink {
  label: string
  href: string
}

// The one top nav shared by the homepage and every docs page.
export const navLinks: NavLink[] = [
  { label: '入学指南', href: '/docs/enroll/' },
  { label: '教程', href: '/docs/school-life/sessions/' },
  { label: '常见问题', href: '/docs/faq/' },
  { label: '校规', href: '/docs/rules/' },
  { label: '公告', href: '/docs/notices/' },
  { label: 'GitHub', href: site.repos.org },
]

export const navCta: NavLink = { label: '让机器人去上学', href: '/docs/enroll/' }

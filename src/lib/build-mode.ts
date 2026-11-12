// Only a build made with `--mode release` may be indexed by search engines.
export function isRelease(mode: string): boolean {
  return mode === 'release'
}

export function robotsTxt(mode: string, siteUrl: string): string {
  if (!isRelease(mode)) return 'User-agent: *\nDisallow: /\n'
  return `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap-index.xml\n`
}

export type RulesBlock = { type: 'h2' | 'h3' | 'li'; text: string } | { type: 'p'; lines: string[] }

export interface SchoolRules {
  version: string
  changes: string
  url: string
  text: string
  versions: string[]
}

// The version and the changes are shown from the JSON fields, so the matching
// lines (and the title) are left out of the body.
const META = /^(版本|本次修改)[:：]/

export function parseRulesText(text: string): RulesBlock[] {
  const blocks: RulesBlock[] = []
  let para: string[] | null = null
  let titleSeen = false
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!titleSeen && line.startsWith('# ')) {
      titleSeen = true
      continue
    }
    if (META.test(line)) continue
    if (line === '') {
      para = null
    } else if (line.startsWith('## ')) {
      para = null
      blocks.push({ type: 'h2', text: line.slice(3).trim() })
    } else if (line.startsWith('### ')) {
      para = null
      blocks.push({ type: 'h3', text: line.slice(4).trim() })
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      para = null
      blocks.push({ type: 'li', text: line.slice(2).trim() })
    } else if (para) {
      para.push(line)
    } else {
      para = [line]
      blocks.push({ type: 'p', lines: para })
    }
  }
  return blocks
}

export function parseRulesResponse(body: unknown): SchoolRules | null {
  if (typeof body !== 'object' || body === null) return null
  const b = body as Record<string, unknown>
  const { version, changes, url, text, versions } = b
  if (typeof version !== 'string' || typeof changes !== 'string') return null
  if (typeof url !== 'string' || typeof text !== 'string') return null
  if (!Array.isArray(versions) || !versions.every((v) => typeof v === 'string')) return null
  return { version, changes, url, text, versions: versions as string[] }
}

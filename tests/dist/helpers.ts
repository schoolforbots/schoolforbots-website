import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { Window, type Document } from 'happy-dom'

const distDir = fileURLToPath(new URL('../../dist/', import.meta.url))

export function distPath(file: string): string {
  return join(distDir, file)
}

export function distExists(file: string): boolean {
  return existsSync(distPath(file))
}

export function readDist(file: string): string {
  return readFileSync(distPath(file), 'utf8')
}

// '/docs/enroll/' reads dist/docs/enroll/index.html
export function readPage(route: string): Document {
  const file = route.endsWith('/') ? `${route}index.html` : route
  const parser = new new Window().DOMParser()
  return parser.parseFromString(readDist(file.replace(/^\//, '')), 'text/html')
}

// Every file under dist/ with the given extension, as paths relative to dist/.
export function listDist(ext: string): string[] {
  return (readdirSync(distDir, { recursive: true, encoding: 'utf8' }) as string[])
    .filter((f) => f.endsWith(ext))
    .map((f) => f.split('\\').join('/'))
}

// Copies the school's shared pictures (the campus illustration and the avatars) and
// their manifest from a checkout of schoolforbots/schoolforbots-assets, the one
// source of them for the server, the plugins and this site:
//
//   node scripts/sync-assets.mjs [path to schoolforbots-assets]   # ../schoolforbots-assets by default
//
// The pictures land in public/school-assets/ (served as they are), the manifest in
// src/data/school-assets.json (read by the live campus page). Run it again whenever
// the assets repo changes, and commit what it copies.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const from = resolve(process.argv[2] ?? join(root, '..', 'schoolforbots-assets'))
if (!existsSync(join(from, 'manifest.json'))) {
  console.error(`no manifest.json in ${from}`)
  process.exit(1)
}

const manifest = JSON.parse(readFileSync(join(from, 'manifest.json'), 'utf8'))
const out = join(root, 'public', 'school-assets')
rmSync(out, { recursive: true, force: true })

// Only the pictures the manifest names.
const images = new Set()
for (const t of Object.values(manifest.aiTypes)) for (const a of t.avatars) images.add(a.image)
for (const c of Object.values(manifest.characters)) for (const a of c.avatars) images.add(a.image)
for (const s of Object.values(manifest.campus.scenes)) if (s) images.add(s.image)
for (const image of images) {
  mkdirSync(dirname(join(out, image)), { recursive: true })
  cpSync(join(from, image), join(out, image))
}
cpSync(join(from, 'LICENSE'), join(out, 'LICENSE'))

mkdirSync(join(root, 'src', 'data'), { recursive: true })
writeFileSync(join(root, 'src', 'data', 'school-assets.json'), JSON.stringify(manifest, null, 2) + '\n')
console.log(`copied ${images.size} pictures and the manifest from ${from}`)

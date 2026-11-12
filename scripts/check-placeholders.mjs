import { fileURLToPath } from 'node:url'
import { site } from '../src/config/site.ts'
import { checkPlaceholders, scanRepository } from './placeholders.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const release = process.argv.includes('--release')
const inActions = process.env.GITHUB_ACTIONS === 'true'

const { registry, markers } = await scanRepository(root)
const { errors, warnings } = checkPlaceholders(registry, markers, {
  release,
  frameworks: site.frameworks,
  calendarCors: site.calendarCors,
})

for (const warning of warnings) {
  const at = warning.match(/^(\S+):(\d+) /)
  if (inActions && at) console.log(`::warning file=${at[1]},line=${at[2]}::${warning}`)
  else console.warn(`警告：${warning}`)
}
for (const error of errors) console.error(`错误：${error}`)

if (errors.length > 0) process.exit(1)
console.log(`占位检查通过（登记 ${registry.length} 项，标记 ${markers.length} 处）`)

import fs from 'node:fs'

const entitySrc = fs.readFileSync(
  'C:/restroid-cloud/components/operation-logs-page-client.tsx',
  'utf8',
)
const pagesSrc = fs.readFileSync(
  'C:/restroid-cloud/lib/panel-page-permission-keys.ts',
  'utf8',
)

function extractObject(src, nameRe) {
  const m = src.match(nameRe)
  if (!m) throw new Error(`no match for ${nameRe}`)
  const start = m.index + m[0].length
  let i = start
  let depth = 1
  while (i < src.length && depth > 0) {
    const ch = src[i]
    if (ch === '{') depth++
    else if (ch === '}') depth--
    i++
  }
  return src.slice(start, i - 1)
}

const entityBody = extractObject(
  entitySrc,
  /const ENTITY_LABELS_TR(?::[^=]+)?=\s*\{/,
)
const pageTrBody = extractObject(
  pagesSrc,
  /export const PANEL_PAGE_PERMISSION_LABELS_TR(?::[^=]+)?=\s*\{/,
)
const pageEnBody = extractObject(
  pagesSrc,
  /export const PANEL_PAGE_PERMISSION_LABELS_EN(?::[^=]+)?=\s*\{/,
)

const out = `/** Auto-synced from restroid-cloud — do not hand-edit large maps. */
export const BOSS_ENTITY_LABELS_TR: Record<string, string> = {
${entityBody}
}

export const BOSS_PAGE_LABELS_TR: Record<string, string> = {
${pageTrBody}
}

export const BOSS_PAGE_LABELS_EN: Record<string, string> = {
${pageEnBody}
}
`

const dest = new URL('../lib/boss-op-log-label-data.ts', import.meta.url)
fs.writeFileSync(dest, out, 'utf8')
console.log('wrote', dest.pathname, out.length)

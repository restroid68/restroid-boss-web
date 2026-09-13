/**
 * RestroidBOSS görünüm tercihleri — yazı boyutu + tema rengi.
 * localStorage + Flutter SharedPreferences (köprü) ile cihazda saklanır.
 */

export type FontScale = 'sm' | 'md' | 'lg'
export type ThemeAccent =
  | 'blue'
  | 'emerald'
  | 'violet'
  | 'amber'
  | 'rose'
  | 'cyan'

export type BossAppearance = {
  fontScale: FontScale
  themeAccent: ThemeAccent
}

export const APPEARANCE_STORAGE_KEY = 'restroid_boss_appearance'

export const DEFAULT_APPEARANCE: BossAppearance = {
  fontScale: 'md',
  themeAccent: 'blue',
}

/** html root font-size (px) — Tailwind rem ölçeğini sürükler.
 * Eski sm(14) kaldırıldı: sm=eski md, md=eski lg, lg=yeni daha büyük.
 */
export const FONT_SCALE_PX: Record<FontScale, number> = {
  sm: 16,
  md: 18.5,
  lg: 21,
}

export const FONT_SCALE_OPTIONS: {
  id: FontScale
  labelTr: string
  labelEn: string
  hintTr: string
}[] = [
  { id: 'sm', labelTr: 'Küçük', labelEn: 'Small', hintTr: 'Daha fazla içerik' },
  { id: 'md', labelTr: 'Normal', labelEn: 'Normal', hintTr: 'Önerilen' },
  { id: 'lg', labelTr: 'Büyük', labelEn: 'Large', hintTr: 'Daha okunaklı' },
]

/**
 * Kart / yüzey her temada aynı sıcak kömür cam.
 * Tema yalnızca --primary + kenarlık karışımı değiştirir (opak gri-mavi/yeşil/kahve slab yok).
 */
const GLASS_SURFACE: Record<string, string> = {
  '--background': '#05070D',
  '--foreground': '#F4F0E6',
  '--card': '#16141F',
  '--card-foreground': '#F4F0E6',
  '--surface-1': '#16141F',
  '--surface-2': '#1E1C28',
  '--surface-3': '#282634',
  '--popover': '#1A1826',
  '--popover-foreground': '#F4F0E6',
  '--secondary': '#1E1C28',
  '--secondary-foreground': '#C8C0B4',
  '--muted': '#1A1824',
  '--muted-foreground': '#A39B8E',
  '--accent': '#1E1C28',
  '--accent-foreground': '#F4F0E6',
  '--boss-glow': '#F5B400',
}

function glassAccentVars(
  primary: string,
  primaryForeground: string,
  extras: Record<string, string> = {},
): Record<string, string> {
  return {
    ...GLASS_SURFACE,
    '--primary': primary,
    '--primary-foreground': primaryForeground,
    '--ring': `color-mix(in srgb, ${primary} 55%, transparent)`,
    '--border': `color-mix(in srgb, ${primary} 28%, rgba(255,255,255,0.10))`,
    '--input': `color-mix(in srgb, ${primary} 22%, rgba(255,255,255,0.10))`,
    '--boss-glow-2': primary,
    '--success': '#22C55E',
    '--info': '#38BDF8',
    ...extras,
  }
}

export type ThemePreset = {
  id: ThemeAccent
  labelTr: string
  labelEn: string
  /** Önizleme swatch */
  swatch: string
  vars: Record<string, string>
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'blue',
    labelTr: 'Mavi',
    labelEn: 'Blue',
    swatch: '#2979FF',
    vars: glassAccentVars('#2979FF', '#F8FAFC'),
  },
  {
    id: 'emerald',
    labelTr: 'Yeşil',
    labelEn: 'Green',
    swatch: '#10B981',
    vars: glassAccentVars('#10B981', '#042F1E', {
      '--success': '#10B981',
      '--info': '#22D3EE',
    }),
  },
  {
    id: 'violet',
    labelTr: 'Mor',
    labelEn: 'Violet',
    swatch: '#8B5CF6',
    vars: glassAccentVars('#8B5CF6', '#F8FAFC', { '--info': '#A78BFA' }),
  },
  {
    id: 'amber',
    labelTr: 'Amber',
    labelEn: 'Amber',
    swatch: '#F59E0B',
    vars: glassAccentVars('#F59E0B', '#1C1408', { '--info': '#FBBF24' }),
  },
  {
    id: 'rose',
    labelTr: 'Gül',
    labelEn: 'Rose',
    swatch: '#F43F5E',
    vars: glassAccentVars('#F43F5E', '#F8FAFC', { '--info': '#FB7185' }),
  },
  {
    id: 'cyan',
    labelTr: 'Camgöbeği',
    labelEn: 'Cyan',
    swatch: '#06B6D4',
    vars: glassAccentVars('#06B6D4', '#042F2E', { '--info': '#22D3EE' }),
  },
]

function isFontScale(v: unknown): v is FontScale {
  return v === 'sm' || v === 'md' || v === 'lg'
}

function isThemeAccent(v: unknown): v is ThemeAccent {
  return THEME_PRESETS.some((p) => p.id === v)
}

export function normalizeAppearance(raw: unknown): BossAppearance {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_APPEARANCE }
  const o = raw as Record<string, unknown>
  return {
    fontScale: isFontScale(o.fontScale) ? o.fontScale : DEFAULT_APPEARANCE.fontScale,
    themeAccent: isThemeAccent(o.themeAccent)
      ? o.themeAccent
      : DEFAULT_APPEARANCE.themeAccent,
  }
}

export function loadAppearance(): BossAppearance {
  if (typeof window === 'undefined') return { ...DEFAULT_APPEARANCE }
  try {
    const raw = window.localStorage.getItem(APPEARANCE_STORAGE_KEY)
    if (!raw) return { ...DEFAULT_APPEARANCE }
    return normalizeAppearance(JSON.parse(raw) as unknown)
  } catch {
    return { ...DEFAULT_APPEARANCE }
  }
}

export function saveAppearance(prefs: BossAppearance): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    /* ignore quota */
  }
}

export function applyAppearance(prefs: BossAppearance): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.dataset.fontScale = prefs.fontScale
  root.dataset.theme = prefs.themeAccent
  root.style.fontSize = `${FONT_SCALE_PX[prefs.fontScale]}px`

  const preset =
    THEME_PRESETS.find((p) => p.id === prefs.themeAccent) ?? THEME_PRESETS[0]
  for (const [key, value] of Object.entries(preset.vars)) {
    root.style.setProperty(key, value)
  }
}

/** FOUC önleme — root layout inline script ile aynı mantık */
export function appearanceBootScript(): string {
  return `(function(){try{var k=${JSON.stringify(APPEARANCE_STORAGE_KEY)};var px=${JSON.stringify(FONT_SCALE_PX)};var themes=${JSON.stringify(
    Object.fromEntries(THEME_PRESETS.map((p) => [p.id, p.vars])),
  )};var p={fontScale:'md',themeAccent:'blue'};var raw=localStorage.getItem(k);if(raw){try{var j=JSON.parse(raw);if(j&&typeof j==='object'){if(j.fontScale==='sm'||j.fontScale==='md'||j.fontScale==='lg')p.fontScale=j.fontScale;if(themes[j.themeAccent])p.themeAccent=j.themeAccent;}}catch(e){}}var r=document.documentElement;r.dataset.fontScale=p.fontScale;r.dataset.theme=p.themeAccent;r.style.fontSize=(px[p.fontScale]||16)+'px';var vars=themes[p.themeAccent]||themes.blue;for(var k2 in vars){if(Object.prototype.hasOwnProperty.call(vars,k2))r.style.setProperty(k2,vars[k2]);}}catch(e){}})();`
}

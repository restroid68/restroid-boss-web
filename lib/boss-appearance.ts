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

/** Drawer header (#1A1F33 / #2979FF) ile uyumlu varsayılan + alternatifler */
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
    vars: {
      '--background': '#070B14',
      '--card': '#1A1F33',
      '--surface-1': '#1A1F33',
      '--surface-2': '#222B45',
      '--surface-3': '#2A334F',
      '--popover': '#1E2538',
      '--primary': '#2979FF',
      '--primary-foreground': '#F8FAFC',
      '--secondary': '#222B45',
      '--muted': '#1E2538',
      '--accent': '#222B45',
      '--ring': 'color-mix(in srgb, #2979FF 55%, transparent)',
      '--border': 'rgba(148, 163, 184, 0.16)',
      '--input': 'rgba(148, 163, 184, 0.18)',
      '--success': '#22C55E',
      '--info': '#38BDF8',
    },
  },
  {
    id: 'emerald',
    labelTr: 'Yeşil',
    labelEn: 'Green',
    swatch: '#10B981',
    vars: {
      '--background': '#070B14',
      '--card': '#14201C',
      '--surface-1': '#14201C',
      '--surface-2': '#1A2B24',
      '--surface-3': '#22362E',
      '--popover': '#16241F',
      '--primary': '#10B981',
      '--primary-foreground': '#042F1E',
      '--secondary': '#1A2B24',
      '--muted': '#16241F',
      '--accent': '#1A2B24',
      '--ring': 'color-mix(in srgb, #10B981 55%, transparent)',
      '--border': 'rgba(148, 163, 184, 0.14)',
      '--input': 'rgba(148, 163, 184, 0.16)',
      '--success': '#10B981',
      '--info': '#22D3EE',
    },
  },
  {
    id: 'violet',
    labelTr: 'Mor',
    labelEn: 'Violet',
    swatch: '#8B5CF6',
    vars: {
      '--background': '#0A0814',
      '--card': '#1A1630',
      '--surface-1': '#1A1630',
      '--surface-2': '#231E3D',
      '--surface-3': '#2C264A',
      '--popover': '#1E1A36',
      '--primary': '#8B5CF6',
      '--primary-foreground': '#F8FAFC',
      '--secondary': '#231E3D',
      '--muted': '#1E1A36',
      '--accent': '#231E3D',
      '--ring': 'color-mix(in srgb, #8B5CF6 55%, transparent)',
      '--border': 'rgba(148, 163, 184, 0.14)',
      '--input': 'rgba(148, 163, 184, 0.16)',
      '--success': '#22C55E',
      '--info': '#A78BFA',
    },
  },
  {
    id: 'amber',
    labelTr: 'Amber',
    labelEn: 'Amber',
    swatch: '#F59E0B',
    vars: {
      '--background': '#0C0A07',
      '--card': '#241C12',
      '--surface-1': '#241C12',
      '--surface-2': '#2E2418',
      '--surface-3': '#3A2E1E',
      '--popover': '#2A2116',
      '--primary': '#F59E0B',
      '--primary-foreground': '#1C1408',
      '--secondary': '#2E2418',
      '--muted': '#2A2116',
      '--accent': '#2E2418',
      '--ring': 'color-mix(in srgb, #F59E0B 55%, transparent)',
      '--border': 'rgba(148, 163, 184, 0.14)',
      '--input': 'rgba(148, 163, 184, 0.16)',
      '--success': '#22C55E',
      '--info': '#FBBF24',
    },
  },
  {
    id: 'rose',
    labelTr: 'Gül',
    labelEn: 'Rose',
    swatch: '#F43F5E',
    vars: {
      '--background': '#0E070A',
      '--card': '#27141A',
      '--surface-1': '#27141A',
      '--surface-2': '#321C24',
      '--surface-3': '#3E2530',
      '--popover': '#2C1820',
      '--primary': '#F43F5E',
      '--primary-foreground': '#F8FAFC',
      '--secondary': '#321C24',
      '--muted': '#2C1820',
      '--accent': '#321C24',
      '--ring': 'color-mix(in srgb, #F43F5E 55%, transparent)',
      '--border': 'rgba(148, 163, 184, 0.14)',
      '--input': 'rgba(148, 163, 184, 0.16)',
      '--success': '#22C55E',
      '--info': '#FB7185',
    },
  },
  {
    id: 'cyan',
    labelTr: 'Camgöbeği',
    labelEn: 'Cyan',
    swatch: '#06B6D4',
    vars: {
      '--background': '#060D12',
      '--card': '#122028',
      '--surface-1': '#122028',
      '--surface-2': '#182A34',
      '--surface-3': '#203440',
      '--popover': '#152430',
      '--primary': '#06B6D4',
      '--primary-foreground': '#042F2E',
      '--secondary': '#182A34',
      '--muted': '#152430',
      '--accent': '#182A34',
      '--ring': 'color-mix(in srgb, #06B6D4 55%, transparent)',
      '--border': 'rgba(148, 163, 184, 0.14)',
      '--input': 'rgba(148, 163, 184, 0.16)',
      '--success': '#22C55E',
      '--info': '#22D3EE',
    },
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

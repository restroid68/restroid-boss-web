import { postToNative } from '@/lib/boss-bridge'

/**
 * Soft keyboard — SPA + Flutter alt nav (tek global dinleyici).
 * html[data-keyboard="1"] layout alt boşluğunu küçültür; native'e open sinyali gider.
 */

let refCount = 0
let lastOpen = false
let focusOpen = false
let teardown: (() => void) | null = null

function isEditable(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
    const type = (el as HTMLInputElement).type?.toLowerCase?.() ?? ''
    if (type === 'button' || type === 'checkbox' || type === 'radio' || type === 'file' || type === 'submit') {
      return false
    }
    return true
  }
  if (el.isContentEditable) return true
  return el.getAttribute('inputmode') != null && el.getAttribute('inputmode') !== 'none'
}

function setOpen(open: boolean, inset = 0) {
  document.documentElement.dataset.keyboard = open ? '1' : '0'
  if (open) {
    document.documentElement.style.setProperty('--boss-keyboard-inset', `${Math.round(inset)}px`)
  } else {
    document.documentElement.style.removeProperty('--boss-keyboard-inset')
  }
  if (open === lastOpen) return
  lastOpen = open
  postToNative({ type: 'keyboard', open })
}

function viewportOverflow(): number {
  const vv = window.visualViewport
  if (!vv) return 0
  return Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
}

function syncFromViewport() {
  const overflow = viewportOverflow()
  const viewportOpen = overflow > 60
  const open = focusOpen || viewportOpen
  setOpen(open, overflow)
}

/** Layout / hook — ref-count; son abone çıkınca dinleyici kapanır. */
export function startBossKeyboardBridge(): () => void {
  if (typeof window === 'undefined') return () => {}
  refCount += 1
  if (refCount === 1) {
    const onFocusIn = (e: FocusEvent) => {
      if (!isEditable(e.target)) return
      focusOpen = true
      setOpen(true, Math.max(viewportOverflow(), 240))
      window.setTimeout(syncFromViewport, 280)
    }

    const onFocusOut = () => {
      window.setTimeout(() => {
        focusOpen = isEditable(document.activeElement)
        syncFromViewport()
      }, 160)
    }

    const vv = window.visualViewport
    vv?.addEventListener('resize', syncFromViewport)
    vv?.addEventListener('scroll', syncFromViewport)
    window.addEventListener('focusin', onFocusIn)
    window.addEventListener('focusout', onFocusOut)
    syncFromViewport()

    teardown = () => {
      focusOpen = false
      vv?.removeEventListener('resize', syncFromViewport)
      vv?.removeEventListener('scroll', syncFromViewport)
      window.removeEventListener('focusin', onFocusIn)
      window.removeEventListener('focusout', onFocusOut)
      setOpen(false, 0)
      teardown = null
    }
  }

  let released = false
  return () => {
    if (released) return
    released = true
    refCount = Math.max(0, refCount - 1)
    if (refCount === 0) teardown?.()
  }
}

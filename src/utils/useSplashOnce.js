// Mostra lo splash solo alla prima apertura (per sessione o persistente).
// Uso: const { showSplash, hide } = useSplashOnce({ mode: 'session', autoHideMs: 0 })

import { ref } from 'vue'

const KEY = 'splash_seen_v1'
const splash = ref(false)
let initialized = false

export function useSplashOnce (opts = {}) {
  const mode = opts.mode === 'local' ? 'local' : 'session' // 'session' | 'local'
  const storage = mode === 'local' ? window.localStorage : window.sessionStorage

  if (!initialized) {
    const seen = storage.getItem(KEY) === '1'
    splash.value = !seen
    // segno subito come visto per evitare riapparizioni con back/forward
    if (!seen) storage.setItem(KEY, '1')
    initialized = true

    // opzionale: auto-hide dopo N ms
    if (!seen && typeof opts.autoHideMs === 'number' && opts.autoHideMs > 0) {
      window.setTimeout(() => { splash.value = false }, opts.autoHideMs)
    }
  }

  const hide = () => { splash.value = false }
  const reset = () => { storage.removeItem(KEY); splash.value = true } // per debug

  return { showSplash: splash, hide, reset }
}

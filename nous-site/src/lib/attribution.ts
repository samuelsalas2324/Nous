// Origen del visitante (primer contacto). Se guarda al entrar y viaja con el registro,
// para saber qué campaña o canal trae prospectos.

const KEY = 'nous:attribution'
const FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const

export type Attribution = Partial<Record<(typeof FIELDS)[number] | 'referrer' | 'landing', string>>

const clip = (v: string) => v.slice(0, 100)

export function captureAttribution(): void {
  try {
    if (localStorage.getItem(KEY)) return // primer contacto: no se sobrescribe
    const params = new URLSearchParams(window.location.search)
    const out: Attribution = {}
    for (const f of FIELDS) {
      const v = params.get(f)
      if (v) out[f] = clip(v)
    }
    if (document.referrer) {
      try {
        const ref = new URL(document.referrer)
        if (ref.origin !== window.location.origin) out.referrer = clip(ref.hostname)
      } catch { /* referrer inválido */ }
    }
    out.landing = clip(window.location.pathname)
    localStorage.setItem(KEY, JSON.stringify(out))
  } catch { /* almacenamiento bloqueado */ }
}

export function readAttribution(): Attribution {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Attribution) : {}
  } catch {
    return {}
  }
}

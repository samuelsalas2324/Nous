import { useState } from 'react'
import { X, ArrowRight } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import type { NoticeAction } from '@/lib/demo'

const TONE = {
  info: 'bg-sand text-ink',
  warn: 'bg-[#FBEAE4] text-ink',
  urgent: 'bg-clay text-white',
} as const

function dismissKey(phase: string) { return `nous:notice-dismissed:${phase}` }
function wasDismissed(phase: string) {
  try { return sessionStorage.getItem(dismissKey(phase)) === '1' } catch { return false }
}

/** Aviso comercial de la demo: bienvenida, recordatorios antes del vencimiento y cierre. */
export default function DemoBanner({ onAction }: { onAction: (a: NoticeAction) => void }) {
  const { demo, track } = useAuth()
  const [dismissed, setDismissed] = useState<string | null>(null)
  const notice = demo?.notice
  if (!demo || !notice) return null
  // Los avisos de vencimiento (urgentes) no se pueden cerrar: son el momento de la conversión.
  const closable = notice.tone === 'info'
  if (closable && (dismissed === demo.phase || wasDismissed(demo.phase))) return null
  const urgent = notice.tone === 'urgent'

  return (
    <div role="status" className={`border-b border-line/60 ${TONE[notice.tone]}`}>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3 md:px-8">
        <div className="min-w-0 flex-1 basis-64">
          <p className="font-medium leading-snug">{notice.title}</p>
          <p className={`text-sm leading-snug ${urgent ? 'text-white/85' : 'text-mute'}`}>{notice.body}</p>
        </div>
        <button
          onClick={() => { track('notice_click'); onAction(notice.cta.action) }}
          className={`flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition ${
            urgent ? 'bg-white text-clay-dark hover:bg-paper' : 'bg-ink text-paper hover:bg-clay'
          }`}
        >
          {notice.cta.label} <ArrowRight className="h-4 w-4" />
        </button>
        {closable && (
          <button
            aria-label="Cerrar aviso"
            onClick={() => {
              setDismissed(demo.phase)
              try { sessionStorage.setItem(dismissKey(demo.phase), '1') } catch { /* sin almacenamiento */ }
            }}
            className="shrink-0 rounded-md p-1.5 text-mute transition hover:bg-black/5 hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

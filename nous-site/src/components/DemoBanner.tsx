import { useState } from 'react'
import { X, ArrowRight } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import type { NoticeAction } from '@/lib/demo'

const TONE = {
  info: 'bg-white/[0.06] text-ink',
  warn: 'bg-clay/[0.14] text-ink',
  urgent: 'bg-gradient-to-r from-clay/90 to-[#FF5E8A]/90 text-[#1d0c05]',
} as const

function dismissKey(uid: string, phase: string) { return `nous:notice-dismissed:${uid}:${phase}` }
function wasDismissed(uid: string, phase: string) {
  try { return sessionStorage.getItem(dismissKey(uid, phase)) === '1' } catch { return false }
}

/** Aviso comercial de la demo: bienvenida, recordatorios antes del vencimiento y cierre. */
export default function DemoBanner({ onAction }: { onAction: (a: NoticeAction) => void }) {
  const { demo, lead, track } = useAuth()
  const [dismissed, setDismissed] = useState<string | null>(null)
  const notice = demo?.notice
  if (!demo || !notice) return null
  // Los avisos de vencimiento (urgentes) no se pueden cerrar: son el momento de la conversión.
  const closable = notice.tone === 'info'
  if (closable && (dismissed === demo.phase || wasDismissed(lead?.uid ?? '', demo.phase))) return null
  const urgent = notice.tone === 'urgent'

  return (
    <div role="status" className={`border-b border-white/10 backdrop-blur-xl ${TONE[notice.tone]}`}>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3 md:px-8">
        <div className="min-w-0 flex-1 basis-64">
          <p className="font-medium leading-snug">{notice.title}</p>
          <p className={`text-sm leading-snug ${urgent ? 'text-[#1d0c05]/80' : 'text-mute'}`}>{notice.body}</p>
        </div>
        <button
          onClick={() => { track('notice_click'); onAction(notice.cta.action) }}
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-5 py-2 text-sm font-medium transition ${
            urgent ? 'bg-[#1d0c05] text-white hover:bg-black' : 'btn-primary'
          }`}
        >
          {notice.cta.label} <ArrowRight className="h-4 w-4" />
        </button>
        {closable && (
          <button
            aria-label="Cerrar aviso"
            onClick={() => {
              setDismissed(demo.phase)
              try { sessionStorage.setItem(dismissKey(lead?.uid ?? '', demo.phase), '1') } catch { /* sin almacenamiento */ }
            }}
            className="shrink-0 rounded-full p-1.5 text-mute transition hover:bg-white/10 hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

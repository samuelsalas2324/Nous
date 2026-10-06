import { Clock, LogOut } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAuth } from '@/context/AuthContext'
import { FUNNEL, funnelIndex, formatRemaining, type NoticeAction } from '@/lib/demo'
import { firstName } from '@/lib/validation'

/** Embudo del prospecto: dónde está hoy dentro de VISITANTE → … → CLIENTE. */
function FunnelProgress({ index }: { index: number }) {
  return (
    <ol className="flex items-center gap-1" aria-label="Etapa del proceso">
      {FUNNEL.map((s, i) => (
        <li key={s.id} className="flex-1" aria-current={i === index ? 'step' : undefined}>
          <div className={`h-1.5 rounded-full ${i <= index ? 'bg-gradient-to-r from-clay to-[#FF5E8A] shadow-[0_0_10px_rgb(255_122_77/0.6)]' : 'bg-white/10'}`} />
          <span className={`mt-1.5 block truncate text-[10px] leading-none ${i === index ? 'font-medium text-ink' : 'text-mute'}`}>{s.label}</span>
        </li>
      ))}
    </ol>
  )
}

const PILL = {
  info: 'border-white/15 bg-white/[0.07] text-ink',
  warn: 'border-clay/50 bg-clay/15 text-clay-dark',
  urgent: 'border-clay bg-gradient-to-r from-clay to-[#FF5E8A] text-[#1d0c05]',
} as const

export default function AccountMenu({ onAction }: { onAction: (a: NoticeAction) => void }) {
  const { user, lead, demo, logout, track } = useAuth()
  if (!user) return null
  const name = firstName(lead?.name || user.displayName || user.email || '')
  const initial = name.charAt(0).toUpperCase()
  const tone = demo?.notice?.tone ?? 'info'
  const isClient = demo?.phase === 'cliente'

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm backdrop-blur-xl transition hover:border-clay/70 ${PILL[tone]}`}
          aria-label="Mi cuenta y mi demo"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-clay to-[#FF5E8A] text-[13px] font-semibold text-[#1d0c05]">{initial}</span>
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            {isClient ? 'Cliente' : demo ? (<><Clock className="h-3.5 w-3.5" />{demo.phase === 'vencida' ? 'Demo terminada' : formatRemaining(demo.remainingMs)}</>) : name}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="glass-strong w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border-white/15 p-5 text-ink">
        <p className="font-serif text-2xl leading-tight">{lead?.name || name}</p>
        <p className="mt-0.5 truncate text-sm text-mute">{user.email}</p>

        {lead && demo && (
          <div className="mt-5 space-y-4">
            <FunnelProgress index={funnelIndex(lead.stage)} />
            {demo.notice && (
              <div className="rounded-xl border border-white/10 bg-white/[0.05] p-3.5">
                <p className="text-sm font-medium leading-snug">{demo.notice.title}</p>
                <p className="mt-1 text-sm leading-snug text-mute">{demo.notice.body}</p>
                <button
                  onClick={() => { track('notice_click'); onAction(demo.notice!.cta.action) }}
                  className="btn-primary mt-3 rounded-full px-4 py-2 text-sm"
                >
                  {demo.notice.cta.label}
                </button>
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => void logout()}
          className="mt-5 flex w-full items-center gap-2 border-t border-white/10 pt-4 text-sm text-mute transition hover:text-ink"
        >
          <LogOut className="h-4 w-4" /> Cerrar sesión
        </button>
      </PopoverContent>
    </Popover>
  )
}

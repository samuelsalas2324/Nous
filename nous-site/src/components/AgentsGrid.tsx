import { ArrowUpRight, Lock } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { DEMO_DAYS } from '@/lib/demo'
import { SALES_AGENTS, type SalesAgent } from '@/data/content'

/** Catálogo de agentes de ventas: el principal motor de registro y activación. */
export default function AgentsGrid({ activeId, onTry }: { activeId: string | null; onTry: (a: SalesAgent) => void }) {
  const { enabled, user, demo, ready } = useAuth()
  const locked = !!demo && !demo.hasAccess

  function label(a: SalesAgent) {
    if (a.id === activeId) return 'Hablando con este agente'
    if (!enabled) return 'Preguntar a Nous'
    if (!user && ready) return `Probar gratis ${DEMO_DAYS} días`
    if (locked) return 'Hablar con un asesor'
    return 'Probar ahora'
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {SALES_AGENTS.map((a) => {
        const active = a.id === activeId
        return (
          <article
            key={a.id}
            className={`glass spot group flex flex-col rounded-3xl p-6 transition duration-300 hover:-translate-y-1 md:p-7 ${
              active ? 'ring-1 ring-clay/60 shadow-[0_0_50px_-12px_rgb(255_122_77/0.55)]' : ''
            }`}
          >
            <div className="mb-8 flex items-center justify-between gap-3">
              <span className="glass flex h-11 w-11 items-center justify-center rounded-xl transition group-hover:shadow-[0_0_24px_-4px_rgb(255_122_77/0.7)]">
                <a.icon className="h-5 w-5 text-clay" strokeWidth={1.6} />
              </span>
              <ul className="flex flex-wrap justify-end gap-1.5">
                {a.channels.map((c) => (
                  <li key={c} className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 font-mono text-[10.5px] text-mute">{c}</li>
                ))}
              </ul>
            </div>
            <h3 className="text-2xl leading-snug">{a.name}</h3>
            <p className="mt-1 text-sm font-medium text-clay-dark">{a.role}</p>
            <p className="mt-3 flex-1 leading-relaxed text-mute">{a.desc}</p>
            <button
              onClick={() => onTry(a)}
              disabled={active}
              className="mt-6 flex items-center gap-1.5 self-start rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-medium text-ink transition hover:border-clay/50 hover:bg-clay/10 hover:text-clay-dark disabled:border-clay/40 disabled:text-clay-dark"
            >
              {locked && <Lock className="h-3.5 w-3.5" />}
              {label(a)}
              {!locked && !active && <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />}
            </button>
          </article>
        )
      })}
    </div>
  )
}

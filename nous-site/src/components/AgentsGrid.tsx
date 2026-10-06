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
    <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
      {SALES_AGENTS.map((a) => (
        <article key={a.id} className="group flex flex-col bg-paper p-6 transition hover:bg-white md:p-7">
          <div className="mb-8 flex items-center justify-between">
            <a.icon className="h-6 w-6 text-clay" strokeWidth={1.6} />
            <ul className="flex flex-wrap justify-end gap-1.5">
              {a.channels.map((c) => (
                <li key={c} className="rounded-full border border-line px-2 py-0.5 text-[11px] text-mute">{c}</li>
              ))}
            </ul>
          </div>
          <h3 className="text-2xl leading-snug">{a.name}</h3>
          <p className="mt-1 text-sm font-medium text-clay-dark">{a.role}</p>
          <p className="mt-3 flex-1 leading-relaxed text-mute">{a.desc}</p>
          <button
            onClick={() => onTry(a)}
            disabled={a.id === activeId}
            className="mt-6 flex items-center gap-1.5 self-start text-sm font-medium text-ink transition group-hover:text-clay disabled:text-clay"
          >
            {locked && <Lock className="h-3.5 w-3.5" />}
            {label(a)}
            {!locked && a.id !== activeId && <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />}
          </button>
        </article>
      ))}
    </div>
  )
}

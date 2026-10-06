import { useEffect, useRef, useState } from 'react'
import { ArrowUp, RotateCcw, X } from 'lucide-react'
import { Markdown } from './Markdown'
import { LogoMark } from './Logo'
import { useAuth } from '@/context/AuthContext'
import { DEMO_DAYS } from '@/lib/demo'
import { CATEGORIES, type SalesAgent } from '@/data/content'

type Msg = { role: 'user' | 'assistant'; content: string }
export type Prefill = { text: string; nonce: number } | null
type ChatError = { text: string; cta?: 'login' | 'advisor' } | null

// Tras estas preguntas, al visitante se le invita a registrarse para probar los agentes.
const NUDGE_AFTER = 2

const MAX_CHARS = 2000

// Saludo según la hora local de quien visita la página
function getGreeting(now = new Date()) {
  const h = now.getHours()
  if (h >= 5 && h < 12) return { hello: 'Buenos días', line: '¿Qué proceso te gustaría quitarte de encima hoy?' }
  if (h >= 12 && h < 20) return { hello: 'Buenas tardes', line: '¿Qué podemos automatizar esta tarde?' }
  return { hello: 'Buenas noches', line: '¿Qué idea quieres convertir en un agente de IA?' }
}

function errorText(status: number, code?: string): NonNullable<ChatError> {
  if (status === 401) return { text: 'Inicia sesión para hablar con los agentes de ventas.', cta: 'login' }
  if (status === 403 && code === 'demo_expired') return { text: 'Tu demo terminó y los agentes quedaron en pausa. Un asesor puede habilitarte el acceso completo.', cta: 'advisor' }
  if (status === 403) return { text: 'Tu cuenta aún no tiene una demo activa. Cierra sesión y vuelve a ingresar para activarla.' }
  if (status === 404) return { text: 'Nous aún no está conectado: falta desplegar la función /api/chat y definir ANTHROPIC_API_KEY en Vercel.' }
  if (status === 429) return { text: 'Demasiadas consultas seguidas. Espera un momento e inténtalo de nuevo.' }
  if (status === 400 || status === 413) return { text: 'No pude procesar ese mensaje. Prueba con uno más corto.' }
  return { text: 'Algo falló al consultar a Nous. Inténtalo de nuevo en unos segundos.' }
}

export default function Chat({ prefill, agent, onExitAgent }: { prefill: Prefill; agent: SalesAgent | null; onExitAgent: () => void }) {
  const { user, openAuth, getToken, track, contactAdvisor } = useAuth()
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ChatError>(null)
  const [cat, setCat] = useState<string | null>(null)
  const [nudgeClosed, setNudgeClosed] = useState(false)
  const [greeting] = useState(() => getGreeting())
  const scrollRef = useRef<HTMLDivElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)

  const empty = messages.length === 0
  const active = CATEGORIES.find((c) => c.id === cat)
  const userTurns = messages.filter((m) => m.role === 'user').length
  const showNudge = !user && !agent && !nudgeClosed && userTurns >= NUDGE_AFTER && !loading

  // Cambiar de agente (o volver a Nous) empieza una conversación nueva.
  const agentId = agent?.id
  useEffect(() => {
    setMessages([])
    setError(null)
    setInput('')
  }, [agentId])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    const ta = taRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 168) + 'px'
  }, [input, empty])

  useEffect(() => {
    if (prefill) void send(prefill.text)
    // eslint-disable-next-line
  }, [prefill?.nonce])

  async function send(text: string) {
    const content = text.trim().slice(0, MAX_CHARS)
    if (!content || loading) return
    const previous = messages
    const next: Msg[] = [...previous, { role: 'user', content }]
    setMessages(next)
    setInput('')
    setCat(null)
    setError(null)
    setLoading(true)
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (agent) {
        // Los agentes exigen sesión: el servidor valida el token y que la demo siga vigente.
        const token = await getToken()
        if (!token) {
          setError(errorText(401))
          setMessages(previous)
          setInput(content)
          return
        }
        headers.Authorization = `Bearer ${token}`
      }
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ messages: next.slice(-11), ...(agent && { agent: agent.id }) }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.reply) {
        setError(errorText(res.status, data?.error))
        setMessages(previous)
        setInput(content)
        return
      }
      setMessages([...next, { role: 'assistant', content: data.reply }])
      if (agent) track('agent_message', { agentId: agent.id, text: content })
    } catch {
      setError(errorText(0))
      setMessages(previous)
      setInput(content)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass glow-border overflow-hidden rounded-[28px] shadow-[0_40px_120px_-40px_rgb(255_110_80/0.4)]">
      {/* Zona superior: saludo (vacío) o conversación */}
      {empty ? (
        <div className="bg-gradient-to-b from-clay/[0.10] via-violet/[0.04] to-transparent px-5 pb-8 pt-14 md:pt-20">
          <div className="mx-auto max-w-2xl text-center">
            <span className="mb-6 inline-flex items-center gap-2 glass rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-mute">
              <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-clay opacity-50" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-clay" /></span> {agent ? 'Agente de ventas' : 'Nous'} · en línea
            </span>
            {agent ? (
              <>
                <div className="flex items-center justify-center gap-3.5">
                  <agent.icon className="h-9 w-9 shrink-0 text-clay md:h-11 md:w-11" strokeWidth={1.5} />
                  <h2 className="text-3xl md:text-[2.75rem] md:leading-none">{agent.name}</h2>
                </div>
                <p className="mt-4 text-lg text-mute">{agent.role}. Cuéntame de tu negocio y empiezo.</p>
                <button onClick={onExitAgent} className="mt-4 text-sm text-mute underline-offset-4 hover:text-ink hover:underline">Volver a hablar con Nous</button>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center gap-3.5">
                  <LogoMark variant="plain" className="h-10 w-10 shrink-0 md:h-12 md:w-12" />
                  <h2 className="text-4xl md:text-[3.25rem] md:leading-none">{greeting.hello}</h2>
                </div>
                <p className="mt-4 text-lg text-mute">{greeting.line}</p>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between px-5 pt-4">
            <div className="flex items-center gap-2.5 text-sm">
              {agent ? <agent.icon className="h-5 w-5 text-clay" strokeWidth={1.7} /> : <LogoMark className="h-6 w-6" />}
              <span className="font-medium">{agent ? agent.name : 'Nous'}</span>
              <span className="hidden text-mute sm:inline">· {agent ? 'agente de ventas' : 'en línea'}</span>
            </div>
            <button
              onClick={() => { setMessages([]); setError(null) }}
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-sm text-mute transition hover:bg-white/10 hover:text-ink"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Nueva conversación
            </button>
          </div>
          <div ref={scrollRef} className="max-h-[480px] min-h-[200px] space-y-6 overflow-y-auto px-5 py-6">
            {messages.map((m, i) =>
              m.role === 'user' ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md border border-white/10 bg-gradient-to-br from-clay/[0.22] to-violet/[0.16] px-4 py-2.5 shadow-[inset_0_1px_0_rgb(255_255_255/0.15)] text-[15.5px] leading-relaxed">
                    {m.content}
                  </div>
                </div>
              ) : (
                <div key={i} className="flex gap-3">
                  <LogoMark className="mt-0.5 h-6 w-6 shrink-0" />
                  <div className="min-w-0 flex-1"><Markdown text={m.content} /></div>
                </div>
              ),
            )}
            {loading && (
              <div className="flex gap-3">
                <LogoMark className="mt-0.5 h-6 w-6 shrink-0" />
                <div className="flex items-center gap-1.5 pt-2.5" aria-label="Nous está pensando">
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-clay/70" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compositor (siempre montado para conservar el foco) */}
      <div className={`mx-auto px-4 ${empty ? 'max-w-2xl' : 'max-w-3xl pb-4'}`}>
        {error && (
          <div role="alert" className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-clay/30 bg-clay/10 px-3 py-2 text-sm text-clay-dark backdrop-blur-md">
            <p className="min-w-0 flex-1 basis-56">{error.text}</p>
            {error.cta === 'login' && (
              <button onClick={() => openAuth('login')} className="btn-primary shrink-0 rounded-full px-4 py-1.5 text-sm">Ingresar</button>
            )}
            {error.cta === 'advisor' && (
              <button onClick={contactAdvisor} className="btn-primary shrink-0 rounded-full px-4 py-1.5 text-sm">Hablar con un asesor</button>
            )}
          </div>
        )}
        {showNudge && (
          <div className="mb-2 flex items-start gap-3 glass rounded-2xl border-clay/30 px-3.5 py-3 text-sm">
            <div className="min-w-0 flex-1">
              <p className="font-medium">¿Quieres verlo funcionando con tu negocio?</p>
              <p className="mt-0.5 text-mute">Prueba gratis {DEMO_DAYS} días los agentes de ventas de Nous. Sin tarjeta.</p>
              <button onClick={() => openAuth('register')} className="btn-primary mt-2.5 rounded-full px-4 py-2 text-sm">Crear mi cuenta gratis</button>
            </div>
            <button aria-label="Cerrar" onClick={() => setNudgeClosed(true)} className="shrink-0 rounded-full p-1 text-mute transition hover:bg-white/10 hover:text-ink"><X className="h-4 w-4" /></button>
          </div>
        )}
        <div className="glass-input rounded-2xl">
          <textarea
            ref={taRef}
            rows={empty ? 2 : 1}
            value={input}
            maxLength={MAX_CHARS}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(input) }
            }}
            placeholder={agent ? `Cuéntale a ${agent.name} sobre tu negocio…` : empty ? '¿En qué puedo ayudarte con IA hoy?' : 'Responde a Nous…'}
            className="block max-h-44 w-full resize-none bg-transparent px-4 pb-1 pt-4 text-[16px] leading-relaxed outline-none placeholder:text-mute/70"
          />
          <div className="flex items-center justify-between px-3 pb-3 pt-1">
            <span className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-mute">
              <LogoMark variant="plain" className="h-4 w-4" /> {agent ? agent.name : 'Nous'}
            </span>
            <div className="flex items-center gap-3">
              <span className="hidden text-xs text-mute/80 sm:block">Enter para enviar · Shift + Enter, salto de línea</span>
              <button
                onClick={() => void send(input)}
                disabled={!input.trim() || loading}
                aria-label="Enviar"
                className="btn-primary flex h-10 w-10 items-center justify-center rounded-full"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Chips de categorías + lista de preguntas (como en la home de Claude) */}
        {empty && agent && (
          <ul className="glass mb-12 mt-4 divide-y divide-white/10 overflow-hidden rounded-2xl">
            {agent.starters.map((p) => (
              <li key={p}>
                <button onClick={() => void send(p)} className="w-full px-4 py-3 text-left text-[15px] transition hover:bg-white/10">{p}</button>
              </li>
            ))}
          </ul>
        )}
        {empty && !agent && (
          <div className="pb-12 pt-4">
            <div className="flex flex-wrap justify-center gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCat(cat === c.id ? null : c.id)}
                  aria-pressed={cat === c.id}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm backdrop-blur-md transition ${
                    cat === c.id ? 'border-clay/70 bg-clay/15 text-clay-dark' : 'border-white/10 bg-white/[0.05] text-ink hover:border-clay/50 hover:bg-white/10'
                  }`}
                >
                  <c.icon className="h-4 w-4 text-clay" strokeWidth={1.8} /> {c.label}
                </button>
              ))}
            </div>
            {active && (
              <ul className="glass mt-4 divide-y divide-white/10 overflow-hidden rounded-2xl">
                {active.prompts.map((p) => (
                  <li key={p}>
                    <button onClick={() => void send(p)} className="w-full px-4 py-3 text-left text-[15px] transition hover:bg-white/10">
                      {p}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {!empty && (
          <p className="mt-2 px-1 text-center text-xs text-mute">
            Nous es una IA y puede equivocarse. Verifica la información crítica y no compartas datos sensibles.
          </p>
        )}
      </div>
    </div>
  )
}

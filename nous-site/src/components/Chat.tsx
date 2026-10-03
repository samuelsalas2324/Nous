import { useEffect, useRef, useState } from 'react'
import { ArrowUp, RotateCcw } from 'lucide-react'
import { Markdown } from './Markdown'
import { LogoMark } from './Logo'
import { CATEGORIES } from '@/data/content'

type Msg = { role: 'user' | 'assistant'; content: string }
export type Prefill = { text: string; nonce: number } | null

const MAX_CHARS = 2000

// Saludo según la hora local de quien visita la página
function getGreeting(now = new Date()) {
  const h = now.getHours()
  if (h >= 5 && h < 12) return { hello: 'Buenos días', line: '¿Qué proceso te gustaría quitarte de encima hoy?' }
  if (h >= 12 && h < 20) return { hello: 'Buenas tardes', line: '¿Qué podemos automatizar esta tarde?' }
  return { hello: 'Buenas noches', line: '¿Qué idea quieres convertir en un agente de IA?' }
}

function errorText(status: number): string {
  if (status === 404) return 'Nous aún no está conectado: falta desplegar la función /api/chat y definir ANTHROPIC_API_KEY en Vercel.'
  if (status === 429) return 'Demasiadas consultas seguidas. Espera un momento e inténtalo de nuevo.'
  if (status === 400 || status === 413) return 'No pude procesar ese mensaje. Prueba con uno más corto.'
  return 'Algo falló al consultar a Nous. Inténtalo de nuevo en unos segundos.'
}

export default function Chat({ prefill }: { prefill: Prefill }) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cat, setCat] = useState<string | null>(null)
  const [greeting] = useState(() => getGreeting())
  const scrollRef = useRef<HTMLDivElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)

  const empty = messages.length === 0
  const active = CATEGORIES.find((c) => c.id === cat)

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
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.slice(-11) }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.reply) {
        setError(errorText(res.status))
        setMessages(previous)
        setInput(content)
        return
      }
      setMessages([...next, { role: 'assistant', content: data.reply }])
    } catch {
      setError(errorText(0))
      setMessages(previous)
      setInput(content)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-line bg-white/75 shadow-[0_40px_90px_-50px_rgba(201,100,66,0.45)] backdrop-blur">
      {/* Zona superior: saludo (vacío) o conversación */}
      {empty ? (
        <div className="bg-gradient-to-b from-clay/[0.07] to-transparent px-5 pb-8 pt-14 md:pt-20">
          <div className="mx-auto max-w-2xl text-center">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1 text-xs text-mute">
              <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-clay opacity-50" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-clay" /></span> Nous · en línea
            </span>
            <div className="flex items-center justify-center gap-3.5">
              <LogoMark variant="plain" className="h-10 w-10 shrink-0 md:h-12 md:w-12" />
              <h2 className="text-4xl md:text-[3.25rem] md:leading-none">{greeting.hello}</h2>
            </div>
            <p className="mt-4 text-lg text-mute">{greeting.line}</p>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between px-5 pt-4">
            <div className="flex items-center gap-2.5 text-sm">
              <LogoMark className="h-6 w-6" />
              <span className="font-medium">Nous</span>
              <span className="hidden text-mute sm:inline">· en línea</span>
            </div>
            <button
              onClick={() => { setMessages([]); setError(null) }}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-mute transition hover:bg-sand hover:text-ink"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Nueva conversación
            </button>
          </div>
          <div ref={scrollRef} className="max-h-[480px] min-h-[200px] space-y-6 overflow-y-auto px-5 py-6">
            {messages.map((m, i) =>
              m.role === 'user' ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-sand px-4 py-2.5 text-[15.5px] leading-relaxed">
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
          <p role="alert" className="mb-2 rounded-lg bg-[#FBEAE4] px-3 py-2 text-sm text-clay-dark">{error}</p>
        )}
        <div className="rounded-2xl border border-line bg-white shadow-[0_2px_20px_-8px_rgba(31,30,29,0.18)] transition focus-within:border-clay/60 focus-within:shadow-[0_2px_28px_-6px_rgba(201,100,66,0.28)]">
          <textarea
            ref={taRef}
            rows={empty ? 2 : 1}
            value={input}
            maxLength={MAX_CHARS}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(input) }
            }}
            placeholder={empty ? '¿En qué puedo ayudarte con IA hoy?' : 'Responde a Nous…'}
            className="block max-h-44 w-full resize-none bg-transparent px-4 pb-1 pt-4 text-[16px] leading-relaxed outline-none placeholder:text-mute/70"
          />
          <div className="flex items-center justify-between px-3 pb-3 pt-1">
            <span className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-mute">
              <LogoMark variant="plain" className="h-4 w-4" /> Nous
            </span>
            <div className="flex items-center gap-3">
              <span className="hidden text-xs text-mute/80 sm:block">Enter para enviar · Shift + Enter, salto de línea</span>
              <button
                onClick={() => void send(input)}
                disabled={!input.trim() || loading}
                aria-label="Enviar"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-clay text-white transition hover:bg-clay-dark disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Chips de categorías + lista de preguntas (como en la home de Claude) */}
        {empty && (
          <div className="pb-12 pt-4">
            <div className="flex flex-wrap justify-center gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCat(cat === c.id ? null : c.id)}
                  aria-pressed={cat === c.id}
                  className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm transition ${
                    cat === c.id ? 'border-clay bg-white text-clay-dark' : 'border-line bg-paper text-ink hover:border-clay/60'
                  }`}
                >
                  <c.icon className="h-4 w-4 text-clay" strokeWidth={1.8} /> {c.label}
                </button>
              ))}
            </div>
            {active && (
              <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
                {active.prompts.map((p) => (
                  <li key={p}>
                    <button onClick={() => void send(p)} className="w-full px-4 py-3 text-left text-[15px] transition hover:bg-sand">
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

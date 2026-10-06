import { Fragment } from 'react'
import { ChevronRight, ChevronDown, FileText, Check, UserCheck, Lock } from 'lucide-react'
import { useInView } from './Reveal'

export function FlowVisual() {
  const nodes = [
    { t: 'Entra un correo', s: 'Un cliente pregunta por su factura' },
    { t: 'Nous clasifica', s: 'Detecta la intención y el cliente' },
    { t: 'Consulta el sistema', s: 'Busca la factura correcta' },
    { t: 'Una persona aprueba', s: 'Revisa y autoriza el envío', human: true },
  ]
  return (
    <div>
    <ol className="flex flex-col gap-1.5 md:flex-row md:items-stretch md:gap-0">
      {nodes.map((n, i) => (
        <Fragment key={n.t}>
          <li className={`flex-1 rounded-xl border p-3.5 backdrop-blur-md ${n.human ? 'border-clay/50 bg-clay/10 shadow-[0_0_30px_-10px_rgb(255_122_77/0.6)]' : 'border-white/10 bg-white/[0.04]'}`}>
            <p className="text-sm font-medium">{n.t}</p>
            <p className="mt-0.5 text-[13px] leading-snug text-mute">{n.s}</p>
          </li>
          {i < nodes.length - 1 && (
            <li aria-hidden className="flex items-center justify-center md:px-1.5">
              <ChevronRight className="hidden h-4 w-4 text-clay/70 md:block" />
              <ChevronDown className="h-4 w-4 text-clay/70 md:hidden" />
            </li>
          )}
        </Fragment>
      ))}
    </ol>
    <p className="mt-4 text-[13px] leading-snug text-mute">
      Cada paso queda registrado y es auditable, y lo sensible siempre espera a una persona.
    </p>
    </div>
  )
}

export function DocsVisual() {
  const files = ['Política de devoluciones.pdf', 'Manual de ventas.docx', 'Preguntas frecuentes.md']
  return (
    <div className="space-y-2">
      {files.map((f, i) => (
        <div key={f} className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-[13px] backdrop-blur-md ${i === 0 ? 'border-clay/50 bg-clay/10' : 'border-white/10 bg-white/[0.04]'}`}>
          <FileText className="h-4 w-4 shrink-0 text-clay" strokeWidth={1.7} />
          <span className="truncate">{f}</span>
        </div>
      ))}
      <p className="pt-1 text-[13px] leading-snug text-mute">
        Cada respuesta cita la fuente exacta y respeta los permisos de cada persona.
      </p>
    </div>
  )
}

export function BarsVisual() {
  const h = [18, 26, 22, 38, 46, 62]
  return (
    <svg viewBox="0 0 220 84" className="w-full" role="img" aria-label="Gráfico ilustrativo de tendencia al alza">
      <defs>
        <linearGradient id="bars-hot" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#FF8A5C" />
          <stop offset="1" stopColor="#FF5E8A" />
        </linearGradient>
      </defs>
      {h.map((v, i) => (
        <rect key={i} x={8 + i * 35} y={80 - v} width="22" height={v} rx="5" fill={i === h.length - 1 ? 'url(#bars-hot)' : 'rgb(255 255 255 / 0.13)'} />
      ))}
      <path d="M19 58L54 50L89 54L124 36L159 28L194 12" stroke="rgb(240 238 250 / 0.85)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" strokeDasharray="3 4" />
      <circle cx="194" cy="12" r="3.5" fill="#fff" />
    </svg>
  )
}

export function PermsVisual() {
  const rows = [
    { icon: Check, label: 'Leer facturas y pedidos', pill: 'Permitido', cls: 'bg-aqua/15 text-aqua' },
    { icon: UserCheck, label: 'Enviar correos a clientes', pill: 'Requiere aprobación', cls: 'bg-clay/15 text-clay-dark' },
    { icon: Lock, label: 'Eliminar datos', pill: 'Bloqueado', cls: 'bg-white/10 text-ink/80' },
  ]
  return (
    <ul className="divide-y divide-white/10 rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-md">
      {rows.map((r) => (
        <li key={r.label} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm">
          <span className="flex items-center gap-2.5">
            <r.icon className="h-4 w-4 text-clay" strokeWidth={1.8} /> {r.label}
          </span>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${r.cls}`}>{r.pill}</span>
        </li>
      ))}
    </ul>
  )
}

const TRACE = [
  { tag: 'ENTRADA', color: 'text-ink/50', text: 'Correo de cliente: “¿Dónde está mi factura de septiembre?”' },
  { tag: 'RAZONA', color: 'text-[#FF9C78]', text: 'Intención detectada → consulta de facturación' },
  { tag: 'HERRAMIENTA', color: 'text-[#E8D49A]', text: 'buscar_factura(cliente="C-1042", mes="09")' },
  { tag: 'RESULTADO', color: 'text-ink/50', text: 'Factura encontrada · emitida el 03/09' },
  { tag: 'REDACTA', color: 'text-[#FF9C78]', text: 'Borrador de respuesta con enlace a la factura' },
  { tag: 'HUMANO', color: 'text-[#FFB59B]', text: 'Pausa: una persona revisa y aprueba el envío' },
  { tag: 'LISTO', color: 'text-[#7DE3C0]', text: 'Respuesta enviada · ticket cerrado' },
]

export function AgentTrace() {
  const { ref, on } = useInView<HTMLDivElement>(0.25)
  return (
    <div ref={ref} className="glass-strong overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF6B6B]/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FFC857]/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#5EE0A0]/70" />
        </div>
        <span className="font-mono text-xs text-ink/50">traza de un agente · ejemplo ilustrativo</span>
      </div>
      <ul className="space-y-3 px-5 py-5 font-mono text-[13px] leading-relaxed">
        {TRACE.map((l, i) => (
          <li
            key={l.tag}
            style={{ transitionDelay: `${i * 380}ms` }}
            className={`flex gap-4 transition duration-500 motion-reduce:translate-x-0 motion-reduce:opacity-100 motion-reduce:transition-none ${
              on ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'
            }`}
          >
            <span className={`w-[92px] shrink-0 pt-px text-[11px] tracking-wider ${l.color}`}>{l.tag}</span>
            <span className="text-ink/90">{l.text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

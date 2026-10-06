// Lógica pura del embudo comercial: sin Firebase ni React, para poder probarla en aislamiento.
// VISITANTE → REGISTRO → DEMO → INTERACCIÓN → SEGUIMIENTO → CLIENTE

export const DEMO_DAYS = 3
const HOUR = 3_600_000
export const DEMO_MS = DEMO_DAYS * 24 * HOUR

/** Estado del prospecto guardado en Firestore. Visitante y registro son momentos, no estados persistidos. */
export type Stage = 'demo' | 'interaccion' | 'seguimiento' | 'cliente'
export type Interest = 'bajo' | 'medio' | 'alto'
export type InteractionType = 'register' | 'login' | 'agent_selected' | 'agent_message' | 'advisor_request' | 'notice_click'
export type DemoPhase = 'activa' | 'por_vencer' | 'ultimo_dia' | 'ultimas_horas' | 'vencida' | 'cliente'

export const FUNNEL = [
  { id: 'visitante', label: 'Visitante' },
  { id: 'registro', label: 'Registro' },
  { id: 'demo', label: 'Demo' },
  { id: 'interaccion', label: 'Interacción' },
  { id: 'seguimiento', label: 'Seguimiento' },
  { id: 'cliente', label: 'Cliente' },
] as const

const STAGE_INDEX: Record<Stage, number> = { demo: 2, interaccion: 3, seguimiento: 4, cliente: 5 }
/** Posición (0–5) del prospecto dentro de FUNNEL. */
export const funnelIndex = (stage: Stage) => STAGE_INDEX[stage]

/** Prospecto tal como lo usa la interfaz (fechas en milisegundos). */
export interface Lead {
  uid: string
  name: string
  email: string
  phone: string
  stage: Stage
  registeredAt: number
  lastActivityAt: number
  demoExpiresAt: number
  interactionCount: number
  messageCount: number
  agentsTried: string[]
  assignedAgent: string
  interest: Interest
  score: number
  advisorRequested: boolean
}

export function demoPhase(stage: Stage, demoExpiresAt: number, now: number): DemoPhase {
  if (stage === 'cliente') return 'cliente'
  const left = demoExpiresAt - now
  if (left <= 0) return 'vencida'
  if (left <= 6 * HOUR) return 'ultimas_horas'
  if (left <= 24 * HOUR) return 'ultimo_dia'
  if (left <= 48 * HOUR) return 'por_vencer'
  return 'activa'
}

export function formatRemaining(ms: number): string {
  if (ms <= 0) return 'terminada'
  const min = Math.floor(ms / 60_000)
  const d = Math.floor(min / 1440)
  const h = Math.floor((min % 1440) / 60)
  const m = min % 60
  if (d > 0) return `${d} d ${h} h`
  if (h > 0) return `${h} h ${m} min`
  return m > 0 ? `${m} min` : 'menos de 1 min'
}

export type NoticeAction = 'agents' | 'advisor'
export interface Notice {
  tone: 'info' | 'warn' | 'urgent'
  title: string
  body: string
  cta: { label: string; action: NoticeAction }
}

/** Mensaje comercial según el momento de la demo. Misma fuente para la web y, más adelante, WhatsApp o correo. */
export function demoNotice(i: { phase: DemoPhase; remainingMs: number; interactions: number; firstName: string }): Notice | null {
  const left = formatRemaining(i.remainingMs)
  const untouched = i.interactions === 0
  switch (i.phase) {
    case 'cliente':
      return null
    case 'activa':
      return untouched
        ? {
            tone: 'info',
            title: `${i.firstName}, tu demo de 3 días está activa`,
            body: 'Empieza por el Calificador de prospectos: en dos minutos ves cómo priorizaría a tus contactos.',
            cta: { label: 'Probar un agente', action: 'agents' },
          }
        : {
            tone: 'info',
            title: `Vas bien, ${i.firstName}`,
            body: `Ya probaste un agente. Compara con otro y mira cuál encaja mejor con tu proceso. Te quedan ${left}.`,
            cta: { label: 'Probar otro agente', action: 'agents' },
          }
    case 'por_vencer':
      return untouched
        ? {
            tone: 'warn',
            title: `Te quedan ${left} y aún no probaste ningún agente`,
            body: 'Elige uno y cuéntale de tu negocio: el resultado se ve en una sola conversación.',
            cta: { label: 'Probar un agente', action: 'agents' },
          }
        : {
            tone: 'warn',
            title: `Tu demo termina en ${left}`,
            body: 'Si lo que viste te sirve, un asesor puede armarte el plan para llevarlo a tu equipo antes de que termine.',
            cta: { label: 'Hablar con un asesor', action: 'advisor' },
          }
    case 'ultimo_dia':
      return {
        tone: 'warn',
        title: `Último día de demo: quedan ${left}`,
        body: 'Agenda 15 minutos con un asesor y llévate un plan de implementación para tu negocio.',
        cta: { label: 'Agendar con un asesor', action: 'advisor' },
      }
    case 'ultimas_horas':
      return {
        tone: 'urgent',
        title: `Últimas horas: quedan ${left}`,
        body: 'Después de este plazo los agentes quedan en pausa. Habla con un asesor para no perder lo que ya probaste.',
        cta: { label: 'Hablar con un asesor', action: 'advisor' },
      }
    case 'vencida':
      return {
        tone: 'urgent',
        title: `${i.firstName}, tu demo terminó`,
        body: 'Los agentes están en pausa, pero tu cuenta sigue activa. Un asesor puede habilitarte el acceso completo.',
        cta: { label: 'Quiero continuar', action: 'advisor' },
      }
  }
}

export interface Signals {
  messageCount: number
  agentsTried: number
  advisorRequested: boolean
}

/** Lead scoring base. Cada señal pesa distinto; pedir un asesor es la más fuerte. Reemplazable por un modelo propio. */
export function scoreLead(s: Signals): { score: number; interest: Interest } {
  const score = Math.min(100, s.messageCount * 8 + s.agentsTried * 12 + (s.advisorRequested ? 40 : 0))
  return { score, interest: score >= 60 ? 'alto' : score >= 25 ? 'medio' : 'bajo' }
}

export type LeadState = Pick<Lead, 'stage' | 'interactionCount' | 'messageCount' | 'agentsTried' | 'advisorRequested' | 'demoExpiresAt' | 'score' | 'interest'>

export interface LeadChange {
  stage?: Stage
  interactionCount?: number
  messageCount?: number
  newAgent?: string
  advisorRequested?: boolean
  score?: number
  interest?: Interest
  /** Agente que queda como asignado: el primero que el prospecto elige. */
  assignAgent?: string
}

/** Calcula qué cambia en el prospecto cuando ocurre una interacción. Devuelve solo lo que cambia. */
export function applyInteraction(lead: LeadState, type: InteractionType, now: number, agentId?: string): LeadChange {
  const change: LeadChange = {}
  const expired = now >= lead.demoExpiresAt

  const engages = type === 'agent_selected' || type === 'agent_message'
  if (type !== 'login' && type !== 'register') change.interactionCount = lead.interactionCount + 1
  if (type === 'agent_message') change.messageCount = lead.messageCount + 1
  if (engages && agentId && !lead.agentsTried.includes(agentId)) change.newAgent = agentId
  if (type === 'advisor_request' && !lead.advisorRequested) change.advisorRequested = true

  if (engages && lead.stage === 'demo') {
    change.stage = 'interaccion'
    if (agentId) change.assignAgent = agentId
  } else if (type === 'advisor_request' && (lead.stage === 'demo' || lead.stage === 'interaccion')) {
    change.stage = 'seguimiento'
  } else if (type === 'login' && expired && (lead.stage === 'demo' || lead.stage === 'interaccion')) {
    change.stage = 'seguimiento'
  }

  const scored = scoreLead({
    messageCount: change.messageCount ?? lead.messageCount,
    agentsTried: lead.agentsTried.length + (change.newAgent ? 1 : 0),
    advisorRequested: change.advisorRequested ?? lead.advisorRequested,
  })
  if (scored.score !== lead.score) change.score = scored.score
  if (scored.interest !== lead.interest) change.interest = scored.interest
  return change
}

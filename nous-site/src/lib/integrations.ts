// Puntos de extensión para el seguimiento comercial. Hoy el único canal activo es la web
// (banner, panel de la demo y chat). Aquí se enchufan después WhatsApp, correo y campañas
// sin tocar el embudo: todo parte de los mismos avisos que ya ve el prospecto.
import { demoNotice, demoPhase, type DemoPhase, type Lead, type Notice } from './demo'
import { firstName } from './validation'

export type ChannelId = 'web' | 'whatsapp' | 'email'

export interface OutboundMessage {
  leadId: string
  channel: ChannelId
  /** Fase de la demo que originó el mensaje; sirve de id de plantilla (p. ej. `ultimo_dia`). */
  templateId: DemoPhase
  notice: Notice
}

export interface ChannelAdapter {
  id: ChannelId
  /** Respeta el consentimiento: lead.channels.<canal> en Firestore. */
  canSend(lead: Lead): boolean
  send(message: OutboundMessage): Promise<void>
}

/** Registro de canales. Para integrar WhatsApp: `channels.whatsapp = { id: 'whatsapp', canSend, send }`. */
export const channels: Partial<Record<ChannelId, ChannelAdapter>> = {}

/** El mensaje que le corresponde enviar a este prospecto ahora mismo (null si es cliente). */
export function nextMessage(lead: Lead, channel: ChannelId, now = Date.now()): OutboundMessage | null {
  const phase = demoPhase(lead.stage, lead.demoExpiresAt, now)
  const notice = demoNotice({
    phase,
    remainingMs: Math.max(0, lead.demoExpiresAt - now),
    interactions: lead.interactionCount,
    firstName: firstName(lead.name),
  })
  return notice ? { leadId: lead.uid, channel, templateId: phase, notice } : null
}

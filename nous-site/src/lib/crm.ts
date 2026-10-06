// Capa de datos: Firebase Authentication + Firestore. Solo se carga (import dinámico) cuando hace falta,
// para que los visitantes no descarguen el SDK antes de ver la página.
//
// Esquema (ver firestore.rules):
//   leads/{uid}                      prospecto: datos, estado, actividad, vencimiento, agente asignado, interés
//   leads/{uid}/interactions/{id}    bitácora de interacciones
//   leads/{uid}/internal/commercial  notas comerciales y responsable (solo equipo; el prospecto no lo lee)

import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail,
  updateProfile, onAuthStateChanged, type User, type Unsubscribe,
} from 'firebase/auth'
import {
  doc, collection, onSnapshot, writeBatch, serverTimestamp, increment, arrayUnion, Timestamp,
  type DocumentData,
} from 'firebase/firestore'
import { getServices } from './firebase'
import { readAttribution } from './attribution'
import { applyInteraction, DEMO_MS, DEMO_DAYS, type InteractionType, type Lead, type Stage, type Interest } from './demo'
import { DEFAULT_AGENT } from '@/data/content'

function svc() {
  const s = getServices()
  if (!s) throw new Error('firebase-not-configured')
  return s
}

const ms = (v: unknown): number => (v instanceof Timestamp ? v.toMillis() : typeof v === 'number' ? v : Date.now())

function parseLead(uid: string, d: DocumentData): Lead {
  return {
    uid,
    name: String(d.name ?? ''),
    email: String(d.email ?? ''),
    phone: String(d.phone ?? ''),
    stage: (d.stage as Stage) ?? 'demo',
    registeredAt: ms(d.registeredAt),
    lastActivityAt: ms(d.lastActivityAt),
    demoExpiresAt: ms(d.demoExpiresAt),
    interactionCount: Number(d.interactionCount ?? 0),
    messageCount: Number(d.messageCount ?? 0),
    agentsTried: Array.isArray(d.agentsTried) ? d.agentsTried.map(String) : [],
    assignedAgent: String(d.assignedAgent ?? DEFAULT_AGENT),
    interest: (d.interest as Interest) ?? 'bajo',
    score: Number(d.score ?? 0),
    advisorRequested: d.advisorRequestedAt != null,
  }
}

export function watchAuth(cb: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(svc().auth, cb)
}

/** `null` = el prospecto aún no existe en el servidor (cuenta creada sin demo). */
export function watchLead(uid: string, cb: (lead: Lead | null) => void): Unsubscribe {
  return onSnapshot(
    doc(svc().db, 'leads', uid),
    (snap) => {
      if (snap.exists()) cb(parseLead(uid, snap.data({ serverTimestamps: 'estimate' })))
      else if (!snap.metadata.fromCache) cb(null)
    },
    (err) => console.error('No se pudo leer el prospecto', err.code),
  )
}

export interface RegisterInput { name: string; email: string; phone: string; password: string }

const PENDING_KEY = 'nous:pending-profile'

/** Crea el prospecto y su demo de 3 días en un solo lote: o queda todo, o no queda nada. */
async function createLead(user: User, profile: { name: string; phone: string }): Promise<void> {
  const { db } = svc()
  const attribution = readAttribution()
  const leadRef = doc(db, 'leads', user.uid)
  const batch = writeBatch(db)
  batch.set(leadRef, {
    uid: user.uid,
    name: profile.name,
    email: (user.email ?? '').toLowerCase(),
    phone: profile.phone,
    stage: 'demo',
    registeredAt: serverTimestamp(),
    lastActivityAt: serverTimestamp(),
    // Las reglas aceptan solo ~3 días desde la hora del servidor.
    demoExpiresAt: Timestamp.fromMillis(Date.now() + DEMO_MS),
    interactionCount: 0,
    messageCount: 0,
    agentsTried: [],
    assignedAgent: DEFAULT_AGENT,
    interest: 'bajo',
    score: 0,
    consent: { dataTreatment: true, acceptedAt: serverTimestamp() },
    // Canales autorizados para el seguimiento (WhatsApp y correo se integrarán sobre estos flags).
    channels: { email: true, whatsapp: Boolean(profile.phone) },
    attribution,
  })
  batch.set(doc(db, 'leads', user.uid, 'internal', 'commercial'), {
    notes: `Registro web. Fuente: ${attribution.utm_source || attribution.referrer || 'directo'}. Demo de ${DEMO_DAYS} días asignada.`,
    createdAt: serverTimestamp(),
  })
  batch.set(doc(collection(leadRef, 'interactions')), { type: 'register', channel: 'web', createdAt: serverTimestamp() })
  await batch.commit()
  try { localStorage.removeItem(PENDING_KEY) } catch { /* sin almacenamiento */ }
}

export async function registerUser(input: RegisterInput): Promise<void> {
  const { auth } = svc()
  const profile = { name: input.name.trim(), phone: input.phone }
  const cred = await createUserWithEmailAndPassword(auth, input.email.trim().toLowerCase(), input.password)
  // Si la creación del prospecto falla (red), ensureLead la reintenta al siguiente inicio de sesión.
  try { localStorage.setItem(PENDING_KEY, JSON.stringify({ uid: cred.user.uid, ...profile })) } catch { /* sin almacenamiento */ }
  await updateProfile(cred.user, { displayName: profile.name }).catch(() => undefined)
  await createLead(cred.user, profile)
}

/** Reintenta crear el prospecto de una cuenta que no lo tiene (registro interrumpido). */
export async function ensureLead(user: User): Promise<void> {
  let pending: { uid?: string; name?: string; phone?: string } = {}
  try { pending = JSON.parse(localStorage.getItem(PENDING_KEY) || '{}') } catch { /* ignorar */ }
  const mine = pending.uid === user.uid
  await createLead(user, {
    name: (mine && pending.name) || user.displayName || (user.email ?? '').split('@')[0] || 'Prospecto',
    phone: (mine && pending.phone) || '',
  })
}

export function loginUser(email: string, password: string) {
  return signInWithEmailAndPassword(svc().auth, email.trim().toLowerCase(), password)
}

export function logoutUser() {
  return signOut(svc().auth)
}

export function sendReset(email: string) {
  return sendPasswordResetEmail(svc().auth, email.trim().toLowerCase())
}

export async function getIdToken(): Promise<string | null> {
  return (await svc().auth.currentUser?.getIdToken()) ?? null
}

/** Registra la interacción y actualiza actividad, estado, contadores y nivel de interés en un solo lote. */
export async function recordInteraction(lead: Lead, type: InteractionType, meta: { agentId?: string; text?: string } = {}): Promise<void> {
  const { db } = svc()
  const change = applyInteraction(lead, type, Date.now(), meta.agentId)
  const leadRef = doc(db, 'leads', lead.uid)
  const batch = writeBatch(db)

  const entry: Record<string, unknown> = { type, channel: 'web', createdAt: serverTimestamp() }
  if (meta.agentId) entry.agentId = meta.agentId
  if (meta.text) entry.text = meta.text.slice(0, 300)
  batch.set(doc(collection(leadRef, 'interactions')), entry)

  const update: Record<string, unknown> = { lastActivityAt: serverTimestamp() }
  if (change.interactionCount !== undefined) update.interactionCount = increment(1)
  if (change.messageCount !== undefined) update.messageCount = increment(1)
  if (change.newAgent) update.agentsTried = arrayUnion(change.newAgent)
  if (change.assignAgent) update.assignedAgent = change.assignAgent
  if (change.advisorRequested) update.advisorRequestedAt = serverTimestamp()
  if (change.stage) update.stage = change.stage
  if (change.score !== undefined) update.score = change.score
  if (change.interest) update.interest = change.interest
  batch.update(leadRef, update)
  await batch.commit()
}

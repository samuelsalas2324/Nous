import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { User } from 'firebase/auth'
import { FIREBASE_ENABLED, SESSION_FLAG } from '@/lib/config'
import { demoNotice, demoPhase, type DemoPhase, type InteractionType, type Lead, type Notice } from '@/lib/demo'
import { firstName } from '@/lib/validation'
import { CONTACT_EMAIL, WHATSAPP_NUMBER } from '@/data/content'
import { useNow } from '@/hooks/use-now'

type Crm = typeof import('@/lib/crm')
export type AuthMode = 'register' | 'login' | 'reset'
/** Lo que el visitante quería hacer cuando se le pidió registrarse; se retoma al entrar. */
export interface Intent { agentId?: string }

export interface DemoState { phase: DemoPhase; remainingMs: number; notice: Notice | null; hasAccess: boolean }

interface AuthValue {
  /** Firebase está configurado en este despliegue. */
  enabled: boolean
  /** Ya se sabe si hay sesión (evita parpadeos en el encabezado). */
  ready: boolean
  user: User | null
  lead: Lead | null
  demo: DemoState | null
  dialog: { open: boolean; mode: AuthMode }
  intent: Intent | null
  openAuth: (mode?: AuthMode, intent?: Intent) => void
  closeAuth: () => void
  setAuthMode: (mode: AuthMode) => void
  clearIntent: () => void
  register: (i: { name: string; email: string; phone: string; password: string }) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  /** Registra una interacción del prospecto en su ficha (estado, actividad e interés). No bloquea la interfaz. */
  track: (type: InteractionType, meta?: { agentId?: string; text?: string }) => void
  getToken: () => Promise<string | null>
  /** Registra la solicitud y abre WhatsApp (o el correo) con el equipo comercial. */
  contactAdvisor: () => void
}

const Ctx = createContext<AuthValue | null>(null)

export function useAuth(): AuthValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return v
}

function hadSession(): boolean {
  try { return localStorage.getItem(SESSION_FLAG) === '1' } catch { return false }
}
function setSessionFlag(on: boolean) {
  try {
    if (on) localStorage.setItem(SESSION_FLAG, '1')
    else localStorage.removeItem(SESSION_FLAG)
  } catch { /* sin almacenamiento */ }
}

function advisorUrl(name: string): string {
  const text = `Hola, soy ${firstName(name)}. Estoy probando la demo de Nous y quiero hablar con un asesor.`
  if (WHATSAPP_NUMBER) return `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Quiero continuar con Nous')}&body=${encodeURIComponent(text)}`
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [lead, setLead] = useState<Lead | null>(null)
  const [ready, setReady] = useState(() => !FIREBASE_ENABLED || !hadSession())
  const [dialog, setDialog] = useState<{ open: boolean; mode: AuthMode }>({ open: false, mode: 'register' })
  const [intent, setIntent] = useState<Intent | null>(null)
  const now = useNow()

  const crmRef = useRef<Crm | null>(null)
  const crmLoad = useRef<Promise<Crm> | null>(null)
  const leadRef = useRef<Lead | null>(null)
  const registering = useRef(false)
  const justRegistered = useRef(false)
  const ensured = useRef(false)
  const loggedIn = useRef(new Set<string>())
  const authStarted = useRef(false)

  leadRef.current = lead

  const loadCrm = useCallback((): Promise<Crm> => {
    if (!crmLoad.current) {
      crmLoad.current = import('@/lib/crm').then((m) => {
        crmRef.current = m
        return m
      })
    }
    return crmLoad.current
  }, [])

  // Escucha la sesión. Si el navegador nunca tuvo sesión, el SDK no se descarga hasta que el visitante abre el registro.
  const startAuth = useCallback(() => {
    if (!FIREBASE_ENABLED || authStarted.current) return
    authStarted.current = true
    void loadCrm().then((crm) => {
      crm.watchAuth((u) => {
        setUser(u)
        if (!u) { setLead(null); ensured.current = false; setReady(true) }
      })
    }).catch((e) => { console.error('No se pudo cargar Firebase', e); setReady(true) })
  }, [loadCrm])

  useEffect(() => {
    if (!FIREBASE_ENABLED || !hadSession()) return
    const id = window.setTimeout(startAuth, 0)
    return () => window.clearTimeout(id)
  }, [startAuth])

  // Seguridad: si la sesión tarda en resolverse, no dejar el encabezado en espera.
  useEffect(() => {
    if (ready) return
    const id = window.setTimeout(() => setReady(true), 5000)
    return () => window.clearTimeout(id)
  }, [ready])

  // Suscripción al prospecto del usuario con sesión.
  const uid = user?.uid
  useEffect(() => {
    const crm = crmRef.current
    if (!uid || !crm || !user) return
    ensured.current = false
    return crm.watchLead(uid, (l) => {
      if (l) {
        setLead(l)
        setReady(true)
        return
      }
      // Cuenta sin prospecto (registro interrumpido): se reintenta una sola vez.
      if (!registering.current && !ensured.current) {
        ensured.current = true
        crm.ensureLead(user).catch((e) => console.error('No se pudo crear el prospecto', e?.code))
      }
      setReady(true)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid])

  const track = useCallback<AuthValue['track']>((type, meta) => {
    const crm = crmRef.current
    const l = leadRef.current
    if (!crm || !l) return
    crm.recordInteraction(l, type, meta).catch((e) => console.warn('No se pudo registrar la interacción', e?.code))
  }, [])

  // Un inicio de sesión (no un registro) deja huella y, si la demo ya venció, pasa al prospecto a seguimiento.
  useEffect(() => {
    if (!lead || loggedIn.current.has(lead.uid)) return
    loggedIn.current.add(lead.uid)
    if (justRegistered.current) { justRegistered.current = false; return }
    // Una visita por pestaña: recargar la página no debe inflar la bitácora.
    const key = `nous:visit:${lead.uid}`
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
    } catch { /* sin almacenamiento: se registra igual */ }
    track('login')
  }, [lead, track])

  const openAuth = useCallback((mode: AuthMode = 'register', i?: Intent) => {
    if (i) setIntent(i)
    setDialog({ open: true, mode })
    startAuth()
  }, [startAuth])

  const closeAuth = useCallback(() => setDialog((d) => ({ ...d, open: false })), [])
  const setAuthMode = useCallback((mode: AuthMode) => setDialog((d) => ({ ...d, mode })), [])
  const clearIntent = useCallback(() => setIntent(null), [])

  const register = useCallback<AuthValue['register']>(async (input) => {
    const crm = await loadCrm()
    startAuth()
    registering.current = true
    justRegistered.current = true
    try {
      await crm.registerUser(input)
      setSessionFlag(true)
    } catch (e) {
      justRegistered.current = false
      throw e
    } finally {
      registering.current = false
    }
  }, [loadCrm, startAuth])

  const login = useCallback<AuthValue['login']>(async (email, password) => {
    const crm = await loadCrm()
    startAuth()
    await crm.loginUser(email, password)
    setSessionFlag(true)
  }, [loadCrm, startAuth])

  const logout = useCallback(async () => {
    const crm = await loadCrm()
    await crm.logoutUser()
    setSessionFlag(false)
    setLead(null)
    setIntent(null)
    loggedIn.current.clear()
  }, [loadCrm])

  const resetPassword = useCallback<AuthValue['resetPassword']>(async (email) => {
    const crm = await loadCrm()
    await crm.sendReset(email)
  }, [loadCrm])

  const getToken = useCallback(async () => (crmRef.current ? crmRef.current.getIdToken() : null), [])

  const contactAdvisor = useCallback(() => {
    track('advisor_request')
    window.open(advisorUrl(leadRef.current?.name ?? ''), '_blank', 'noopener,noreferrer')
  }, [track])

  const demo = useMemo<DemoState | null>(() => {
    if (!lead) return null
    const phase = demoPhase(lead.stage, lead.demoExpiresAt, now)
    const remainingMs = Math.max(0, lead.demoExpiresAt - now)
    return {
      phase,
      remainingMs,
      hasAccess: phase !== 'vencida',
      notice: demoNotice({ phase, remainingMs, interactions: lead.interactionCount, firstName: firstName(lead.name) }),
    }
  }, [lead, now])

  const value: AuthValue = {
    enabled: FIREBASE_ENABLED, ready, user, lead, demo, dialog, intent,
    openAuth, closeAuth, setAuthMode, clearIntent, register, login, logout, resetPassword, track, getToken, contactAdvisor,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

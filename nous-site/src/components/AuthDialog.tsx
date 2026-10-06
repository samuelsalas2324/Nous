import { useState, type FormEvent } from 'react'
import { Loader2, Check } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { LogoMark } from '@/components/Logo'
import { useAuth, type AuthMode } from '@/context/AuthContext'
import { authErrorMessage } from '@/lib/auth-errors'
import { DEMO_DAYS } from '@/lib/demo'
import { normalizePhone, validateEmail, validateName, validatePassword } from '@/lib/validation'
import { DEFAULT_COUNTRY_CODE, PRIVACY_URL, SALES_AGENTS } from '@/data/content'

const input =
  'block w-full rounded-xl border border-line bg-white px-3.5 py-3 text-[16px] outline-none transition placeholder:text-mute/60 focus:border-clay/70 focus:ring-2 focus:ring-clay/20 aria-[invalid=true]:border-clay-dark'

type Errors = Partial<Record<'name' | 'email' | 'phone' | 'password' | 'consent' | 'form', string>>

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
      {error && <p id={`${id}-err`} role="alert" className="mt-1.5 text-sm text-clay-dark">{error}</p>}
    </div>
  )
}

export default function AuthDialog() {
  const { dialog, closeAuth, setAuthMode, register, login, resetPassword, intent, enabled } = useAuth()
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [resetSent, setResetSent] = useState(false)
  const mode = dialog.mode
  const agent = SALES_AGENTS.find((a) => a.id === intent?.agentId)

  function switchMode(m: AuthMode) {
    setErrors({})
    setResetSent(false)
    setAuthMode(m)
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const get = (k: string) => String(f.get(k) ?? '')
    const errs: Errors = {}

    if (mode === 'register') {
      const name = validateName(get('name'))
      const email = validateEmail(get('email'))
      const phone = normalizePhone(get('phone'), DEFAULT_COUNTRY_CODE) ? null : 'Escribe un teléfono válido, con código de país si es de fuera de Colombia.'
      const password = validatePassword(get('password'))
      if (name) errs.name = name
      if (email) errs.email = email
      if (phone) errs.phone = phone
      if (password) errs.password = password
      if (f.get('consent') !== 'on') errs.consent = 'Necesitamos tu autorización para activar la demo.'
    } else {
      const email = validateEmail(get('email'))
      if (email) errs.email = email
      if (mode === 'login' && !get('password')) errs.password = 'Escribe tu contraseña.'
    }
    setErrors(errs)
    if (Object.keys(errs).length) return

    setBusy(true)
    try {
      if (mode === 'register') {
        await register({
          name: get('name'),
          email: get('email'),
          phone: normalizePhone(get('phone'), DEFAULT_COUNTRY_CODE)!,
          password: get('password'),
        })
        closeAuth()
      } else if (mode === 'login') {
        await login(get('email'), get('password'))
        closeAuth()
      } else {
        await resetPassword(get('email'))
        setResetSent(true)
      }
    } catch (err) {
      const code = (err as { code?: string; message?: string })?.code ?? (err as Error)?.message
      // En el restablecimiento no revelamos si el correo existe.
      if (mode === 'reset' && code === 'auth/user-not-found') setResetSent(true)
      else setErrors({ form: authErrorMessage(code) })
    } finally {
      setBusy(false)
    }
  }

  const title =
    mode === 'register' ? (agent ? `Prueba «${agent.name}» gratis` : `Prueba los agentes de ventas ${DEMO_DAYS} días gratis`)
    : mode === 'login' ? 'Bienvenido de nuevo'
    : 'Recupera tu contraseña'
  const desc =
    mode === 'register' ? 'Crea tu cuenta y la demo se activa al instante. Sin tarjeta de crédito.'
    : mode === 'login' ? 'Ingresa para continuar con tu demo.'
    : 'Te enviamos un enlace para crear una nueva contraseña.'

  return (
    <Dialog open={dialog.open} onOpenChange={(o) => !o && closeAuth()}>
      <DialogContent className="max-h-[92dvh] w-[calc(100%-1.5rem)] max-w-md overflow-y-auto rounded-3xl border-line bg-paper p-6 sm:p-8">
        <DialogHeader className="space-y-3 text-left">
          <LogoMark className="h-9 w-9" />
          <DialogTitle className="text-3xl font-normal leading-tight tracking-tight">{title}</DialogTitle>
          <DialogDescription className="text-[15px] leading-relaxed text-mute">{desc}</DialogDescription>
        </DialogHeader>

        {!enabled ? (
          <p role="alert" className="rounded-xl bg-[#FBEAE4] px-4 py-3 text-sm text-clay-dark">
            El registro aún no está disponible en este entorno. Falta configurar Firebase (variables VITE_FIREBASE_*).
          </p>
        ) : resetSent ? (
          <div className="space-y-4">
            <p className="flex gap-2 rounded-xl bg-sand px-4 py-3 text-[15px]">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-clay" /> Si el correo tiene cuenta, te enviamos el enlace. Revisa también la carpeta de spam.
            </p>
            <button onClick={() => switchMode('login')} className="text-sm font-medium text-clay-dark hover:underline">Volver a ingresar</button>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            {mode === 'register' && (
              <>
                <Field id="auth-name" label="Nombre" error={errors.name}>
                  <input id="auth-name" name="name" type="text" autoComplete="name" placeholder="Tu nombre" className={input} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'auth-name-err' : undefined} />
                </Field>
              </>
            )}
            <Field id="auth-email" label="Correo" error={errors.email}>
              <input id="auth-email" name="email" type="email" inputMode="email" autoComplete="email" placeholder="tu@empresa.com" className={input} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'auth-email-err' : undefined} />
            </Field>
            {mode === 'register' && (
              <Field id="auth-phone" label="Teléfono (WhatsApp)" error={errors.phone}>
                <input id="auth-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="300 123 4567" className={input} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'auth-phone-err' : undefined} />
              </Field>
            )}
            {mode !== 'reset' && (
              <Field id="auth-password" label="Contraseña" error={errors.password}>
                <input id="auth-password" name="password" type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} placeholder={mode === 'register' ? 'Mínimo 8 caracteres' : 'Tu contraseña'} className={input} aria-invalid={!!errors.password} aria-describedby={errors.password ? 'auth-password-err' : undefined} />
              </Field>
            )}

            {mode === 'register' && (
              <div>
                <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-snug text-mute">
                  <input name="consent" type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-[#C96442]" aria-invalid={!!errors.consent} />
                  <span>
                    Autorizo el tratamiento de mis datos y que Nous me contacte por correo o WhatsApp sobre mi demo y nuestros servicios.
                    {PRIVACY_URL && <> <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer" className="underline hover:text-ink">Política de datos</a>.</>}
                  </span>
                </label>
                {errors.consent && <p role="alert" className="mt-1.5 text-sm text-clay-dark">{errors.consent}</p>}
              </div>
            )}

            {errors.form && <p role="alert" className="rounded-xl bg-[#FBEAE4] px-4 py-3 text-sm text-clay-dark">{errors.form}</p>}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-clay px-5 py-3.5 text-[16px] font-medium text-white transition hover:bg-clay-dark disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === 'register' ? 'Crear cuenta y empezar mi demo' : mode === 'login' ? 'Ingresar' : 'Enviar enlace'}
            </button>

            {mode === 'register' && (
              <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-mute">
                <li>{DEMO_DAYS} días gratis</li><li>Sin tarjeta</li><li>Acceso inmediato</li>
              </ul>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-sm">
              {mode === 'register' ? (
                <button type="button" onClick={() => switchMode('login')} className="text-mute hover:text-ink">¿Ya tienes cuenta? <span className="font-medium text-clay-dark">Ingresa</span></button>
              ) : (
                <button type="button" onClick={() => switchMode('register')} className="text-mute hover:text-ink">¿Nuevo en Nous? <span className="font-medium text-clay-dark">Prueba gratis</span></button>
              )}
              {mode === 'login' && <button type="button" onClick={() => switchMode('reset')} className="text-mute hover:text-ink">Olvidé mi contraseña</button>}
              {mode === 'reset' && <button type="button" onClick={() => switchMode('login')} className="text-mute hover:text-ink">Volver</button>}
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

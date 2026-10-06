import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { ArrowUpRight, ArrowRight, UserCheck, Lock, Gauge, Eye, Brain, Zap, RefreshCw, Workflow, BookOpenText, LineChart, ShieldCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Chat, { type Prefill } from '@/components/Chat'
import AuthDialog from '@/components/AuthDialog'
import AccountMenu from '@/components/AccountMenu'
import AgentsGrid from '@/components/AgentsGrid'
import DemoBanner from '@/components/DemoBanner'
import { useAuth } from '@/context/AuthContext'
import { useSpotlight } from '@/hooks/use-spotlight'
import { DEMO_DAYS, type NoticeAction } from '@/lib/demo'
import { LogoMark } from '@/components/Logo'
import { Reveal } from '@/components/Reveal'
import { FlowVisual, DocsVisual, BarsVisual, PermsVisual, AgentTrace } from '@/components/Visuals'
import { SERVICES, STEPS, CONTACT_EMAIL, SALES_AGENTS, type SalesAgent } from '@/data/content'

function Logo() {
  return (
    <a href="#top" className="group flex items-center gap-2.5" aria-label="Nous, inicio">
      <LogoMark className="h-9 w-9 transition duration-500 group-hover:rotate-[-6deg] group-hover:scale-105" />
      <span className="font-serif text-[1.75rem] leading-none tracking-tight">Nous</span>
    </a>
  )
}

/** Fondo fijo: auroras de color + cuadrícula + grano. Es lo que el vidrio esmerilado "refracta". */
function Aurora() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-paper">
      <div className="absolute -right-[12vw] -top-[18vw] h-[58vw] w-[58vw] min-h-[360px] min-w-[360px] animate-drift rounded-full bg-[radial-gradient(circle_at_center,rgb(255_110_70/0.55),rgb(255_90_130/0.22)_45%,transparent_70%)]" />
      <div className="absolute -left-[16vw] top-[18vh] h-[52vw] w-[52vw] min-h-[340px] min-w-[340px] animate-drift-slow rounded-full bg-[radial-gradient(circle_at_center,rgb(120_100_255/0.5),rgb(90_80_220/0.18)_50%,transparent_72%)]" />
      <div className="absolute -bottom-[20vw] right-[8vw] h-[48vw] w-[48vw] min-h-[320px] min-w-[320px] animate-drift rounded-full bg-[radial-gradient(circle_at_center,rgb(40_220_205/0.38),rgb(40_160_220/0.14)_50%,transparent_72%)]" />
      <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_80%_60%_at_50%_20%,black,transparent_75%)]" />
      <div className="bg-noise absolute inset-0 opacity-[0.09]" />
    </div>
  )
}

function SectionHead({ n, label, title, children }: { n: string; label: string; title: ReactNode; children?: ReactNode }) {
  return (
    <Reveal className="mb-12 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
      <div>
        <p className="eyebrow mb-5 flex items-center gap-3">
          <span className="glass rounded-md px-2 py-1 text-[11px] text-ink/80">{n}</span>
          {label}
          <span aria-hidden className="h-px w-16 bg-gradient-to-r from-clay/60 to-transparent" />
        </p>
        <h2 className="text-gradient max-w-2xl text-[2.6rem] leading-[1.02] md:text-[3.5rem]">{title}</h2>
      </div>
      {children && <p className="max-w-sm leading-relaxed text-mute">{children}</p>}
    </Reveal>
  )
}

function Tile({ icon: Icon, title, desc, className = '', children }: { icon: LucideIcon; title: string; desc: string; className?: string; children: ReactNode }) {
  return (
    <div className={`glass spot flex flex-col rounded-3xl p-6 md:p-7 ${className}`}>
      <div className="mb-6 flex items-start gap-3.5">
        <span className="glass flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
          <Icon className="h-[18px] w-[18px] text-clay" strokeWidth={1.8} />
        </span>
        <div>
          <h3 className="text-2xl leading-tight">{title}</h3>
          <p className="mt-1 text-[15px] leading-relaxed text-mute">{desc}</p>
        </div>
      </div>
      <div className="flex flex-1 items-center"><div className="w-full">{children}</div></div>
    </div>
  )
}

const LOOP = [
  { icon: Eye, t: 'Percibe', d: 'Lee correos, documentos, datos y eventos de tus sistemas.' },
  { icon: Brain, t: 'Razona', d: 'Entiende la intención, planifica pasos y elige herramientas.' },
  { icon: Zap, t: 'Actúa', d: 'Ejecuta tareas reales y pide aprobación cuando importa.' },
  { icon: RefreshCw, t: 'Aprende', d: 'Mide resultados y mejora con el feedback de tu equipo.' },
]

const PRINCIPLES = [
  { icon: UserCheck, t: 'Humano en el circuito', d: 'Los agentes proponen y ejecutan; las personas supervisan y deciden lo que importa.' },
  { icon: Lock, t: 'Seguridad por diseño', d: 'Mínimos privilegios, datos protegidos y trazabilidad desde el primer día, no como parche.' },
  { icon: Gauge, t: 'Valor medible', d: 'Cada automatización tiene una métrica: horas ahorradas, errores evitados, costo por tarea.' },
]

const HERO_CHIPS = ['Agentes de IA', 'Automatización', 'Humano en el circuito']

export default function App() {
  const [prefill, setPrefill] = useState<Prefill>(null)
  const [agent, setAgent] = useState<SalesAgent | null>(null)
  const { enabled, ready, user, lead, demo, intent, clearIntent, openAuth, track, contactAdvisor } = useAuth()
  useSpotlight()

  function goTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function ask(question: string) {
    goTo('cerebro')
    setPrefill({ text: question, nonce: Date.now() })
  }

  const startAgent = useCallback((a: SalesAgent) => {
    setAgent(a)
    track('agent_selected', { agentId: a.id })
    goTo('cerebro')
  }, [track])

  // Visitante → registro → demo: quien pidió un agente sin sesión lo recibe apenas entra.
  useEffect(() => {
    if (!intent?.agentId || !lead || !demo) return
    const a = SALES_AGENTS.find((x) => x.id === intent.agentId)
    clearIntent()
    if (a && demo.hasAccess) startAgent(a)
  }, [intent, lead, demo, clearIntent, startAgent])

  function tryAgent(a: SalesAgent) {
    if (!enabled) return ask(`Quiero probar el agente "${a.name}": ¿cómo funcionaría en mi negocio?`)
    if (!user) return openAuth('register', { agentId: a.id })
    if (!lead || !demo) return
    if (!demo.hasAccess) return contactAdvisor()
    startAgent(a)
  }

  function onNoticeAction(action: NoticeAction) {
    if (action === 'advisor') contactAdvisor()
    else goTo('agentes')
  }

  return (
    <div id="top" className="relative isolate min-h-screen overflow-x-clip">
      <Aurora />

      <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-paper/35 backdrop-blur-2xl backdrop-saturate-150">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
          <Logo />
          <nav className="glass hidden items-center gap-1 rounded-full p-1 text-sm text-mute lg:flex">
            {enabled && <a href="#agentes" className="rounded-full px-3.5 py-1.5 transition hover:bg-white/10 hover:text-ink">Agentes</a>}
            <a href="#capacidades" className="rounded-full px-3.5 py-1.5 transition hover:bg-white/10 hover:text-ink">Capacidades</a>
            <a href="#como-piensa" className="rounded-full px-3.5 py-1.5 transition hover:bg-white/10 hover:text-ink">Cómo piensa</a>
            <a href="#servicios" className="rounded-full px-3.5 py-1.5 transition hover:bg-white/10 hover:text-ink">Servicios</a>
            <a href="#metodo" className="rounded-full px-3.5 py-1.5 transition hover:bg-white/10 hover:text-ink">Método</a>
          </nav>
          <div className="flex items-center gap-1.5 sm:gap-3">
            {user ? (
              <AccountMenu onAction={onNoticeAction} />
            ) : enabled && ready ? (
              <>
                <button onClick={() => openAuth('login')} className="px-2 py-2 text-sm text-mute transition hover:text-ink">Ingresar</button>
                <button onClick={() => openAuth('register')} className="btn-primary rounded-full px-4 py-2 text-sm sm:px-5">
                  Prueba gratis
                </button>
              </>
            ) : null}
            <a href="#contacto" className="btn-ghost hidden rounded-full px-4 py-2 text-sm font-medium lg:inline-flex">
              Hablar con el equipo
            </a>
          </div>
        </div>
      </header>

      <DemoBanner onAction={onNoticeAction} />

      <main>
        {/* HERO */}
        <section className="relative">
          {/* Esferas de vidrio decorativas */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[640px] max-w-6xl">
            <div className="glass absolute -right-6 top-6 h-44 w-44 animate-floaty rounded-full bg-[radial-gradient(circle_at_30%_25%,rgb(255_255_255/0.35),rgb(255_130_90/0.18)_45%,rgb(120_100_255/0.15))] sm:right-4 sm:h-60 sm:w-60 md:right-10 md:top-2 md:h-72 md:w-72" />
            <div className="glass absolute left-[6%] top-[480px] hidden h-14 w-14 animate-floaty rounded-full [animation-delay:-3s] lg:block" />
          </div>

          <div className="relative mx-auto max-w-6xl px-5 pb-24 pt-12 md:px-8 md:pt-16">
            <div className="grid gap-5 md:grid-cols-[auto_1fr] md:items-end md:gap-14">
              <h1 className="relative text-[5.5rem] leading-[0.8] tracking-[-0.045em] sm:text-[7rem] md:text-[9.5rem]">
                <span className="text-gradient">Nous</span>
                <span className="text-aurora drop-shadow-[0_0_28px_rgb(255_110_90/0.7)]">.</span>
              </h1>
              <div className="md:pb-3">
                <p className="eyebrow flex items-center gap-2.5">
                  <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-clay opacity-60" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-clay" /></span>
                  Centro de experiencia de superinteligencia
                </p>
                <p className="mt-3 max-w-lg text-lg leading-relaxed text-ink/70 md:text-xl">
                  Una mente que trabaja a tu lado. Aprende, prueba y despliega agentes de IA que automatizan
                  procesos reales, sin perder lo que nos hace humanos.
                </p>
                {enabled && (
                  <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
                    {!user && ready && (
                      <button onClick={() => openAuth('register')} className="btn-primary inline-flex items-center gap-2 rounded-full px-6 py-3.5">
                        Prueba gratis {DEMO_DAYS} días <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                    <a href="#agentes" className="text-sm font-medium text-ink underline-offset-4 transition hover:text-clay hover:underline">Ver los agentes de ventas</a>
                  </div>
                )}
                {enabled && !user && ready && <p className="mt-3 text-sm text-mute">Sin tarjeta de crédito · Acceso inmediato</p>}
                <ul className="mt-6 flex flex-wrap gap-2">
                  {HERO_CHIPS.map((c) => (
                    <li key={c} className="glass rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-ink/70">{c}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div id="cerebro" className="mt-10 scroll-mt-24 md:mt-12">
              <Chat prefill={prefill} agent={agent} onExitAgent={() => setAgent(null)} />
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-5 md:px-8">
          {/* 01 AGENTES DE VENTAS */}
          {enabled && (
            <section id="agentes" className="scroll-mt-20 pb-28">
              <SectionHead n="01" label="Agentes de ventas" title="Prueba un agente de ventas con tu propio negocio">
                {user ? 'Elige uno y cuéntale de tu negocio. Trabaja contigo en esta misma página.' : `Crea tu cuenta y úsalos ${DEMO_DAYS} días gratis. Sin tarjeta.`}
              </SectionHead>
              <Reveal>
                <AgentsGrid activeId={agent?.id ?? null} onTry={tryAgent} />
              </Reveal>
            </section>
          )}

          {/* 02 CAPACIDADES */}
          <section id="capacidades" className="scroll-mt-20 pb-28">
            <SectionHead n="02" label="Capacidades" title="Lo que Nous puede hacer por tu negocio">
              Ilustraciones de ejemplo de cómo se ve un agente de IA trabajando.
            </SectionHead>
            <div className="grid gap-4 md:grid-cols-6">
              <Reveal className="md:col-span-4">
                <Tile icon={Workflow} title="Automatiza procesos de punta a punta" desc="De la solicitud al resultado, sin pasos manuales en el medio." className="h-full">
                  <FlowVisual />
                </Tile>
              </Reveal>
              <Reveal delay={100} className="md:col-span-2">
                <Tile icon={BookOpenText} title="Conoce tu negocio" desc="Responde con tus propios documentos." className="h-full">
                  <DocsVisual />
                </Tile>
              </Reveal>
              <Reveal delay={100} className="md:col-span-2">
                <Tile icon={LineChart} title="Analiza tus datos" desc="Detecta patrones y anticipa decisiones." className="h-full">
                  <BarsVisual />
                </Tile>
              </Reveal>
              <Reveal delay={200} className="md:col-span-4">
                <Tile icon={ShieldCheck} title="Actúa con seguridad" desc="Cada permiso se define y se audita. Lo sensible siempre pasa por una persona." className="h-full">
                  <PermsVisual />
                </Tile>
              </Reveal>
            </div>
          </section>

          {/* 03 CÓMO PIENSA */}
          <section id="como-piensa" className="scroll-mt-20 pb-28">
            <SectionHead n="03" label="Cómo piensa" title="Un agente no responde: razona, actúa y aprende" />
            <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-14">
              <Reveal>
                <ol className="grid gap-3 sm:grid-cols-2">
                  {LOOP.map((s, i) => (
                    <li key={s.t} className="glass spot rounded-2xl p-6">
                      <div className="mb-5 flex items-center justify-between">
                        <span className="glass flex h-10 w-10 items-center justify-center rounded-xl">
                          <s.icon className="h-5 w-5 text-clay" strokeWidth={1.6} />
                        </span>
                        <span className="font-mono text-xs text-mute">0{i + 1}</span>
                      </div>
                      <h3 className="text-2xl">{s.t}</h3>
                      <p className="mt-2 text-[15px] leading-relaxed text-mute">{s.d}</p>
                    </li>
                  ))}
                </ol>
              </Reveal>
              <Reveal delay={120}>
                <AgentTrace />
              </Reveal>
            </div>
          </section>

          {/* 04 SERVICIOS */}
          <section id="servicios" className="scroll-mt-20 pb-28">
            <SectionHead n="04" label="Servicios" title="Desde la primera conversación hasta producción">
              Cada servicio se puede explorar con Nous antes de hablar con una persona.
            </SectionHead>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {SERVICES.map((s, i) => (
                <Reveal key={s.title} delay={(i % 3) * 90} className="h-full">
                  <article className="glass spot group flex h-full flex-col rounded-3xl p-7">
                    <div className="mb-10 flex items-center justify-between">
                      <span className="glass flex h-11 w-11 items-center justify-center rounded-xl">
                        <s.icon className="h-5 w-5 text-clay" strokeWidth={1.6} />
                      </span>
                      <span className="font-mono text-xs text-mute">0{i + 1}</span>
                    </div>
                    <h3 className="text-2xl leading-snug">{s.title}</h3>
                    <p className="mt-3 flex-1 leading-relaxed text-mute">{s.desc}</p>
                    <button
                      onClick={() => ask(`¿Cómo me ayudaría un servicio de "${s.title}" en mi negocio?`)}
                      className="mt-7 flex items-center gap-1.5 self-start text-sm font-medium text-ink transition group-hover:text-clay"
                    >
                      Preguntar a Nous <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </button>
                  </article>
                </Reveal>
              ))}
            </div>
          </section>

          {/* 05 MÉTODO */}
          <section id="metodo" className="scroll-mt-20 grid gap-10 pb-28 md:grid-cols-[1fr_1.4fr] md:gap-16">
            <Reveal>
              <p className="eyebrow mb-5 flex items-center gap-3">
                <span className="glass rounded-md px-2 py-1 text-[11px] text-ink/80">05</span>Método
                <span aria-hidden className="h-px w-16 bg-gradient-to-r from-clay/60 to-transparent" />
              </p>
              <h2 className="text-gradient text-[2.6rem] leading-[1.02] md:text-[3.5rem]">Un método simple para resultados medibles</h2>
              <p className="mt-5 max-w-sm leading-relaxed text-mute">Empezamos pequeño, demostramos valor y escalamos lo que funciona.</p>
            </Reveal>
            <Reveal delay={120}>
              <ol className="relative space-y-4 before:absolute before:bottom-6 before:left-[27px] before:top-6 before:w-px before:bg-gradient-to-b before:from-clay/60 before:via-violet/40 before:to-transparent">
                {STEPS.map((s) => (
                  <li key={s.n} className="glass spot relative flex gap-5 rounded-2xl p-5 md:p-6">
                    <span className="glass relative z-10 flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full font-serif text-2xl"><span className="text-aurora">{s.n}</span></span>
                    <div>
                      <h3 className="text-2xl">{s.title}</h3>
                      <p className="mt-1.5 leading-relaxed text-mute">{s.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Reveal>
          </section>

          {/* PRINCIPIOS */}
          <section id="principios" className="scroll-mt-20 pb-28">
            <Reveal>
              <h2 className="text-gradient mb-12 max-w-2xl text-[2.6rem] leading-[1.02] md:text-[3.5rem]">La IA es más poderosa cuando potencia a las personas</h2>
            </Reveal>
            <div className="grid gap-4 md:grid-cols-3">
              {PRINCIPLES.map((p, i) => (
                <Reveal key={p.t} delay={i * 100} className="h-full">
                  <div className="glass spot relative h-full overflow-hidden rounded-3xl p-7">
                    <div aria-hidden className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-clay/70 to-transparent" />
                    <p.icon className="mb-5 h-7 w-7 text-clay" strokeWidth={1.5} />
                    <h3 className="text-2xl">{p.t}</h3>
                    <p className="mt-2 leading-relaxed text-mute">{p.d}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>

          {/* CONTACTO */}
          <section id="contacto" className="scroll-mt-20 pb-24">
            <Reveal>
              <div className="glass-strong relative overflow-hidden rounded-[32px] px-7 py-14 md:px-14 md:py-20">
                <div aria-hidden className="absolute -right-24 -top-28 h-80 w-80 animate-drift rounded-full bg-[radial-gradient(circle,rgb(255_110_70/0.5),transparent_70%)]" />
                <div aria-hidden className="absolute -bottom-32 left-10 h-72 w-72 animate-drift-slow rounded-full bg-[radial-gradient(circle,rgb(120_100_255/0.4),transparent_70%)]" />
                <div aria-hidden className="bg-grid absolute inset-0 opacity-70 [mask-image:linear-gradient(to_left,black,transparent_70%)]" />
                <div className="relative">
                  <LogoMark className="mb-8 h-11 w-11" />
                  <h2 className="text-gradient max-w-2xl text-[2.6rem] leading-[1.02] md:text-6xl">Hablemos de tu primer agente de IA</h2>
                  <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink/70">
                    Cuéntanos qué proceso te quita más tiempo. En una conversación te decimos si vale la pena automatizarlo y cómo.
                  </p>
                  <div className="mt-9 flex flex-wrap items-center gap-3">
                    {enabled && !user && ready && (
                      <button
                        onClick={() => openAuth('register')}
                        className="btn-primary inline-flex items-center gap-2 rounded-full px-7 py-3.5"
                      >
                        Empieza tu demo gratis <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                    <a
                      href={`mailto:${CONTACT_EMAIL}`}
                      className={`inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-medium ${
                        enabled && !user && ready ? 'btn-ghost' : 'btn-primary'
                      }`}
                    >
                      Escríbenos <ArrowRight className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            </Reveal>
          </section>
        </div>
      </main>

      <footer className="border-t border-white/[0.08] bg-paper/30 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 text-sm text-mute md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex items-center gap-3">
            <LogoMark className="h-7 w-7" />
            <span>© 2026 Nous. Superinteligencia al servicio de las personas.</span>
          </div>
          <nav className="flex gap-6 font-mono text-xs uppercase tracking-wider">
            {enabled && <a href="#agentes" className="transition hover:text-ink">Agentes</a>}
            <a href="#capacidades" className="transition hover:text-ink">Capacidades</a>
            <a href="#servicios" className="transition hover:text-ink">Servicios</a>
            <a href="#contacto" className="transition hover:text-ink">Contacto</a>
          </nav>
        </div>
      </footer>

      <AuthDialog />
    </div>
  )
}

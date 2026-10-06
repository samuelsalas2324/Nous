import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applyInteraction, demoNotice, demoPhase, formatRemaining, scoreLead, DEMO_MS, type LeadState } from './demo.ts'
import { normalizePhone, validateEmail, validatePassword } from './validation.ts'

const H = 3_600_000
const now = 1_000_000_000_000
const fresh: LeadState = {
  stage: 'demo', interactionCount: 0, messageCount: 0, agentsTried: [], advisorRequested: false,
  demoExpiresAt: now + DEMO_MS, score: 0, interest: 'bajo',
}

test('fases de la demo según el tiempo restante', () => {
  assert.equal(demoPhase('demo', now + 60 * H, now), 'activa')
  assert.equal(demoPhase('demo', now + 40 * H, now), 'por_vencer')
  assert.equal(demoPhase('demo', now + 20 * H, now), 'ultimo_dia')
  assert.equal(demoPhase('interaccion', now + 3 * H, now), 'ultimas_horas')
  assert.equal(demoPhase('demo', now, now), 'vencida')
  assert.equal(demoPhase('seguimiento', now - H, now), 'vencida')
  assert.equal(demoPhase('cliente', now - 99 * H, now), 'cliente')
})

test('formato del tiempo restante', () => {
  assert.equal(formatRemaining(2 * 24 * H + 14 * H), '2 d 14 h')
  assert.equal(formatRemaining(5 * H + 20 * 60_000), '5 h 20 min')
  assert.equal(formatRemaining(42 * 60_000), '42 min')
  assert.equal(formatRemaining(10_000), 'menos de 1 min')
  assert.equal(formatRemaining(0), 'terminada')
})

test('cada fase tiene aviso comercial, salvo cliente', () => {
  const base = { remainingMs: 10 * H, interactions: 0, firstName: 'Ana' }
  for (const phase of ['activa', 'por_vencer', 'ultimo_dia', 'ultimas_horas', 'vencida'] as const) {
    const n = demoNotice({ ...base, phase })
    assert.ok(n && n.title && n.body && n.cta.label, phase)
  }
  assert.equal(demoNotice({ ...base, phase: 'cliente' }), null)
  assert.equal(demoNotice({ ...base, phase: 'vencida' })?.cta.action, 'advisor')
  assert.equal(demoNotice({ ...base, phase: 'por_vencer' })?.cta.action, 'agents')
  assert.equal(demoNotice({ ...base, phase: 'por_vencer', interactions: 3 })?.cta.action, 'advisor')
})

test('la primera interacción con un agente pasa de demo a interacción y asigna el agente', () => {
  const c = applyInteraction(fresh, 'agent_message', now, 'calificador')
  assert.equal(c.stage, 'interaccion')
  assert.equal(c.assignAgent, 'calificador')
  assert.equal(c.messageCount, 1)
  assert.equal(c.interactionCount, 1)
  assert.equal(c.newAgent, 'calificador')
})

test('pedir un asesor mueve a seguimiento y sube el interés', () => {
  const c = applyInteraction({ ...fresh, stage: 'interaccion', agentsTried: ['a', 'b'], messageCount: 4, score: 56, interest: 'medio' }, 'advisor_request', now)
  assert.equal(c.stage, 'seguimiento')
  assert.equal(c.advisorRequested, true)
  assert.equal(c.interest, 'alto')
})

test('un login con la demo vencida pasa a seguimiento; un cliente nunca retrocede', () => {
  const expired = { ...fresh, demoExpiresAt: now - 1 }
  assert.equal(applyInteraction(expired, 'login', now).stage, 'seguimiento')
  assert.equal(applyInteraction({ ...expired, stage: 'cliente' }, 'login', now).stage, undefined)
  assert.equal(applyInteraction({ ...expired, stage: 'cliente' }, 'agent_message', now, 'x').stage, undefined)
})

test('el login no cuenta como interacción', () => {
  const c = applyInteraction(fresh, 'login', now)
  assert.equal(c.interactionCount, undefined)
})

test('lead scoring', () => {
  assert.deepEqual(scoreLead({ messageCount: 0, agentsTried: 0, advisorRequested: false }), { score: 0, interest: 'bajo' })
  assert.equal(scoreLead({ messageCount: 2, agentsTried: 1, advisorRequested: false }).interest, 'medio')
  assert.equal(scoreLead({ messageCount: 1, agentsTried: 1, advisorRequested: true }).interest, 'alto')
  assert.equal(scoreLead({ messageCount: 99, agentsTried: 6, advisorRequested: true }).score, 100)
})

test('normalización de teléfono', () => {
  assert.equal(normalizePhone('300 123 4567'), '+573001234567')
  assert.equal(normalizePhone('+1 (415) 555-0100'), '+14155550100')
  assert.equal(normalizePhone('12'), null)
  assert.equal(normalizePhone('abc'), null)
})

test('validaciones de correo y contraseña', () => {
  assert.equal(validateEmail('ana@correo.com'), null)
  assert.ok(validateEmail('ana@correo'))
  assert.ok(validatePassword('1234567'))
  assert.equal(validatePassword('12345678'), null)
})

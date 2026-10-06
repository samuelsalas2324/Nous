// Pruebas de firestore.rules contra el emulador.
//   Terminal 1: pnpm emulators
//   Terminal 2: pnpm test:rules
import { test, before, after, beforeEach } from 'node:test'
import { readFileSync } from 'node:fs'
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing'
import { doc, collection, setDoc, getDoc, getDocs, updateDoc, deleteDoc, writeBatch, serverTimestamp, increment, arrayUnion, Timestamp } from 'firebase/firestore'

const DAY = 86_400_000
let env

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-nous',
    firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8085 },
  })
})
after(async () => { await env.cleanup() })
beforeEach(async () => { await env.clearFirestore() })

const ana = (e) => e.authenticatedContext('ana', { email: 'ana@correo.com' }).firestore()
const bob = (e) => e.authenticatedContext('bob', { email: 'bob@correo.com' }).firestore()
const staff = (e) => e.authenticatedContext('equipo', { email: 'equipo@nous.com', staff: true }).firestore()
const anon = (e) => e.unauthenticatedContext().firestore()

const newLead = (over = {}) => ({
  uid: 'ana', name: 'Ana Pérez', email: 'ana@correo.com', phone: '+573001234567',
  stage: 'demo', registeredAt: serverTimestamp(), lastActivityAt: serverTimestamp(),
  demoExpiresAt: Timestamp.fromMillis(Date.now() + 3 * DAY),
  interactionCount: 0, messageCount: 0, agentsTried: [], assignedAgent: 'calificador', interest: 'bajo', score: 0,
  consent: { dataTreatment: true, acceptedAt: serverTimestamp() }, channels: { email: true, whatsapp: true }, attribution: { utm_source: 'ads' },
  ...over,
})

// Registro completo, igual que src/lib/crm.ts
async function register(db, over = {}) {
  const batch = writeBatch(db)
  const ref = doc(db, 'leads', 'ana')
  batch.set(ref, newLead(over))
  batch.set(doc(db, 'leads', 'ana', 'internal', 'commercial'), { notes: 'Registro web.', createdAt: serverTimestamp() })
  batch.set(doc(collection(ref, 'interactions')), { type: 'register', channel: 'web', createdAt: serverTimestamp() })
  return batch.commit()
}
const seed = async () => { await assertSucceeds(register(ana(env))) }

test('registro válido crea prospecto, nota interna e interacción', async () => { await seed() })

test('registro: no se puede nacer como cliente, ni con demo larga o pasada, ni sin consentimiento', async () => {
  const db = ana(env)
  await assertFails(register(db, { stage: 'cliente' }))
  await assertFails(register(db, { demoExpiresAt: Timestamp.fromMillis(Date.now() + 30 * DAY) }))
  await assertFails(register(db, { demoExpiresAt: Timestamp.fromMillis(Date.now() - DAY) }))
  await assertFails(register(db, { consent: { dataTreatment: false, acceptedAt: serverTimestamp() } }))
  await assertFails(register(db, { interactionCount: 5 }))
  await assertFails(register(db, { score: 100, interest: 'alto' }))
  await assertFails(register(db, { email: 'otro@correo.com' }))
  await assertFails(register(db, { isAdmin: true }))
  await assertFails(register(db, { registeredAt: Timestamp.fromMillis(Date.now() - 10 * DAY) }))
})

test('registro: no se puede crear la ficha de otra persona', async () => {
  await assertFails(setDoc(doc(bob(env), 'leads', 'ana'), newLead()))
  await assertFails(setDoc(doc(anon(env), 'leads', 'ana'), newLead()))
})

test('lectura: solo el dueño y el equipo', async () => {
  await seed()
  await assertSucceeds(getDoc(doc(ana(env), 'leads', 'ana')))
  await assertSucceeds(getDoc(doc(staff(env), 'leads', 'ana')))
  await assertFails(getDoc(doc(bob(env), 'leads', 'ana')))
  await assertFails(getDoc(doc(anon(env), 'leads', 'ana')))
})

test('el prospecto puede registrar actividad y avanzar demo → interacción → seguimiento', async () => {
  await seed()
  const ref = doc(ana(env), 'leads', 'ana')
  await assertSucceeds(updateDoc(ref, { lastActivityAt: serverTimestamp(), interactionCount: increment(1), messageCount: increment(1), agentsTried: arrayUnion('calificador'), stage: 'interaccion', score: 20, interest: 'bajo', assignedAgent: 'calificador' }))
  await assertSucceeds(updateDoc(ref, { lastActivityAt: serverTimestamp(), stage: 'seguimiento', advisorRequestedAt: serverTimestamp(), score: 60, interest: 'alto' }))
})

test('el prospecto NO puede alterar su demo, sus datos, subirse a cliente ni borrarse', async () => {
  await seed()
  const ref = doc(ana(env), 'leads', 'ana')
  const act = { lastActivityAt: serverTimestamp() }
  await assertFails(updateDoc(ref, { ...act, demoExpiresAt: Timestamp.fromMillis(Date.now() + 90 * DAY) }))
  await assertFails(updateDoc(ref, { ...act, stage: 'cliente' }))
  await assertFails(updateDoc(ref, { ...act, email: 'otro@correo.com' }))
  await assertFails(updateDoc(ref, { ...act, name: 'Otro' }))
  await assertFails(updateDoc(ref, { ...act, registeredAt: serverTimestamp() }))
  await assertFails(updateDoc(ref, { ...act, interactionCount: increment(5) }))
  await assertFails(updateDoc(ref, { ...act, score: 500 }))
  await assertFails(updateDoc(ref, { ...act, interest: 'vip' }))
  await assertFails(updateDoc(ref, { ...act, assignedAgent: 'hacker' }))
  await assertFails(updateDoc(ref, { stage: 'seguimiento' })) // sin lastActivityAt = request.time
  await assertFails(deleteDoc(ref))
})

test('el prospecto no puede retroceder de etapa', async () => {
  await seed()
  const ref = doc(ana(env), 'leads', 'ana')
  await assertSucceeds(updateDoc(ref, { lastActivityAt: serverTimestamp(), stage: 'seguimiento' }))
  await assertFails(updateDoc(ref, { lastActivityAt: serverTimestamp(), stage: 'demo' }))
})

test('otra persona no puede modificar la ficha ajena', async () => {
  await seed()
  await assertFails(updateDoc(doc(bob(env), 'leads', 'ana'), { lastActivityAt: serverTimestamp() }))
})

test('interacciones: el dueño las agrega, no las lee ni las edita; el equipo las lee', async () => {
  await seed()
  const col = collection(ana(env), 'leads', 'ana', 'interactions')
  await assertSucceeds(setDoc(doc(col), { type: 'agent_message', agentId: 'calificador', text: 'Vendo seguros', channel: 'web', createdAt: serverTimestamp() }))
  await assertFails(setDoc(doc(col), { type: 'agent_message', text: 'x'.repeat(301), createdAt: serverTimestamp() }))
  await assertFails(setDoc(doc(col), { type: 'inventado', createdAt: serverTimestamp() }))
  await assertFails(setDoc(doc(col), { type: 'login', createdAt: Timestamp.fromMillis(Date.now() - DAY) }))
  await assertFails(setDoc(doc(col), { type: 'login', agentId: 'hacker', createdAt: serverTimestamp() }))
  await assertFails(setDoc(doc(collection(bob(env), 'leads', 'ana', 'interactions')), { type: 'login', createdAt: serverTimestamp() }))
  await assertSucceeds(getDocs(collection(staff(env), 'leads', 'ana', 'interactions')))
  await assertFails(getDocs(col))
})

test('notas comerciales: privadas del equipo; el prospecto no las lee ni las crea después', async () => {
  await seed()
  const notes = (db) => doc(db, 'leads', 'ana', 'internal', 'commercial')
  await assertFails(getDoc(notes(ana(env))))
  await assertFails(updateDoc(notes(ana(env)), { notes: 'editado' }))
  await assertSucceeds(getDoc(notes(staff(env))))
  await assertSucceeds(updateDoc(notes(staff(env)), { notes: 'Llamar el martes', owner: 'carlos', nextFollowUpAt: Timestamp.fromMillis(Date.now() + DAY) }))
  // Un prospecto sin nota previa tampoco puede crearla por su cuenta fuera del lote de registro.
  await env.withSecurityRulesDisabled(async (c) => { await deleteDoc(notes(c.firestore())) })
  await assertFails(setDoc(notes(ana(env)), { notes: 'hola', createdAt: serverTimestamp() }))
})

test('el equipo puede convertir a cliente y extender la demo', async () => {
  await seed()
  await assertSucceeds(updateDoc(doc(staff(env), 'leads', 'ana'), { stage: 'cliente', demoExpiresAt: Timestamp.fromMillis(Date.now() + 365 * DAY) }))
})

test('colecciones no declaradas están cerradas', async () => {
  await assertFails(setDoc(doc(ana(env), 'otra', 'x'), { a: 1 }))
  await assertFails(getDoc(doc(staff(env), 'otra', 'x')))
})

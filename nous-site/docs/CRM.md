# Captación y conversión de prospectos

Cada registro en Nous crea un prospecto con una demo gratuita de 3 días para probar los agentes de ventas.
Meta de cada cambio: **más registros, más activación, más seguimiento, más clientes.**

## Embudo

```
VISITANTE → REGISTRO → DEMO → INTERACCIÓN → SEGUIMIENTO → CLIENTE
```

| Etapa (`stage`) | Cómo se llega | Quién lo cambia |
|---|---|---|
| *(visitante)* | Entra a la web. Si pregunta 2 veces a Nous sin cuenta, se le invita a registrarse. | — |
| *(registro)* | Completa el formulario (nombre, correo, teléfono, contraseña, consentimiento). | Prospecto |
| `demo` | Se crea al registrarse, con `demoExpiresAt` = +3 días. | Sistema (en el lote de registro) |
| `interaccion` | Usa un agente de ventas por primera vez. | Prospecto (las reglas lo permiten) |
| `seguimiento` | Pide hablar con un asesor, o vuelve a entrar con la demo vencida. | Prospecto (las reglas lo permiten) |
| `cliente` | El equipo cierra la venta. **Solo el equipo** puede asignarlo. | Equipo (consola o claim `staff`) |

La lógica del embudo, los avisos y el *lead scoring* están en [`src/lib/demo.ts`](../src/lib/demo.ts) (sin dependencias, con pruebas en `src/lib/funnel.test.ts`).

## Datos en Firestore

**`leads/{uid}`** — el prospecto (lo lee el dueño y el equipo)

| Campo | Contenido |
|---|---|
| `name`, `email`, `phone` | Datos de contacto. El teléfono se guarda en formato internacional (`+573001234567`). |
| `registeredAt`, `lastActivityAt` | Fecha de registro y última actividad (hora del servidor). |
| `stage` | Estado del embudo (ver arriba). |
| `demoExpiresAt` | Vencimiento de la demo. |
| `assignedAgent` | Agente de ventas asignado: el primero que el prospecto prueba (por defecto `calificador`). |
| `interactionCount`, `messageCount`, `agentsTried` | Actividad. |
| `interest` (`bajo`/`medio`/`alto`), `score` (0–100) | Nivel de interés y puntaje. Se calculan en `scoreLead()`. |
| `advisorRequestedAt` | Cuándo pidió hablar con un asesor (la señal más fuerte). |
| `consent`, `channels` | Consentimiento y canales autorizados (`email`, `whatsapp`). |
| `attribution` | Origen: `utm_*`, `referrer`, `landing`. |

**`leads/{uid}/interactions/{id}`** — bitácora (solo la lee el equipo): `register`, `login`, `agent_selected`, `agent_message` (con el texto, máx. 300), `advisor_request`, `notice_click`.

**`leads/{uid}/internal/commercial`** — **notas comerciales** (`notes`), responsable humano (`owner`) y `nextFollowUpAt`. El prospecto no puede leerlo. El sistema deja la primera nota al registrarse; el equipo la edita.

## Seguridad

- `firestore.rules`: el prospecto solo ve y toca **su** ficha; no puede cambiar su demo, sus datos, ni subirse a `cliente`; no puede borrar nada; todo lo no declarado está cerrado. Probado con `pnpm test:rules`.
- Los agentes de ventas **no son públicos**: `api/chat.js` valida el ID token de Firebase y comprueba en Firestore que la demo siga vigente (o que sea `cliente`) antes de llamar a Anthropic. Los *prompts* de los agentes viven solo en el servidor.
- Las variables `VITE_FIREBASE_*` son públicas por diseño. Restringe la API key por dominio en Google Cloud Console (*APIs y servicios → Credenciales*).
- Nunca subas `.env.local`. `.env.emulator` solo tiene valores falsos.

## Configuración (una sola vez)

1. **Firebase Console** → crea un proyecto → *Authentication* → *Sign-in method* → activa **Correo electrónico/contraseña**.
2. *Firestore Database* → crear base de datos (modo producción).
3. *Configuración del proyecto* → *Tus apps* → *Web* → copia la configuración a `.env.local` (`VITE_FIREBASE_*`, ver `.env.example`).
4. Publica las reglas:
   ```bash
   npx firebase-tools login
   npx firebase-tools use <tu-proyecto>
   npx firebase-tools deploy --only firestore:rules
   ```
5. *Authentication → Configuración → Dominios autorizados*: agrega tu dominio de Vercel.
6. En Vercel, define las mismas variables `VITE_FIREBASE_*` (el servidor reutiliza `VITE_FIREBASE_API_KEY` y `VITE_FIREBASE_PROJECT_ID`; si prefieres, define `FIREBASE_API_KEY` y `FIREBASE_PROJECT_ID`).

### Dar acceso al equipo (claim `staff`)

Mientras no exista un panel, el equipo trabaja desde la **consola de Firebase → Firestore** (que ignora las reglas): ahí cambia `stage` a `cliente`, extiende `demoExpiresAt` y escribe en `internal/commercial`. Para dar acceso desde código (futuro panel), asigna el claim con el Admin SDK:

```js
await getAuth().setCustomUserClaims(uid, { staff: true })
```

### Desarrollo local sin tocar producción

```bash
pnpm emulators      # Auth + Firestore locales (necesita Java)
pnpm dev:emu        # web contra los emuladores, con configuración falsa
pnpm test:rules     # pruebas de seguridad de firestore.rules
pnpm test           # pruebas de la lógica del embudo
```

## Avisos comerciales

Se muestran según el tiempo restante (`demoNotice()`): bienvenida y activación (>48 h), recordatorio (48–24 h), último día (24–6 h), últimas horas (<6 h) y demo terminada. Si el prospecto aún no probó ningún agente, el mensaje empuja la activación; si ya probó, empuja la conversación con un asesor. Aparecen en el banner superior, en el panel de la cuenta y en el chat.

El botón de asesor abre WhatsApp si defines `VITE_WHATSAPP_NUMBER`; si no, abre el correo de contacto.

## Siguientes integraciones

La estructura ya está en [`src/lib/integrations.ts`](../src/lib/integrations.ts): `nextMessage(lead, canal)` devuelve el mensaje que toca enviar según la fase de la demo, y `channels` es el registro donde se conecta cada adaptador.

| Integración | Qué falta |
|---|---|
| **WhatsApp / correo** | Un proceso programado (Cloud Function o Vercel Cron con Admin SDK) que recorra `leads` con `demoExpiresAt` próximo, llame a `nextMessage()` y envíe por el adaptador, respetando `channels`. |
| **Campañas** | `attribution` ya captura `utm_*`. Falta un panel o BigQuery para medir registros → activación → cliente por campaña. |
| **Lead scoring** | `scoreLead()` es una regla simple y reemplazable. Con datos reales se puede calibrar o sustituir por un modelo. |
| **Pasar a `seguimiento` al vencer** | Hoy ocurre cuando el prospecto vuelve a entrar o pide un asesor. Un proceso programado lo haría para todos. |
| **Verificación de correo** | Reduce registros falsos a costa de fricción. Se puede exigir antes de usar los agentes. |

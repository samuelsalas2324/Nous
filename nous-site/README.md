# Nous

**Centro de experiencia de superinteligencia para potenciar al ser humano.**
Landing con un asistente de IA (Nous) que ayuda a descubrir cómo los agentes de IA automatizan procesos de negocio.

## Stack

- **Frontend:** React + TypeScript + Vite, Tailwind CSS, shadcn/ui, lucide-react
- **Backend:** función serverless en Vercel (`api/chat.js`) que actúa de proxy hacia la API de Anthropic
- **Despliegue:** Vercel

## Estructura

```
api/chat.js          Proxy seguro hacia la API de Anthropic (la API key vive solo aquí, en el servidor)
src/App.tsx          Landing: hero, capacidades, cómo piensa, servicios, método, contacto
src/components/      Chat (Nous), Logo, Visuals, Reveal, Markdown, componentes shadcn/ui
src/data/content.ts  Servicios, método y correo de contacto (editar aquí el contenido)
vercel.json          Cabeceras de seguridad (CSP, HSTS, etc.) y configuración de la función
```

## Desarrollo local

Requisitos: Node 18+ y [pnpm](https://pnpm.io).

```bash
pnpm install
cp .env.example .env.local      # y pon tu ANTHROPIC_API_KEY
npm i -g vercel
vercel dev                      # sirve el sitio y /api/chat
```

> Usa `vercel dev` y no `pnpm dev`: este último no levanta `/api/chat`.

## Variables de entorno

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | Sí | Clave de la API de Anthropic. **Nunca** se sube a Git. |
| `ANTHROPIC_MODEL` | No | Modelo a usar (por defecto `claude-sonnet-5-5`). |
| `ALLOWED_ORIGINS` | No | Dominios permitidos, separados por coma. |

Se configuran en Vercel: *Settings → Environment Variables*.

## Despliegue en Vercel

1. Importa este repositorio en [vercel.com/new](https://vercel.com/new) (detecta Vite automáticamente).
2. Define las variables de entorno de arriba.
3. Deploy. Prueba el chat en la URL resultante.

## Captación de prospectos (Firebase)

Registro e inicio de sesión con **Firebase Authentication**; cada registro crea un prospecto en **Firestore** con una **demo gratuita de 3 días** para probar los agentes de ventas. Embudo: visitante → registro → demo → interacción → seguimiento → cliente. Los avisos comerciales aparecen durante y antes del vencimiento de la demo.

Firebase es opcional: sin las variables `VITE_FIREBASE_*` la web funciona como antes (sin registro). Configuración, modelo de datos, reglas, pruebas y próximas integraciones (WhatsApp, correo, campañas): **[docs/CRM.md](docs/CRM.md)**.

```bash
pnpm test         # lógica del embudo
pnpm emulators    # Auth + Firestore locales (necesita Java)
pnpm test:rules   # reglas de seguridad de Firestore
pnpm dev:emu      # web contra los emuladores
```

## Seguridad

- La API key solo existe en el servidor; el navegador habla con `/api/chat`, nunca con Anthropic.
- El servidor valida roles, longitud y número de mensajes, y limita las solicitudes por IP.
- El *system prompt* está en el servidor y no se puede modificar desde el cliente.
- `vercel.json` aplica CSP estricta, HSTS, `X-Frame-Options` y otras cabeceras.
- **Pendiente para producción:** el límite de tasa en memoria es *best-effort* en entornos serverless. Activa Vercel Firewall (rate limiting) o usa Upstash Redis, y fija un límite de gasto mensual en la consola de Anthropic.

## Pendientes

- Sustituir los textos y servicios de ejemplo por el contenido real (`src/data/content.ts`).
- Cambiar el correo de contacto (`hola@tudominio.com`).
- Streaming de respuestas y RAG con material propio.
- Crear el proyecto de Firebase y publicar `firestore.rules` (ver docs/CRM.md).

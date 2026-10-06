// Comprobación ligera (sin cargar el SDK de Firebase) de si el proyecto está configurado.
const env = import.meta.env

export const FIREBASE_ENABLED = Boolean(
  env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_AUTH_DOMAIN && env.VITE_FIREBASE_PROJECT_ID && env.VITE_FIREBASE_APP_ID,
)

/** Marca de que este navegador ya tuvo sesión: solo entonces se carga Firebase al abrir la página. */
export const SESSION_FLAG = 'nous:session'

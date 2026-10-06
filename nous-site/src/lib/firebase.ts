import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import { initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, connectAuthEmulator, type Auth } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore'
import { FIREBASE_ENABLED } from './config'

// La configuración web de Firebase es pública por diseño (identifica el proyecto, no lo protege).
// La seguridad real está en firestore.rules y en las restricciones de la API key en Google Cloud.
const env = import.meta.env
const config = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
}

export const isFirebaseConfigured = FIREBASE_ENABLED
const useEmulators = env.DEV && env.VITE_FIREBASE_EMULATORS === 'true'

interface Services { app: FirebaseApp; auth: Auth; db: Firestore }
let services: Services | null = null

export function getServices(): Services | null {
  if (!isFirebaseConfigured) return null
  if (services) return services
  const app = getApps().length ? getApp() : initializeApp(config)
  // Sin popup ni redirect: así el SDK no inyecta iframes ni scripts de terceros y la CSP puede seguir cerrada.
  const auth = initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence] })
  const db = getFirestore(app)
  if (useEmulators) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
    connectFirestoreEmulator(db, '127.0.0.1', 8085)
  }
  services = { app, auth, db }
  return services
}

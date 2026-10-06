// Mensajes en español para los errores de Firebase Auth / Firestore.
export function authErrorMessage(code: string | undefined): string {
  switch (code) {
    case 'auth/email-already-in-use': return 'Ese correo ya tiene una cuenta. Inicia sesión.'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found': return 'Correo o contraseña incorrectos.'
    case 'auth/invalid-email': return 'Escribe un correo válido.'
    case 'auth/weak-password': return 'La contraseña es muy débil. Usa al menos 8 caracteres.'
    case 'auth/too-many-requests': return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.'
    case 'auth/network-request-failed': return 'Sin conexión. Revisa tu internet e inténtalo de nuevo.'
    case 'permission-denied': return 'No pudimos activar tu demo. Revisa que la hora de tu dispositivo sea correcta e inicia sesión de nuevo.'
    case 'firebase-not-configured': return 'El registro aún no está disponible. Inténtalo más tarde.'
    default: return 'Algo falló. Inténtalo de nuevo en unos segundos.'
  }
}

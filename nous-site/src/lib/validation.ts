// Validación y normalización de los datos del registro. Sin dependencias.

export const MIN_PASSWORD = 8

export function validateName(raw: string): string | null {
  const v = raw.trim()
  if (v.length < 2) return 'Escribe tu nombre.'
  if (v.length > 80) return 'El nombre es demasiado largo.'
  return null
}

export function validateEmail(raw: string): string | null {
  const v = raw.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Escribe un correo válido.'
  return null
}

/**
 * Deja el teléfono en formato internacional (+573001234567), listo para WhatsApp.
 * Un número local de 10 dígitos recibe el código de país por defecto.
 */
export function normalizePhone(raw: string, defaultCountryCode = '57'): string | null {
  const hasPlus = raw.trim().startsWith('+')
  const digits = raw.replace(/\D/g, '')
  if (!digits) return null
  const full = hasPlus ? digits : digits.length === 10 ? defaultCountryCode + digits : digits
  if (full.length < 8 || full.length > 15) return null
  return '+' + full
}

export function validatePassword(raw: string): string | null {
  if (raw.length < MIN_PASSWORD) return `Usa al menos ${MIN_PASSWORD} caracteres.`
  return null
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || 'Hola'
}

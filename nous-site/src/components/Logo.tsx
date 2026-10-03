type Props = { className?: string; variant?: 'tile' | 'plain' }

// Marca Nous: una "N" cuyo trazo izquierdo nace de un punto, la cabeza de una persona.
// Es la inicial de Nous (del griego "mente") con el ser humano dentro de la inteligencia.
// "tile" = sobre fondo terracota (header, avatar). "plain" = solo trazos en terracota (saludo).
export function LogoMark({ className = 'h-8 w-8', variant = 'tile' }: Props) {
  const tile = variant === 'tile'
  const fg = tile ? '#FAF9F5' : '#C96442'
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" role="img" aria-label="Nous">
      {tile && <rect width="48" height="48" rx="13" fill="#C96442" />}
      <circle cx="14" cy="11.5" r="3.6" fill={fg} />
      <path
        d="M14 19V37M14 19L34 37M34 37V11"
        stroke={fg}
        strokeWidth="4.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

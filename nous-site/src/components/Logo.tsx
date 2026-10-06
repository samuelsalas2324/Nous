import { useId } from 'react'

type Props = { className?: string; variant?: 'tile' | 'plain' }

// Marca Nous: una "N" cuyo trazo izquierdo nace de un punto, la cabeza de una persona.
// Es la inicial de Nous (del griego "mente") con el ser humano dentro de la inteligencia.
// "tile" = sobre baldosa con degradado coral. "plain" = solo trazos con degradado.
export function LogoMark({ className = 'h-8 w-8', variant = 'tile' }: Props) {
  const tile = variant === 'tile'
  const uid = useId().replace(/:/g, '')
  const tileId = `nous-tile-${uid}`
  const plainId = `nous-plain-${uid}`
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" role="img" aria-label="Nous">
      <defs>
        <linearGradient id={tileId} x1="4" y1="2" x2="44" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF8A5C" />
          <stop offset="1" stopColor="#FF5E8A" />
        </linearGradient>
        <linearGradient id={plainId} x1="8" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF9A6C" />
          <stop offset="1" stopColor="#FF6A92" />
        </linearGradient>
      </defs>
      {tile && <rect width="48" height="48" rx="13" fill={`url(#${tileId})`} />}
      {tile && <rect x="0.5" y="0.5" width="47" height="47" rx="12.5" stroke="#fff" strokeOpacity="0.28" />}
      <circle cx="14" cy="11.5" r="3.6" fill={tile ? '#1D0C05' : `url(#${plainId})`} />
      <path
        d="M14 19V37M14 19L34 37M34 37V11"
        stroke={tile ? '#1D0C05' : `url(#${plainId})`}
        strokeWidth="4.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

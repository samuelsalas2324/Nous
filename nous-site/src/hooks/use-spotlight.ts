import { useEffect } from 'react'

/** Fija --mx/--my en la tarjeta `.spot` bajo el cursor, para el foco de luz (ver index.css). Un solo listener global. */
export function useSpotlight() {
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return
    let raf = 0
    const onMove = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>('.spot')
      if (!el) return
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        el.style.setProperty('--mx', `${e.clientX - r.left}px`)
        el.style.setProperty('--my', `${e.clientY - r.top}px`)
      })
    }
    document.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('pointermove', onMove)
    }
  }, [])
}

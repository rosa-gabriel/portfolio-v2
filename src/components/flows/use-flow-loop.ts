import { useEffect, useRef, useState } from 'react'

const MAX_FRAME_MS = 64
const VERTICAL_BREAKPOINT = 720

export function useFlowLoop(step: (dt: number, autoplay: boolean) => void) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stepRef = useRef(step)
  const [, setFrame] = useState(0)
  const [vertical, setVertical] = useState(false)

  useEffect(() => {
    stepRef.current = step
  })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const autoplay = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    let last = 0

    const loop = (now: number) => {
      const dt = last ? Math.min(now - last, MAX_FRAME_MS) : 16
      last = now
      stepRef.current(dt, autoplay)
      setFrame((value) => value + 1)
      frame = requestAnimationFrame(loop)
    }

    const visibility = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !frame) {
        last = 0
        frame = requestAnimationFrame(loop)
      }
      if (!entry.isIntersecting && frame) {
        cancelAnimationFrame(frame)
        frame = 0
      }
    })
    const size = new ResizeObserver(([entry]) => setVertical(entry.contentRect.width < VERTICAL_BREAKPOINT))

    visibility.observe(container)
    size.observe(container)
    return () => {
      visibility.disconnect()
      size.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [])

  const refresh = () => setFrame((value) => value + 1)

  return { containerRef, vertical, refresh }
}

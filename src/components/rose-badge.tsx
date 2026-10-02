import { useEffect, useRef } from 'react'
import { FallingPetals } from '@/components/falling-petals'
import { RoseIcon } from '@/components/rose-icon'

const DEGREES_PER_PIXEL = 0.3
const STIFFNESS = 40
const DAMPING = 11

export function RoseBadge() {
  const iconRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const icon = iconRef.current
    if (!icon || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let target = window.scrollY * DEGREES_PER_PIXEL
    let angle = target
    let velocity = 0
    let frame = 0
    let lastTime = 0

    const apply = () => {
      icon.style.transform = `rotate(${angle.toFixed(2)}deg)`
    }

    const tick = (now: number) => {
      const dt = lastTime ? Math.min((now - lastTime) / 1000, 1 / 30) : 1 / 60
      lastTime = now

      velocity += (STIFFNESS * (target - angle) - DAMPING * velocity) * dt
      angle += velocity * dt
      apply()

      if (Math.abs(target - angle) < 0.01 && Math.abs(velocity) < 0.01) {
        angle = target
        apply()
        frame = 0
        lastTime = 0
        return
      }
      frame = requestAnimationFrame(tick)
    }

    const onScroll = () => {
      target = window.scrollY * DEGREES_PER_PIXEL
      if (!frame) frame = requestAnimationFrame(tick)
    }

    apply()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div className="relative flex justify-center" aria-hidden="true">
      <div ref={iconRef} className="will-change-transform">
        <RoseIcon className="size-8" />
      </div>
      <FallingPetals />
    </div>
  )
}

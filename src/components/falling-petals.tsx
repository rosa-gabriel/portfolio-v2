import { useEffect, useRef, useState, type AnimationEvent, type CSSProperties } from 'react'

const PETAL_PATH = 'M32 32C18 30 15 14 32 5C49 14 46 30 32 32Z'
const PETAL_COLORS = ['#C34043', '#E46876', '#A8323A']
const PIXELS_PER_PETAL = 90
const MIN_SPAWN_INTERVAL_MS = 100
const MAX_PETALS = 28
const MIN_VELOCITY = 0.3
const FULL_RATE_VELOCITY = 1.8

type Petal = {
  id: number
  style: CSSProperties
  swayStyle: CSSProperties
  flutterStyle: CSSProperties
  size: number
  color: string
}

const random = (min: number, max: number) => min + Math.random() * (max - min)

function createPetal(id: number): Petal {
  return {
    id,
    size: random(16, 28),
    color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
    style: {
      left: random(-14, 14),
      top: random(-6, 6),
      animationDuration: `${random(1.25, 2.25)}s`,
      '--drift': `${random(-6, 6)}vw`,
    } as CSSProperties,
    swayStyle: {
      animationDuration: `${random(1.4, 2.8)}s`,
      animationDelay: `-${random(0, 2)}s`,
      '--sway': `${random(18, 60)}px`,
      '--tilt': `${random(10, 35)}deg`,
    } as CSSProperties,
    flutterStyle: {
      animationDuration: `${random(1.6, 4)}s`,
      animationDirection: Math.random() < 0.5 ? 'normal' : 'reverse',
      '--axis-x': random(0.2, 1).toFixed(2),
      '--axis-y': random(0.2, 1).toFixed(2),
    } as CSSProperties,
  }
}

export function FallingPetals() {
  const [petals, setPetals] = useState<Petal[]>([])
  const nextId = useRef(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let lastY = window.scrollY
    let lastTime = performance.now()
    let distance = 0
    let lastSpawn = 0

    const onScroll = () => {
      const now = performance.now()
      const delta = Math.abs(window.scrollY - lastY)
      const velocity = delta / Math.max(now - lastTime, 1)
      lastY = window.scrollY
      lastTime = now

      const weight = Math.min(
        Math.max((velocity - MIN_VELOCITY) / (FULL_RATE_VELOCITY - MIN_VELOCITY), 0),
        1,
      )
      distance += delta * weight

      if (distance < PIXELS_PER_PETAL || now - lastSpawn < MIN_SPAWN_INTERVAL_MS) return

      const count = Math.min(Math.floor(distance / PIXELS_PER_PETAL), 3)
      distance = 0
      lastSpawn = now

      const spawned = Array.from({ length: count }, () => createPetal(nextId.current++))
      setPetals((current) => [...current, ...spawned].slice(-MAX_PETALS))
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const removePetal = (id: number) => (event: AnimationEvent) => {
    if (event.target !== event.currentTarget) return
    setPetals((current) => current.filter((petal) => petal.id !== id))
  }

  return (
    <div className="pointer-events-none absolute top-1/2 left-1/2">
      {petals.map((petal) => (
        <span
          key={petal.id}
          className="petal-fall absolute"
          style={petal.style}
          onAnimationEnd={removePetal(petal.id)}
        >
          <span className="petal-sway block" style={petal.swayStyle}>
            <svg
              viewBox="12 2 40 32"
              width={petal.size}
              height={petal.size}
              className="petal-flutter block drop-shadow-sm"
              style={petal.flutterStyle}
            >
              <path
                d={PETAL_PATH}
                fill={petal.color}
                stroke="#1F1F28"
                strokeWidth="1.2"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </span>
        </span>
      ))}
    </div>
  )
}

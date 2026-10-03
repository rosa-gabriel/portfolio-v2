import { useEffect, useRef } from 'react'
import { isMotionPaused } from '@/lib/motion'

const PETAL_PATH = 'M32 32C18 30 15 14 32 5C49 14 46 30 32 32Z'
const PETAL_CENTER = { x: 32, y: 18.5 }
const PETAL_BOX = 32
const PETAL_COLOR_VARS = ['--petal-1', '--petal-2', '--petal-3']
const COMPACT_BREAKPOINT = 640
const SPAWN = {
  regular: { pixelsPerPetal: 90, minIntervalMs: 100, maxPetals: 28, maxBurst: 3 },
  compact: { pixelsPerPetal: 320, minIntervalMs: 350, maxPetals: 5, maxBurst: 1 },
}
const MIN_VELOCITY = 0.3
const FULL_RATE_VELOCITY = 1.8
const FALL_DISTANCE_VH = 25
const MAX_DRIFT_VW = 6
const MAX_SWAY_PX = 60

type Petal = {
  born: number
  x: number
  y: number
  size: number
  color: string
  ink: string
  fallMs: number
  drift: number
  swayMs: number
  swayPhase: number
  sway: number
  tilt: number
  flutterMs: number
  flutterDirection: 1 | -1
  axisTilt: number
}

const random = (min: number, max: number) => min + Math.random() * (max - min)

const cubicBezier = (p1: number, p2: number) => (t: number) => 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3

const fallX = cubicBezier(0.3, 0.6)
const fallY = cubicBezier(0.1, 1)

function fallProgress(time: number) {
  let low = 0
  let high = 1
  for (let i = 0; i < 12; i++) {
    const mid = (low + high) / 2
    if (fallX(mid) < time) low = mid
    else high = mid
  }
  return fallY((low + high) / 2)
}

const easeInOutSine = (t: number) => (1 - Math.cos(Math.PI * t)) / 2

const pingPong = (t: number) => {
  const phase = t % 2
  return phase > 1 ? 2 - phase : phase
}

function keyframe(progress: number) {
  if (progress < 0.06) {
    const local = progress / 0.06
    return { travel: 0, drop: local * 2, scale: 0.4 + 0.6 * local, opacity: local }
  }
  const local = (progress - 0.06) / 0.94
  return {
    travel: local,
    drop: 2 + local * (FALL_DISTANCE_VH - 2),
    scale: 1 - 0.15 * local,
    opacity: progress < 0.45 ? 1 : 1 - (progress - 0.45) / 0.55,
  }
}

export function FallingPetals() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const shape = new Path2D(PETAL_PATH)
    const petals: Petal[] = []
    let frame = 0
    let width = 0
    let height = 0
    let ratio = 1

    const resize = () => {
      ratio = Math.min(window.devicePixelRatio || 1, 2)
      width = (window.innerWidth * MAX_DRIFT_VW * 2) / 100 + MAX_SWAY_PX * 2 + 120
      height = (window.innerHeight * (FALL_DISTANCE_VH + 4)) / 100 + 60
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      canvas.style.marginLeft = `${-width / 2}px`
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
    }

    const draw = (now: number) => {
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      context.clearRect(0, 0, width, height)
      const vw = window.innerWidth / 100
      const vh = window.innerHeight / 100

      for (let i = petals.length - 1; i >= 0; i--) {
        const petal = petals[i]
        const progress = (now - petal.born) / petal.fallMs
        if (progress >= 1) {
          petals.splice(i, 1)
          continue
        }
        const { travel, drop, scale, opacity } = keyframe(fallProgress(Math.max(progress, 0)))
        const age = now - petal.born
        const swing = easeInOutSine(pingPong(age / petal.swayMs + petal.swayPhase)) * 2 - 1
        const flutter = (age / petal.flutterMs) * Math.PI * 2 * petal.flutterDirection

        context.save()
        context.globalAlpha = opacity
        context.translate(width / 2 + petal.x + petal.drift * vw * travel + swing * petal.sway, 30 + petal.y + drop * vh)
        context.rotate((swing * petal.tilt * Math.PI) / 180 + Math.sin(flutter) * petal.axisTilt)
        context.scale((scale * petal.size * Math.cos(flutter)) / PETAL_BOX, (scale * petal.size) / PETAL_BOX)
        context.translate(-PETAL_CENTER.x, -PETAL_CENTER.y)
        context.fillStyle = petal.color
        context.fill(shape)
        context.lineWidth = (1.2 * PETAL_BOX) / (petal.size * scale)
        context.lineJoin = 'round'
        context.strokeStyle = petal.ink
        context.stroke(shape)
        context.restore()
      }

      frame = petals.length ? requestAnimationFrame(draw) : 0
      if (!frame) context.clearRect(0, 0, width, height)
    }

    let lastY = window.scrollY
    let lastTime = performance.now()
    let distance = 0
    let lastSpawn = 0

    const onScroll = () => {
      if (isMotionPaused()) return
      const now = performance.now()
      const delta = Math.abs(window.scrollY - lastY)
      const velocity = delta / Math.max(now - lastTime, 1)
      lastY = window.scrollY
      lastTime = now

      const weight = Math.min(Math.max((velocity - MIN_VELOCITY) / (FULL_RATE_VELOCITY - MIN_VELOCITY), 0), 1)
      distance += delta * weight

      const spawn = window.innerWidth < COMPACT_BREAKPOINT ? SPAWN.compact : SPAWN.regular
      if (distance < spawn.pixelsPerPetal || now - lastSpawn < spawn.minIntervalMs) return

      const count = Math.min(Math.floor(distance / spawn.pixelsPerPetal), spawn.maxBurst)
      distance = 0
      lastSpawn = now

      const styles = getComputedStyle(canvas)
      for (let i = 0; i < count; i++) {
        petals.push({
          born: now,
          x: random(-14, 14),
          y: random(-6, 6),
          size: random(16, 28),
          color: styles.getPropertyValue(PETAL_COLOR_VARS[Math.floor(Math.random() * PETAL_COLOR_VARS.length)]),
          ink: styles.getPropertyValue('--rose-ink'),
          fallMs: random(1250, 2250),
          drift: random(-MAX_DRIFT_VW, MAX_DRIFT_VW),
          swayMs: random(1400, 2800),
          swayPhase: random(0, 2),
          sway: random(18, MAX_SWAY_PX),
          tilt: random(10, 35),
          flutterMs: random(1600, 4000),
          flutterDirection: Math.random() < 0.5 ? 1 : -1,
          axisTilt: random(0.05, 0.25),
        })
      }
      petals.splice(0, Math.max(0, petals.length - spawn.maxPetals))
      if (!frame) frame = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-1/2 -mt-[30px]" />
}

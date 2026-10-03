import { useCallback, useEffect, useRef, useState } from 'react'
import { useMotionPaused } from '@/lib/motion'

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function useCarousel(count: number, autoAdvanceMs: number) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [positions, setPositions] = useState(count)
  const [seen, setSeen] = useState<Set<number>>(() => new Set())
  const [paused, setPaused] = useState(false)
  const [onScreen, setOnScreen] = useState(false)
  const motionPaused = useMotionPaused()

  const step = useCallback(() => {
    const scroller = scrollerRef.current
    const card = scroller?.firstElementChild as HTMLElement | null
    if (!scroller || !card) return 0
    return card.offsetWidth + parseFloat(getComputedStyle(scroller).columnGap || '0')
  }, [])

  const scrollToIndex = useCallback(
    (index: number) => {
      scrollerRef.current?.scrollTo({ left: index * step(), behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
    },
    [step],
  )

  const move = useCallback(
    (direction: 1 | -1) => {
      const scroller = scrollerRef.current
      if (!scroller) return
      const atEnd = scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 4
      const atStart = scroller.scrollLeft <= 4
      if (direction === 1 && atEnd) return scrollToIndex(0)
      if (direction === -1 && atStart) return scrollToIndex(positions - 1)
      scrollToIndex(Math.round(scroller.scrollLeft / step()) + direction)
    },
    [positions, scrollToIndex, step],
  )

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    const onScroll = () => setActive(Math.round(scroller.scrollLeft / Math.max(step(), 1)))
    const measure = () => {
      const visibleCards = Math.max(1, Math.round(scroller.clientWidth / Math.max(step(), 1)))
      setPositions(Math.max(1, count - visibleCards + 1))
      onScroll()
    }
    scroller.addEventListener('scroll', onScroll, { passive: true })
    const resize = new ResizeObserver(measure)
    resize.observe(scroller)

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting)
        if (!visible.length) return
        setSeen((current) => {
          const next = new Set(current)
          visible.forEach((entry) => next.add(Number((entry.target as HTMLElement).dataset.index)))
          return next
        })
      },
      { root: scroller, threshold: 0.6 },
    )
    Array.from(scroller.children).forEach((child) => observer.observe(child))
    const screen = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting))
    screen.observe(scroller)

    return () => {
      scroller.removeEventListener('scroll', onScroll)
      resize.disconnect()
      observer.disconnect()
      screen.disconnect()
    }
  }, [count, step])

  useEffect(() => {
    if (paused || motionPaused || !onScreen || positions <= 1 || prefersReducedMotion()) return
    const timer = window.setInterval(() => move(1), autoAdvanceMs)
    return () => window.clearInterval(timer)
  }, [paused, motionPaused, onScreen, positions, move, autoAdvanceMs])

  const pauseHandlers = {
    onMouseEnter: () => setPaused(true),
    onMouseLeave: () => setPaused(false),
    onFocus: () => setPaused(true),
    onBlur: () => setPaused(false),
  }

  return { scrollerRef, active, positions, seen, move, scrollToIndex, pauseHandlers }
}

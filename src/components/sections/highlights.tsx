import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const HIGHLIGHTS = [
  { id: 'h1', path: '~/weg/developers-suite' },
  { id: 'h2', path: '~/weg/self-service-infra' },
  { id: 'h3', path: '~/weg/streaming-platform' },
  { id: 'h4', path: '~/weg/streaming-platform' },
  { id: 'h5', path: '~/weg/api-gateway' },
  { id: 'h6', path: '~/weg/developers-suite' },
  { id: 'h7', path: '~/weg/streaming-platform' },
  { id: 'h8', path: '~/thesis/oxid-gateway' },
] as const

const AUTO_ADVANCE_MS = 4500

export function Highlights() {
  const { t } = useTranslation()
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [positions, setPositions] = useState<number>(HIGHLIGHTS.length)
  const [seen, setSeen] = useState<Set<number>>(() => new Set())
  const [paused, setPaused] = useState(false)

  const step = useCallback(() => {
    const scroller = scrollerRef.current
    const card = scroller?.firstElementChild as HTMLElement | null
    if (!scroller || !card) return 0
    return card.offsetWidth + parseFloat(getComputedStyle(scroller).columnGap || '0')
  }, [])

  const scrollToIndex = useCallback(
    (index: number) => {
      const scroller = scrollerRef.current
      if (!scroller) return
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      scroller.scrollTo({ left: index * step(), behavior: reduced ? 'auto' : 'smooth' })
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
      setPositions(Math.max(1, HIGHLIGHTS.length - visibleCards + 1))
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

    return () => {
      scroller.removeEventListener('scroll', onScroll)
      resize.disconnect()
      observer.disconnect()
    }
  }, [step])

  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => move(1), AUTO_ADVANCE_MS)
    return () => window.clearInterval(timer)
  }, [paused, move])

  return (
    <section
      id="highlights"
      aria-roledescription="carousel"
      aria-label={t('highlights.label')}
      className="mx-auto w-full max-w-5xl px-4 pb-10 sm:px-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-kanagawa-blue">{t('highlights.label')}</p>
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon-sm" aria-label={t('highlights.previous')} onClick={() => move(-1)}>
            <ChevronLeft />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" aria-label={t('highlights.next')} onClick={() => move(1)}>
            <ChevronRight />
          </Button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {HIGHLIGHTS.map(({ id, path }, index) => (
          <article
            key={id}
            data-index={index}
            data-visible={seen.has(index) || undefined}
            aria-roledescription="slide"
            className="flex w-[85%] flex-none snap-start flex-col gap-3 rounded-md border border-border bg-card p-5 sm:w-[calc(50%-0.5rem)] lg:w-[calc((100%-2rem)/3)]"
          >
            <p className="truncate text-xs text-muted-foreground">
              <span className="text-kanagawa-green">$</span> cd {path}
            </p>
            <p className="text-3xl leading-tight font-semibold tracking-tight">
              <span className="gain">{t(`highlights.items.${id}.headline`)}</span>
            </p>
            <p className="text-sm text-muted-foreground">{t(`highlights.items.${id}.detail`)}</p>
          </article>
        ))}
      </div>

      <div className="mt-4 flex justify-center gap-1.5">
        {Array.from({ length: positions }, (_, index) => (
          <button
            key={index}
            type="button"
            aria-label={t('highlights.goTo', { n: index + 1 })}
            aria-current={index === active}
            onClick={() => scrollToIndex(index)}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              index === active ? 'w-6 bg-primary' : 'w-1.5 bg-border hover:bg-muted-foreground',
            )}
          />
        ))}
      </div>
    </section>
  )
}

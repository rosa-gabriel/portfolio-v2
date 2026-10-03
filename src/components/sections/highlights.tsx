import { ArrowUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CarouselArrows, CarouselDots } from '@/components/carousel-controls'
import { useCarousel } from '@/hooks/use-carousel'

type Highlight = {
  id: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'h7' | 'h8'
  path: string
  article?: string
}

const HIGHLIGHTS: Highlight[] = [
  { id: 'h1', path: '~/weg/developers-suite' },
  { id: 'h2', path: '~/weg/self-service-infra' },
  { id: 'h3', path: '~/weg/streaming-platform' },
  { id: 'h4', path: '~/weg/streaming-platform' },
  { id: 'h5', path: '~/weg/api-gateway' },
  { id: 'h6', path: '~/weg/developers-suite' },
  { id: 'h7', path: '~/weg/streaming-platform' },
  { id: 'h8', path: '~/thesis/oxid-gateway' },
]

const AUTO_ADVANCE_MS = 4500

export function Highlights() {
  const { t } = useTranslation()
  const { scrollerRef, active, positions, seen, move, scrollToIndex, pauseHandlers } = useCarousel(
    HIGHLIGHTS.length,
    AUTO_ADVANCE_MS,
  )

  return (
    <section
      id="highlights"
      aria-roledescription="carousel"
      aria-label={t('highlights.label')}
      className="mx-auto w-full max-w-5xl px-4 pb-10 sm:px-6"
      {...pauseHandlers}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-kanagawa-blue">{t('highlights.label')}</p>
        <CarouselArrows previousLabel={t('highlights.previous')} nextLabel={t('highlights.next')} onMove={move} />
      </div>

      <div
        ref={scrollerRef}
        tabIndex={0}
        role="group"
        aria-label={t('a11y.scrollRegion', { label: t('highlights.label') })}
        className="rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {HIGHLIGHTS.map(({ id, path, article }, index) => (
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
            {article && (
              <a
                href={article}
                target="_blank"
                rel="noreferrer"
                className="group mt-auto inline-flex items-center gap-1 self-start text-xs text-primary hover:underline"
              >
                <span className="text-kanagawa-green">$</span> {t('highlights.readArticle')}
                <ArrowUpRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            )}
          </article>
        ))}
      </div>

      <CarouselDots
        positions={positions}
        active={active}
        onSelect={scrollToIndex}
        label={(index) => t('highlights.goTo', { n: index + 1 })}
      />
    </section>
  )
}

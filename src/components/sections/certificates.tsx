import type { CSSProperties } from 'react'
import { Award, ArrowUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CarouselArrows, CarouselDots } from '@/components/carousel-controls'
import { useCarousel } from '@/hooks/use-carousel'
import { useInView } from '@/hooks/use-in-view'
import { certificates } from '@/lib/certificates'

export function Certificates() {
  const { t, i18n } = useTranslation()
  const [sectionRef, inView] = useInView<HTMLElement>(0.15)
  const { scrollerRef, active, positions, move, scrollToIndex, pauseHandlers } = useCarousel(certificates.length, 5000)
  const formatter = new Intl.DateTimeFormat(i18n.resolvedLanguage ?? i18n.language, { month: 'short', year: 'numeric' })

  return (
    <section
      ref={sectionRef}
      id="certificates"
      data-visible={inView || undefined}
      aria-roledescription="carousel"
      aria-label={t('certificates.label')}
      className="render-on-view mx-auto max-w-5xl px-4 py-16 sm:px-6 [--section-estimate:520px]"
      {...pauseHandlers}
    >
      <p className="text-sm text-kanagawa-blue">{t('certificates.eyebrow')}</p>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{t('certificates.title')}</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">{t('certificates.subtitle')}</p>
        </div>
        <CarouselArrows previousLabel={t('certificates.previous')} nextLabel={t('certificates.next')} onMove={move} />
      </div>

      <div
        ref={scrollerRef}
        className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {certificates.map((certificate, index) => {
          const [year, month] = certificate.issued.split('-').map(Number)
          const Wrapper = certificate.credentialUrl ? 'a' : 'div'
          return (
            <article
              key={certificate.id}
              data-index={index}
              aria-roledescription="slide"
              className="cert-card w-[85%] flex-none snap-start sm:w-[calc(50%-0.5rem)] lg:w-[calc((100%-2rem)/3)]"
              style={{ '--i': index } as CSSProperties}
            >
              <Wrapper
                {...(certificate.credentialUrl && {
                  href: certificate.credentialUrl,
                  target: '_blank',
                  rel: 'noreferrer',
                  'aria-label': `${t('certificates.verify')}: ${certificate.title}`,
                })}
                className="group relative flex h-full flex-col gap-3 overflow-hidden rounded-md border border-border bg-card p-5 outline-none transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-primary/60 hover:shadow-lg focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:hover:translate-y-0"
              >
                <span aria-hidden className="cert-sheen pointer-events-none absolute inset-y-0 -left-full w-1/2" />
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-9 place-items-center rounded-md border border-kanagawa-yellow/40 bg-kanagawa-yellow/10 text-kanagawa-yellow transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-110">
                    <Award className="size-4.5" />
                  </span>
                  {certificate.credentialUrl && (
                    <ArrowUpRight className="size-4 text-muted-foreground transition-[transform,color] duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-muted-foreground">
                    <span className="text-kanagawa-green">$</span> {certificate.issuer.toLowerCase()}
                  </p>
                  <p className="leading-snug font-semibold tracking-tight">{certificate.title}</p>
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                  {certificate.tags.map((tag) => (
                    <span key={tag} className="rounded-sm border border-border bg-secondary px-1.5 py-0.5 text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                  <span className="ml-auto text-muted-foreground tabular-nums">
                    {t('certificates.issued')} {formatter.format(new Date(year, month - 1, 1))}
                  </span>
                </div>
              </Wrapper>
            </article>
          )
        })}
      </div>

      <CarouselDots
        positions={positions}
        active={active}
        onSelect={scrollToIndex}
        label={(index) => t('certificates.goTo', { n: index + 1 })}
      />
    </section>
  )
}

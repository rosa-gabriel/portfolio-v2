import { useState, type CSSProperties } from 'react'
import { ArrowRight, ArrowUpRight, Play } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useInView } from '@/hooks/use-in-view'
import { caseStudies, type CaseStudy } from '@/lib/case-studies'
import { reveal } from '@/lib/reveal'
import { cn } from '@/lib/utils'

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function CaseStudies() {
  const { t } = useTranslation()
  const [gridRef, inView] = useInView<HTMLUListElement>(0.1)
  const [openId, setOpenId] = useState<CaseStudy['id'] | null>(null)
  const [pendingAnchor, setPendingAnchor] = useState<string | null>(null)
  const current = caseStudies.find((study) => study.id === openId)

  const goToDemo = (anchor: string) => {
    setPendingAnchor(anchor)
    setOpenId(null)
  }

  return (
    <section
      id="case-studies"
      aria-label={t('caseStudies.title')}
      className="render-on-view mx-auto max-w-5xl scroll-mt-12 px-4 py-16 sm:px-6 [--section-estimate:1100px]"
    >
      <p {...reveal('type')} className="text-sm text-kanagawa-blue">
        {t('caseStudies.eyebrow')}
      </p>
      <h2 {...reveal('title', 1)} className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        {t('caseStudies.title')}
      </h2>
      <p {...reveal('up', 2)} className="mt-2 max-w-2xl text-muted-foreground">
        {t('caseStudies.subtitle')}
      </p>

      <ul
        ref={gridRef}
        data-visible={inView || undefined}
        className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {caseStudies.map((study, index) => (
          <li
            key={study.id}
            className={cn('case-card', study.featured && 'sm:col-span-2')}
            style={{ '--i': index } as CSSProperties}
          >
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={() => setOpenId(study.id)}
              className="group relative flex h-full w-full flex-col gap-3 overflow-hidden rounded-md border border-border bg-card p-5 text-left outline-none transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-primary/60 hover:shadow-lg focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:hover:translate-y-0"
            >
              <span aria-hidden className="cert-sheen pointer-events-none absolute inset-y-0 -left-full w-1/2" />
              <span className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span className="truncate">
                  <span className="text-kanagawa-green">$</span> cd {study.path}
                </span>
                <span className="shrink-0 tabular-nums">{study.period}</span>
              </span>
              <span className={cn('font-semibold tracking-tight', study.featured ? 'text-2xl' : 'text-xl')}>
                {t(`caseStudies.items.${study.id}.title`)}
              </span>
              <span className="text-sm text-muted-foreground">{t(`caseStudies.items.${study.id}.summary`)}</span>
              <span className="text-sm">
                <span className="gain">{t(`caseStudies.items.${study.id}.impact`)}</span>
              </span>
              <span className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
                {study.stack.slice(0, study.featured ? 5 : 3).map((skill) => (
                  <span
                    key={skill}
                    className="rounded-sm border border-border bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground"
                  >
                    {skill}
                  </span>
                ))}
                <span className="ml-auto inline-flex items-center gap-1 text-xs text-primary">
                  {t('caseStudies.open')}
                  <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={Boolean(current)} onOpenChange={(open) => !open && setOpenId(null)}>
        <DialogContent
          closeLabel={t('caseStudies.close')}
          className="max-h-[88svh] grid-rows-[minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-2xl"
          onCloseAutoFocus={(event) => {
            if (!pendingAnchor) return
            event.preventDefault()
            const target = document.getElementById(pendingAnchor)
            setPendingAnchor(null)
            target?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
          }}
        >
          {current && <CaseStudyDetails study={current} onDemo={goToDemo} />}
        </DialogContent>
      </Dialog>
    </section>
  )
}

function CaseStudyDetails({ study, onDemo }: { study: CaseStudy; onDemo: (anchor: string) => void }) {
  const { t } = useTranslation()
  const item = `caseStudies.items.${study.id}` as const
  const decisions = t(`${item}.decisions`, { returnObjects: true }) as string[]
  const outcomes = t(`${item}.outcomes`, { returnObjects: true }) as string[]

  const blocks = [
    { label: t('caseStudies.context'), body: <p>{t(`${item}.context`)}</p> },
    { label: t('caseStudies.role'), body: <p>{t(`${item}.role`)}</p> },
    { label: t('caseStudies.decisions'), body: <BulletList items={decisions} /> },
    { label: t('caseStudies.outcome'), body: <BulletList items={outcomes} /> },
  ]

  return (
    <div className="flex min-h-0 flex-col overflow-y-auto">
      <DialogHeader className="relative shrink-0 gap-2 border-b border-border bg-secondary px-5 pt-5 pb-4">
        <p className="pr-8 text-xs text-muted-foreground">
          <span className="text-kanagawa-green">$</span> cd {study.path}
          <span className="ml-2 tabular-nums">
            · {study.org} · {study.period}
          </span>
        </p>
        <DialogTitle className="pr-8 text-xl leading-tight font-semibold tracking-tight sm:text-2xl">
          {t(`${item}.title`)}
        </DialogTitle>
        <DialogDescription>{t(`${item}.summary`)}</DialogDescription>
      </DialogHeader>

      <div className="flex shrink-0 flex-col gap-5 px-5 py-5">
        {blocks.map((block, index) => (
          <div
            key={block.label}
            className="flex flex-col gap-1.5 text-sm leading-relaxed duration-500 animate-in fill-mode-both fade-in-0 slide-in-from-bottom-2 motion-reduce:animate-none"
            style={{ animationDelay: `${80 + index * 70}ms` }}
          >
            <p className="text-xs text-kanagawa-blue"># {block.label}</p>
            {block.body}
          </div>
        ))}

        <div className="flex flex-col gap-2">
          <p className="text-xs text-kanagawa-blue"># {t('caseStudies.stack')}</p>
          <ul className="flex flex-wrap gap-1.5">
            {study.stack.map((skill) => (
              <li key={skill} className="rounded-sm border border-border bg-secondary px-1.5 py-0.5 text-xs">
                {skill}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          {study.demos.map((demo) => (
            <Button
              key={demo.anchor}
              type="button"
              variant="outline"
              size="sm"
              className="h-auto min-h-8 py-1.5 text-left whitespace-normal"
              onClick={() => onDemo(demo.anchor)}
            >
              <Play data-icon="inline-start" />
              {t('caseStudies.seeLive')}: {t(`${demo.key}.title`)}
              <ArrowUpRight data-icon="inline-end" />
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-1.5 text-muted-foreground">
      {items.map((entry) => (
        <li key={entry} className="flex gap-2">
          <span className="text-kanagawa-green">›</span>
          <span>{entry}</span>
        </li>
      ))}
    </ul>
  )
}

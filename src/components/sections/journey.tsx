import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { ArrowUpRight, Briefcase, ChevronLeft, ChevronRight, GraduationCap, Maximize2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { TerminalWindow } from '@/components/terminal-window'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useInView } from '@/hooks/use-in-view'
import {
  journeyEntries,
  journeyLanes,
  journeyRange,
  monthIndexToDate,
  toMonthIndex,
  type JourneyEntry,
  type JourneyLane,
} from '@/lib/journey'
import { cn } from '@/lib/utils'

const laneStyles: Record<JourneyLane, { bar: string; text: string; chip: string; icon: typeof Briefcase }> = {
  work: {
    bar: 'border-kanagawa-blue/60 bg-kanagawa-blue/15 group-hover:bg-kanagawa-blue/25 group-data-[selected=true]:bg-kanagawa-blue/30 group-data-[selected=true]:border-kanagawa-blue',
    text: 'text-kanagawa-blue',
    chip: 'border-kanagawa-blue/40 bg-kanagawa-blue/10 text-kanagawa-blue',
    icon: Briefcase,
  },
  education: {
    bar: 'border-kanagawa-violet/60 bg-kanagawa-violet/15 group-hover:bg-kanagawa-violet/25 group-data-[selected=true]:bg-kanagawa-violet/30 group-data-[selected=true]:border-kanagawa-violet',
    text: 'text-kanagawa-violet',
    chip: 'border-kanagawa-violet/40 bg-kanagawa-violet/10 text-kanagawa-violet',
    icon: GraduationCap,
  },
}

const rangeStart = toMonthIndex(journeyRange.start)
const rangeEnd = toMonthIndex(journeyRange.end)
const rangeSpan = rangeEnd - rangeStart
const startYear = Math.floor(rangeStart / 12)
const years = Array.from({ length: Math.floor(rangeEnd / 12) - startYear }, (_, index) => startYear + index)

const now = toMonthIndex(new Date())

const toPercent = (month: number) => ((Math.min(Math.max(month, rangeStart), rangeEnd) - rangeStart) / rangeSpan) * 100

function describe(entry: JourneyEntry) {
  const start = toMonthIndex(entry.start)
  const end = entry.end ? toMonthIndex(entry.end) : now
  return {
    start,
    end,
    months: end - start + 1,
    ongoing: !entry.end || end >= now,
    upcoming: Boolean(entry.end) && end > now,
  }
}

const entries = journeyEntries.map((entry, order) => {
  const info = describe(entry)
  const left = toPercent(info.start)
  const width = toPercent(info.end + 1) - left
  const futureShare = info.upcoming ? (info.end - Math.max(now, info.start) + 1) / info.months : 0
  return { entry, order, info, left, width, futureShare }
})

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

type Section = { title: string; points: string[] }

function useJourneyFormat() {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? i18n.language

  return useMemo(() => {
    const formatter = new Intl.DateTimeFormat(language, { month: 'short', year: 'numeric' })
    const formatMonth = (month: number) => {
      const parts = formatter.formatToParts(monthIndexToDate(month))
      const name = parts.find((part) => part.type === 'month')?.value.replace('.', '') ?? ''
      const year = parts.find((part) => part.type === 'year')?.value ?? ''
      return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`
    }
    const formatDuration = (months: number) => {
      const fullYears = Math.floor(months / 12)
      const rest = months % 12
      return [fullYears && t('journey.years', { count: fullYears }), rest && t('journey.months', { count: rest })]
        .filter(Boolean)
        .join(' ')
    }
    return { formatMonth, formatDuration }
  }, [language, t])
}

export function Journey() {
  const { t } = useTranslation()
  const { formatMonth, formatDuration } = useJourneyFormat()
  const [sectionRef, inView] = useInView<HTMLElement>(0.15)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const barRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [selected, setSelected] = useState(() => Math.max(0, journeyEntries.findIndex((entry) => !entry.end)))
  const [open, setOpen] = useState(false)

  const centerBar = useCallback((index: number, smooth: boolean) => {
    const scroller = scrollerRef.current
    const bar = barRefs.current[index]
    if (!scroller || !bar || scroller.scrollWidth <= scroller.clientWidth) return
    scroller.scrollTo({
      left: bar.offsetLeft - (scroller.clientWidth - bar.offsetWidth) / 2,
      behavior: smooth && !prefersReducedMotion() ? 'smooth' : 'auto',
    })
  }, [])

  useEffect(() => centerBar(selected, inView), [centerBar, selected, inView])

  const select = useCallback((index: number, focus = false) => {
    const next = (index + journeyEntries.length) % journeyEntries.length
    setSelected(next)
    if (focus) barRefs.current[next]?.focus({ preventScroll: true })
  }, [])

  const onBarKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const moves: Record<string, number> = {
      ArrowRight: selected + 1,
      ArrowDown: selected + 1,
      ArrowLeft: selected - 1,
      ArrowUp: selected - 1,
      Home: 0,
      End: journeyEntries.length - 1,
    }
    if (!(event.key in moves)) return
    event.preventDefault()
    select(moves[event.key], true)
  }

  const current = entries[selected]
  const periodOf = (item: (typeof entries)[number]) =>
    `${formatMonth(item.info.start)} - ${item.entry.end ? formatMonth(item.info.end) : t('journey.present')}`

  return (
    <section
      ref={sectionRef}
      id="journey"
      data-visible={inView || undefined}
      aria-label={t('journey.label')}
      className="render-on-view mx-auto max-w-5xl px-4 py-16 sm:px-6 [--section-estimate:820px]"
    >
      <p className="text-sm text-kanagawa-blue">{t('journey.eyebrow')}</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{t('journey.title')}</h2>
      <p className="mt-2 max-w-2xl text-muted-foreground">{t('journey.subtitle')}</p>

      <TerminalWindow title={t('journey.windowTitle')} className="mt-8">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex gap-2 text-xs text-muted-foreground">
              <span className="text-kanagawa-green">›</span>
              <span className="pointer-coarse:hidden">{t('journey.hint')}</span>
              <span className="hidden pointer-coarse:inline">{t('journey.hintTouch')}</span>
            </p>
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="icon-sm" aria-label={t('journey.previous')} onClick={() => select(selected - 1)}>
                <ChevronLeft />
              </Button>
              <span className="min-w-12 text-center text-xs text-muted-foreground tabular-nums" aria-live="polite">
                {t('journey.counter', { current: selected + 1, total: journeyEntries.length })}
              </span>
              <Button type="button" variant="ghost" size="icon-sm" aria-label={t('journey.next')} onClick={() => select(selected + 1)}>
                <ChevronRight />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3">
            <div className="flex flex-col pt-7 text-xs">
              {journeyLanes.map((lane) => {
                const Icon = laneStyles[lane].icon
                return (
                  <div key={lane} className={cn('flex h-16 items-center gap-1.5', laneStyles[lane].text)}>
                    <Icon className="size-3.5" />
                    <span className="hidden sm:inline">{t(`journey.lanes.${lane}`)}</span>
                  </div>
                )
              })}
            </div>

            <div
              ref={scrollerRef}
              className="overflow-x-auto overscroll-x-contain [mask-image:linear-gradient(to_right,transparent,#000_1.5rem,#000_calc(100%-1.5rem),transparent)] md:[mask-image:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <div role="toolbar" aria-label={t('journey.label')} className="relative min-w-[44rem]">
                <div className="relative h-7 text-[0.7rem] text-muted-foreground">
                  {years.map((year, index) => (
                    <span
                      key={year}
                      className="journey-tick absolute top-1 -translate-x-1/2 tabular-nums first:translate-x-0"
                      style={{ left: `${toPercent(year * 12)}%`, '--i': index } as CSSProperties}
                    >
                      {year}
                    </span>
                  ))}
                </div>

                <div className="relative">
                  {years.map((year) => (
                    <span
                      key={year}
                      aria-hidden
                      className="absolute inset-y-0 w-px bg-border"
                      style={{ left: `${toPercent(year * 12)}%` }}
                    />
                  ))}

                  <span
                    aria-hidden
                    className="journey-cursor pointer-events-none absolute inset-y-0 left-0 w-full origin-left bg-primary/8"
                    style={{ transform: `translateX(${current.left}%) scaleX(${current.width / 100})` }}
                  />

                  {journeyLanes.map((lane) => (
                    <div key={lane} className="relative h-16 border-b border-dashed border-border last:border-b-0">
                      {entries
                        .filter((item) => item.entry.lane === lane)
                        .map((item) => {
                          const { entry, order, left, width, futureShare } = item
                          const index = journeyEntries.indexOf(entry)
                          const style = laneStyles[lane]
                          return (
                            <button
                              key={entry.id}
                              ref={(node) => {
                                barRefs.current[index] = node
                              }}
                              type="button"
                              tabIndex={index === selected ? 0 : -1}
                              data-selected={index === selected}
                              aria-pressed={index === selected}
                              aria-haspopup="dialog"
                              aria-label={`${t(`journey.items.${entry.id}.role`)}, ${entry.org}, ${periodOf(item)}`}
                              onClick={() => {
                                select(index)
                                setOpen(true)
                              }}
                              onKeyDown={onBarKeyDown}
                              className="group absolute inset-y-2 cursor-pointer rounded-md text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                              style={{ left: `${left}%`, width: `${width}%`, '--i': order } as CSSProperties}
                            >
                              <span
                                className={cn(
                                  'journey-fill absolute inset-0 overflow-hidden rounded-md border transition-[background-color,border-color,box-shadow] duration-300 group-hover:shadow-md group-data-[selected=true]:shadow-lg',
                                  style.bar,
                                )}
                              >
                                {futureShare > 0 && (
                                  <span
                                    className={cn('absolute inset-y-0 right-0 overflow-hidden border-l border-dashed opacity-40', style.text)}
                                    style={{ width: `${futureShare * 100}%` }}
                                  >
                                    <span className="journey-stripes absolute inset-y-0 -left-2.5 right-0" />
                                  </span>
                                )}
                                <span className="journey-sheen absolute inset-y-0 -left-1/2 w-1/2" />
                              </span>
                              <span className="journey-label relative flex h-full min-w-0 flex-col justify-center px-2.5 leading-tight">
                                <span className={cn('truncate text-[0.65rem]', style.text)}>{entry.org}</span>
                                <span className="truncate text-xs font-medium">{t(`journey.items.${entry.id}.short`)}</span>
                              </span>
                              {!entry.end && (
                                <span className="absolute top-1/2 -right-1 flex size-2.5 -translate-y-1/2">
                                  <span className="absolute inset-0 animate-ping rounded-full bg-kanagawa-green opacity-70 motion-reduce:animate-none" />
                                  <span className="relative size-2.5 rounded-full bg-kanagawa-green" />
                                </span>
                              )}
                            </button>
                          )
                        })}
                    </div>
                  ))}

                  <div
                    aria-hidden
                    className="journey-today pointer-events-none absolute -top-7 bottom-0 flex w-px flex-col items-center bg-kanagawa-red/70"
                    style={{ left: `${toPercent(now)}%` }}
                  >
                    <span className="-translate-y-0.5 rounded-sm bg-kanagawa-red px-1 text-[0.6rem] leading-4 text-background">
                      {t('journey.today')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <JourneyPreview
            key={current.entry.id}
            entry={current.entry}
            period={periodOf(current)}
            duration={formatDuration(current.info.months)}
            ongoing={current.info.ongoing}
            upcoming={current.info.upcoming}
            onOpen={() => setOpen(true)}
          />
        </div>
      </TerminalWindow>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          closeLabel={t('journey.close')}
          className="max-h-[88svh] grid-rows-[minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:max-w-2xl"
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            barRefs.current[selected]?.focus({ preventScroll: true })
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight') select(selected + 1)
            if (event.key === 'ArrowLeft') select(selected - 1)
          }}
        >
          <JourneyDetails
            key={current.entry.id}
            entry={current.entry}
            period={periodOf(current)}
            duration={formatDuration(current.info.months)}
            ongoing={current.info.ongoing}
            upcoming={current.info.upcoming}
          />
          <div className="flex items-center justify-between gap-2 border-t border-border bg-secondary px-4 py-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => select(selected - 1)}>
              <ChevronLeft data-icon="inline-start" />
              {t('journey.previous')}
            </Button>
            <span className="text-xs text-muted-foreground tabular-nums">
              {t('journey.counter', { current: selected + 1, total: journeyEntries.length })}
            </span>
            <Button type="button" variant="ghost" size="sm" onClick={() => select(selected + 1)}>
              {t('journey.next')}
              <ChevronRight data-icon="inline-end" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}

type EntryViewProps = {
  entry: JourneyEntry
  period: string
  duration: string
  ongoing: boolean
  upcoming: boolean
}

function EntryMeta({ entry, period, duration, ongoing, upcoming }: EntryViewProps) {
  const { t } = useTranslation()
  const style = laneStyles[entry.lane]
  const Icon = style.icon

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      <span className={cn('inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5', style.chip)}>
        <Icon className="size-3" />
        {t(`journey.lanes.${entry.lane}`)}
      </span>
      <span className="tabular-nums">{period}</span>
      <span aria-hidden>·</span>
      <span>
        {duration}
        {upcoming && ` (${t('journey.expected')})`}
      </span>
      {ongoing && (
        <span className="inline-flex items-center gap-1 text-kanagawa-green">
          <span className="size-1.5 animate-pulse rounded-full bg-kanagawa-green motion-reduce:animate-none" />
          {t('journey.ongoing')}
        </span>
      )}
    </div>
  )
}

function JourneyPreview({ onOpen, ...props }: EntryViewProps & { onOpen: () => void }) {
  const { t } = useTranslation()
  const { entry } = props
  const summary = t(`journey.items.${entry.id}.summary`, { returnObjects: true }) as string[]

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-background/40 p-4 duration-500 animate-in fade-in-0 slide-in-from-bottom-2 motion-reduce:animate-none sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 flex-col gap-2">
        <EntryMeta {...props} />
        <p className="text-lg font-semibold tracking-tight">
          {t(`journey.items.${entry.id}.role`)}
          <span className="font-normal text-muted-foreground"> @ {entry.org}</span>
        </p>
        <p className="line-clamp-2 max-w-2xl text-sm text-muted-foreground">{summary[0]}</p>
      </div>
      <Button type="button" variant="outline" size="sm" className="self-start sm:self-end" onClick={onOpen}>
        <Maximize2 data-icon="inline-start" />
        {t('journey.openDetails')}
      </Button>
    </div>
  )
}

function JourneyDetails(props: EntryViewProps) {
  const { t } = useTranslation()
  const { entry } = props
  const style = laneStyles[entry.lane]
  const summary = t(`journey.items.${entry.id}.summary`, { returnObjects: true }) as string[]
  const sections = t(`journey.items.${entry.id}.sections`, { returnObjects: true }) as Section[]
  const details = [t(`journey.items.${entry.id}.kind`), t(`journey.items.${entry.id}.mode`), entry.location].filter(Boolean)

  return (
    <div className="flex min-h-0 flex-col overflow-y-auto">
      <DialogHeader className="relative shrink-0 gap-3 overflow-hidden border-b border-border bg-secondary px-5 pt-5 pb-4">
        <span aria-hidden className={cn('journey-glow pointer-events-none absolute -top-16 -right-10 size-48 rounded-full blur-3xl', style.text)} />
        <div className="pr-8">
          <EntryMeta {...props} />
        </div>
        <DialogTitle className="pr-8 text-xl leading-tight font-semibold tracking-tight sm:text-2xl">
          {t(`journey.items.${entry.id}.role`)}
        </DialogTitle>
        <DialogDescription asChild>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <a
              href={entry.orgUrl}
              target="_blank"
              rel="noreferrer"
              className={cn('inline-flex items-center gap-0.5 font-medium hover:underline', style.text)}
            >
              {entry.org}
              <ArrowUpRight className="size-3.5" />
            </a>
            {details.map((detail) => (
              <span key={detail} className="before:mr-2 before:content-['·']">
                {detail}
              </span>
            ))}
          </div>
        </DialogDescription>
      </DialogHeader>

      <div className="flex shrink-0 flex-col gap-5 px-5 py-5">
        <div className="flex flex-col gap-2 duration-500 animate-in fade-in-0 slide-in-from-bottom-1 motion-reduce:animate-none">
          {summary.map((paragraph) => (
            <p key={paragraph} className="leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {sections.map((section, index) => (
            <div
              key={section.title}
              className="rounded-md border border-border bg-card p-3 duration-500 animate-in fill-mode-both fade-in-0 slide-in-from-bottom-2 motion-reduce:animate-none"
              style={{ animationDelay: `${120 + index * 70}ms` }}
            >
              <p className={cn('mb-2 text-xs font-semibold', style.text)}>{section.title}</p>
              <ul className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                {section.points.map((point) => (
                  <li key={point} className="flex gap-2">
                    <span className="text-kanagawa-green">›</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            <span className="text-kanagawa-green">$</span> ls {t('journey.skills')}/
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {entry.skills.map((skill, index) => (
              <li
                key={skill}
                className={cn(
                  'rounded-sm border px-1.5 py-0.5 text-xs duration-300 animate-in fill-mode-both fade-in-0 zoom-in-90 motion-reduce:animate-none',
                  style.chip,
                )}
                style={{ animationDelay: `${300 + index * 35}ms` }}
              >
                {skill}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

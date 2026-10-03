import { useState, type ReactNode, type RefObject } from 'react'
import { ChevronDown, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { TerminalWindow } from '@/components/terminal-window'
import { cn } from '@/lib/utils'
import { reveal } from '@/lib/reveal'

export type FlowMetric = {
  label: string
  value: ReactNode
  className?: string
}

type FlowSectionProps<M extends string> = {
  id: string
  eyebrow: string
  title: string
  subtitle: string
  goals: string[]
  windowTitle: string
  modeLabel: string
  modes: { id: M; label: string }[]
  mode: M
  onModeChange: (mode: M) => void
  actions: ReactNode
  metrics: FlowMetric[]
  caption: string
  containerRef: RefObject<HTMLDivElement | null>
  viewBox: { width: number; height: number }
  diagramLabel: string
  children: ReactNode
}

export function FlowSection<M extends string>({
  id,
  eyebrow,
  title,
  subtitle,
  goals,
  windowTitle,
  modeLabel,
  modes,
  mode,
  onModeChange,
  actions,
  metrics,
  caption,
  containerRef,
  viewBox,
  diagramLabel,
  children,
}: FlowSectionProps<M>) {
  return (
    <section id={id} className="render-on-view mx-auto max-w-5xl scroll-mt-12 px-4 py-14 sm:px-6 sm:py-16">
      <p {...reveal('type')} className="text-kanagawa-blue text-sm">
        {eyebrow}
      </p>
      <h2 {...reveal('title', 1)} className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h2>
      <p {...reveal('up', 2)} className="mt-2 max-w-2xl text-muted-foreground">
        {subtitle}
      </p>

      <div {...reveal('up', 3)}>
        <FlowGoals goals={goals} />
      </div>

      <div {...reveal('window', 3)} className="mt-6 sm:mt-8">
        <TerminalWindow title={windowTitle} bodyClassName="p-3 sm:p-4">
          <div ref={containerRef} className="flex flex-col gap-4">
            <div className="contents sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
              <div
                role="group"
                aria-label={modeLabel}
                className="grid grid-cols-2 gap-1 rounded-md border border-border p-0.5 sm:inline-flex"
              >
                {modes.map((option) => (
                  <Button
                    key={option.id}
                    type="button"
                    size="sm"
                    variant={mode === option.id ? 'default' : 'ghost'}
                    aria-pressed={mode === option.id}
                    onClick={() => onModeChange(option.id)}
                    className="h-auto min-h-9 py-1.5 leading-tight whitespace-normal sm:min-h-7 sm:py-0 sm:whitespace-nowrap"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
              <div className="sticky bottom-3 z-10 order-3 overflow-hidden rounded-lg border border-border bg-card/95 shadow-lg sm:static sm:order-none sm:overflow-visible sm:rounded-none sm:border-0 sm:bg-transparent sm:shadow-none">
                <div className="flex gap-1.5 overflow-x-auto overscroll-x-contain p-1.5 [mask-image:linear-gradient(to_right,transparent,#000_0.75rem,#000_calc(100%-0.75rem),transparent)] [scrollbar-width:none] sm:flex-wrap sm:justify-end sm:gap-2 sm:overflow-visible sm:p-0 sm:[mask-image:none] [&::-webkit-scrollbar]:hidden">
                  {actions}
                </div>
              </div>
            </div>

            <svg
              viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
              className="order-2 h-auto w-full select-none sm:order-none"
              role="img"
              aria-label={diagramLabel}
            >
              {children}
            </svg>

            <dl className="order-4 flex flex-wrap gap-x-6 gap-y-1 text-xs sm:order-none">
              {metrics.map((metric) => (
                <div key={metric.label} className="flex gap-1.5">
                  <dt className="text-muted-foreground">{metric.label}</dt>
                  <dd className={cn('font-semibold tabular-nums', metric.className)}>{metric.value}</dd>
                </div>
              ))}
            </dl>

            <p className="order-5 flex min-h-16 gap-2 text-sm leading-relaxed sm:order-none">
              <span className="text-kanagawa-green">›</span>
              <span>{caption}</span>
            </p>
            </div>
        </TerminalWindow>
      </div>
    </section>
  )
}

function FlowGoals({ goals }: { goals: string[] }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-5 sm:mt-6">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-9 items-center gap-2 text-sm text-kanagawa-green sm:hidden"
      >
        <span>›</span>
        {t('flow.tryThis', { count: goals.length })}
        <ChevronDown className={cn('size-4 transition-transform duration-300', open && 'rotate-180')} />
      </button>
      <div
        data-open={open}
        className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 data-[open=true]:grid-rows-[1fr] sm:grid-rows-[1fr]"
      >
        <ol className="grid gap-1.5 overflow-hidden text-sm text-muted-foreground sm:grid-cols-2">
          {goals.map((goal) => (
            <li key={goal} className="flex gap-2 first:mt-1 sm:first:mt-0">
              <span className="text-kanagawa-green">›</span>
              {goal}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

type FlowActionProps = {
  icon: LucideIcon
  label: string
  onClick: () => void
  pressed?: boolean
  variant?: 'outline' | 'ghost'
}

export function FlowAction({ icon: Icon, label, onClick, pressed, variant = 'outline' }: FlowActionProps) {
  return (
    <Button
      type="button"
      size="sm"
      variant={variant}
      aria-pressed={pressed}
      onClick={onClick}
      className="h-9 px-3 sm:h-7 sm:px-2.5"
    >
      <Icon data-icon="inline-start" />
      {label}
    </Button>
  )
}

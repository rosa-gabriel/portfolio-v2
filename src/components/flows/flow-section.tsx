import type { ReactNode, RefObject } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TerminalWindow } from '@/components/terminal-window'
import { cn } from '@/lib/utils'

export type FlowMetric = {
  label: string
  value: ReactNode
  className?: string
}

type FlowSectionProps<M extends string> = {
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
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <p className="text-kanagawa-blue text-sm">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      <p className="mt-2 max-w-2xl text-muted-foreground">{subtitle}</p>

      <ol className="mt-6 grid gap-1.5 text-sm text-muted-foreground sm:grid-cols-2">
        {goals.map((goal) => (
          <li key={goal} className="flex gap-2">
            <span className="text-kanagawa-green">›</span>
            {goal}
          </li>
        ))}
      </ol>

      <TerminalWindow title={windowTitle} className="mt-8">
        <div ref={containerRef} className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="group" aria-label={modeLabel} className="inline-flex gap-1 rounded-md border border-border p-0.5">
              {modes.map((option) => (
                <Button
                  key={option.id}
                  type="button"
                  size="sm"
                  variant={mode === option.id ? 'default' : 'ghost'}
                  aria-pressed={mode === option.id}
                  onClick={() => onModeChange(option.id)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">{actions}</div>
          </div>

          <svg
            viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
            className="h-auto w-full select-none"
            role="img"
            aria-label={diagramLabel}
          >
            {children}
          </svg>

          <dl className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
            {metrics.map((metric) => (
              <div key={metric.label} className="flex gap-1.5">
                <dt className="text-muted-foreground">{metric.label}</dt>
                <dd className={cn('font-semibold tabular-nums', metric.className)}>{metric.value}</dd>
              </div>
            ))}
          </dl>

          <p className="flex min-h-16 gap-2 text-sm leading-relaxed">
            <span className="text-kanagawa-green">›</span>
            <span>{caption}</span>
          </p>
        </div>
      </TerminalWindow>
    </section>
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
    <Button type="button" size="sm" variant={variant} aria-pressed={pressed} onClick={onClick}>
      <Icon data-icon="inline-start" />
      {label}
    </Button>
  )
}

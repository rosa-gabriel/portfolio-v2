import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type FeatureSectionProps = {
  index: string
  eyebrow: string
  title: string
  points: string[]
  linkLabel: string
  reverse?: boolean
  visual: ReactNode
}

export function FeatureSection({
  index,
  eyebrow,
  title,
  points,
  linkLabel,
  reverse,
  visual,
}: FeatureSectionProps) {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="grid items-center gap-10 md:grid-cols-2">
        <div className={cn('flex flex-col gap-4', reverse && 'md:order-2')}>
          <p className="text-kanagawa-blue text-sm">
            {index}/ {eyebrow}
          </p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
          <ul className="flex flex-col gap-2 text-muted-foreground">
            {points.map((point) => (
              <li key={point} className="flex gap-2">
                <span className="text-kanagawa-green">›</span>
                {point}
              </li>
            ))}
          </ul>
          <a href="#projects" className="text-sm text-primary underline-offset-4 hover:underline">
            {linkLabel} →
          </a>
        </div>
        <div className={cn(reverse && 'md:order-1')}>{visual}</div>
      </div>
    </section>
  )
}

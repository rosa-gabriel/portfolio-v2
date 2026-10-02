import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type TerminalWindowProps = {
  title?: string
  children: ReactNode
  className?: string
}

export function TerminalWindow({ title, children, className }: TerminalWindowProps) {
  return (
    <div className={cn('overflow-hidden rounded-md border border-border bg-card', className)}>
      <div className="flex items-center gap-1.5 border-b border-border bg-secondary px-3 py-2">
        <span className="bg-kanagawa-red size-2.5 rounded-full" />
        <span className="bg-kanagawa-yellow size-2.5 rounded-full" />
        <span className="bg-kanagawa-green size-2.5 rounded-full" />
        {title && <span className="ml-2 text-xs text-muted-foreground">{title}</span>}
      </div>
      <div className="p-4 text-sm leading-relaxed">{children}</div>
    </div>
  )
}

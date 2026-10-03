import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type TerminalWindowProps = {
  title?: string
  children: ReactNode
  className?: string
  bodyClassName?: string
}

export function TerminalWindow({ title, children, className, bodyClassName }: TerminalWindowProps) {
  // overflow-clip instead of overflow-hidden so sticky children still stick to the viewport
  return (
    <div className={cn('overflow-clip rounded-md border border-border bg-card', className)}>
      <div className="flex items-center gap-1.5 border-b border-border bg-secondary px-3 py-2">
        <span className="bg-kanagawa-red size-2.5 rounded-full" />
        <span className="bg-kanagawa-yellow size-2.5 rounded-full" />
        <span className="bg-kanagawa-green size-2.5 rounded-full" />
        {title && <span className="ml-2 text-xs text-muted-foreground">{title}</span>}
      </div>
      <div className={cn('p-4 text-sm leading-relaxed', bodyClassName)}>{children}</div>
    </div>
  )
}

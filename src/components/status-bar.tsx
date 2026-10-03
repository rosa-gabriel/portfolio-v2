import { LanguageSwitcher } from '@/components/language-switcher'
import { MotionToggle } from '@/components/motion-toggle'
import { RoseBadge } from '@/components/rose-badge'
import { ThemeToggle } from '@/components/theme-toggle'

export function StatusBar() {
  return (
    <header className="sticky top-0 z-20 grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-border bg-background px-4 py-1.5 text-xs sm:px-6">
      <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
        <span className="bg-kanagawa-green inline-block size-2 shrink-0 rounded-full" />
        <span className="truncate">gabriel@portfolio:~$</span>
      </div>
      <RoseBadge />
      <div className="flex items-center justify-end gap-1">
        <LanguageSwitcher />
        <MotionToggle />
        <ThemeToggle />
      </div>
    </header>
  )
}

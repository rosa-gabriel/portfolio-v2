import { LanguageSwitcher } from '@/components/language-switcher'
import { ThemeToggle } from '@/components/theme-toggle'

export function StatusBar() {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/85 px-4 py-2 text-xs backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="bg-kanagawa-green inline-block size-2 rounded-full" />
        <span>gabriel@portfolio:~$</span>
      </div>
      <div className="flex items-center gap-1">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </header>
  )
}

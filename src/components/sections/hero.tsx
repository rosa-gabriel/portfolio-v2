import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { DecryptText } from '@/components/decrypt-text'
import { NeofetchPanel } from '@/components/neofetch-panel'
import { TerminalWindow } from '@/components/terminal-window'

export function Hero() {
  const { t } = useTranslation()

  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-20 sm:px-6 sm:py-28">
      <div className="flex items-center gap-2 self-start rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
        <span className="bg-kanagawa-green inline-block size-2 rounded-full" />
        {t('hero.status')}
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          <span className="text-kanagawa-green">$</span> {t('hero.command')}
        </p>
        <h1 className="text-5xl font-semibold tracking-tight sm:text-7xl">
          <DecryptText text="Gabriel Rosa" />
        </h1>
        <p className="max-w-xl text-base text-muted-foreground sm:text-lg">{t('hero.tagline')}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button size="lg" asChild>
          <a href="#projects">{t('hero.ctaProjects')}</a>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <a href="#contact">{t('hero.ctaContact')}</a>
        </Button>
      </div>

      <TerminalWindow title={t('hero.terminalTitle')} className="max-w-xl">
        <NeofetchPanel />
      </TerminalWindow>
    </section>
  )
}

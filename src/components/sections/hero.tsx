import { Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { DecryptText } from '@/components/decrypt-text'
import { NeofetchPanel } from '@/components/neofetch-panel'
import { TerminalWindow } from '@/components/terminal-window'
import { contactLinks, resumeHref } from '@/lib/contact-links'

export function Hero() {
  const { t } = useTranslation()

  return (
    <section className="mx-auto grid w-full max-w-5xl items-center gap-10 px-4 pt-12 pb-10 sm:px-6 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_28rem] lg:gap-8 lg:pt-8 lg:pb-8">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          <span className="text-kanagawa-green">$</span> {t('hero.command')}
        </p>
        <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
          <DecryptText text="Gabriel Rosa" />
        </h1>
        <p className="max-w-xl text-base text-muted-foreground sm:text-lg">{t('hero.tagline')}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="lg" asChild>
            <a href={resumeHref} download>
              <Download data-icon="inline-start" />
              {t('hero.downloadResume')}
            </a>
          </Button>
          {contactLinks.map(({ labelKey, href, Icon }) => (
            <Button key={labelKey} size="lg" variant="outline" asChild>
              <a href={href} target="_blank" rel="noreferrer">
                <Icon data-icon="inline-start" />
                {t(labelKey)}
              </a>
            </Button>
          ))}
        </div>
      </div>

      <TerminalWindow title={t('hero.terminalTitle')} className="w-full max-w-xl lg:max-w-none">
        <NeofetchPanel />
      </TerminalWindow>
    </section>
  )
}

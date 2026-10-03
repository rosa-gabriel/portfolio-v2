import { ArrowDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { reveal } from '@/lib/reveal'

export function PlaygroundIntro() {
  const { t } = useTranslation()

  return (
    <section
      id="playground"
      aria-label={t('playground.title')}
      className="mx-auto max-w-5xl scroll-mt-12 px-4 pt-16 sm:px-6"
    >
      <div className="border-t border-dashed border-border pt-12">
        <p {...reveal('type')} className="text-sm text-kanagawa-blue">
          {t('playground.eyebrow')}
        </p>
        <h2 {...reveal('title', 1)} className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          {t('playground.title')}
        </h2>
        <p {...reveal('up', 2)} className="mt-2 max-w-2xl text-muted-foreground">
          {t('playground.subtitle')}
        </p>
        <a
          {...reveal('up', 3)}
          href="#contact"
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <span className="text-kanagawa-green">$</span> {t('playground.skip')}
          <ArrowDown className="size-3.5" />
        </a>
      </div>
    </section>
  )
}

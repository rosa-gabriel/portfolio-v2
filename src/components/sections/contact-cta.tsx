import { useTranslation } from 'react-i18next'
import { contactLinks } from '@/lib/contact-links'

export function ContactCta() {
  const { t } = useTranslation()

  return (
    <section id="contact" className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
      <p className="text-kanagawa-blue text-sm">{t('contact.eyebrow')}</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        {t('contact.title')}
      </h2>
      <p className="mt-2 max-w-xl text-muted-foreground">{t('contact.subtitle')}</p>

      <div className="mt-8 flex flex-col gap-2 font-mono text-sm">
        {contactLinks.map(({ labelKey, href, Icon }) => (
          <a
            key={labelKey}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
          >
            <span className="text-kanagawa-green">$</span> open --{t(labelKey).toLowerCase()}
            <Icon className="size-4" />
          </a>
        ))}
      </div>
    </section>
  )
}

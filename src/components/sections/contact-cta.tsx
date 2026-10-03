import { Check, Copy, Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { TerminalWindow } from '@/components/terminal-window'
import { useCopy } from '@/hooks/use-copy'
import { contactLinks, email, resumes } from '@/lib/contact-links'
import { reveal } from '@/lib/reveal'
import { cn } from '@/lib/utils'

export function ContactCta() {
  const { t } = useTranslation()
  const { copied, copy } = useCopy()
  const roles = t('availability.roles', { returnObjects: true }) as string[]

  const facts = [
    { label: t('availability.modelLabel'), value: t('availability.model') },
    { label: t('availability.locationLabel'), value: t('availability.location') },
    { label: t('availability.languagesLabel'), value: t('availability.languages') },
  ]

  return (
    <section
      id="contact"
      className="render-on-view mx-auto max-w-5xl scroll-mt-12 px-4 py-20 sm:px-6 [--section-estimate:700px]"
    >
      <p {...reveal('type')} className="text-kanagawa-blue text-sm">
        {t('contact.eyebrow')}
      </p>
      <h2 {...reveal('title', 1)} className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        {t('contact.title')}
      </h2>
      <p {...reveal('up', 2)} className="mt-2 max-w-xl text-muted-foreground">
        {t('contact.subtitle')}
      </p>

      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] items-start gap-8 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div {...reveal('window', 3)}>
          <TerminalWindow title="looking-for.md">
            <div className="flex flex-col gap-4">
              <p className="inline-flex items-center gap-2 text-kanagawa-green">
                <span className="relative flex size-2">
                  <span className="absolute inset-0 animate-ping rounded-full bg-kanagawa-green opacity-60 motion-reduce:animate-none" />
                  <span className="relative size-2 rounded-full bg-kanagawa-green" />
                </span>
                {t('availability.status')}
              </p>
              <p className="font-semibold"># {t('availability.lookingFor')}</p>
              <dl className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <dt className="text-xs text-kanagawa-yellow">{t('availability.rolesLabel')}:</dt>
                  <dd>
                    <ul className="flex flex-col gap-1">
                      {roles.map((role) => (
                        <li key={role} className="flex gap-2">
                          <span className="text-kanagawa-green">›</span>
                          {role}
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
                {facts.map((fact) => (
                  <div key={fact.label} className="flex flex-col gap-1">
                    <dt className="text-xs text-kanagawa-yellow">{fact.label}:</dt>
                    <dd className="text-muted-foreground">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </TerminalWindow>
        </div>

        <div className="flex flex-col gap-3 text-sm">
          <div {...reveal('up', 4)} className="flex items-center gap-2">
            <a
              href={`mailto:${email}`}
              className="flex min-w-0 items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
            >
              <span className="text-kanagawa-green">$</span>
              <span className="truncate">mail {email}</span>
            </a>
            <button
              type="button"
              onClick={() => copy(email)}
              aria-label={t('copy.copyEmail')}
              className={cn(
                'inline-flex shrink-0 items-center gap-1 rounded-sm border border-border px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary',
                copied && 'border-kanagawa-green/60 text-kanagawa-green',
              )}
            >
              {copied ? <Check className="size-3.5 animate-in zoom-in-50" /> : <Copy className="size-3.5" />}
              {copied ? t('copy.copied') : t('copy.copyEmail')}
            </button>
            <span className="sr-only" aria-live="polite">
              {copied ? t('copy.copiedAnnouncement') : ''}
            </span>
          </div>

          {contactLinks
            .filter(({ labelKey }) => labelKey !== 'contact.emailLabel')
            .map(({ labelKey, href, Icon }, index) => (
              <a
                key={labelKey}
                {...reveal('up', 5 + index)}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
              >
                <span className="text-kanagawa-green">$</span> open --{t(labelKey).toLowerCase()}
                <Icon className="size-4" />
              </a>
            ))}

          {resumes.map((resume, index) => (
            <a
              key={resume.language}
              {...reveal('up', 7 + index)}
              href={resume.href}
              download={resume.downloadName}
              hrefLang={resume.language}
              type="application/pdf"
              className="flex min-w-0 items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
            >
              <span className="text-kanagawa-green">$</span>
              <span className="truncate">curl -O {resume.path}</span>
              <span className="shrink-0 text-xs">({resume.label})</span>
              <Download className="size-4 shrink-0" />
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

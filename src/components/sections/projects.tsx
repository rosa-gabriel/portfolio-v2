import { useTranslation } from 'react-i18next'
import { TerminalWindow } from '@/components/terminal-window'

const projectKeys = [
  { titleKey: 'projects.project1Title', descriptionKey: 'projects.project1Description', tags: ['Rust', 'Gateway', 'Performance'] },
  { titleKey: 'projects.project2Title', descriptionKey: 'projects.project2Description', tags: ['Kafka', 'Flink', 'RabbitMQ'] },
  { titleKey: 'projects.project3Title', descriptionKey: 'projects.project3Description', tags: ['Kubernetes', 'Kong', 'OpenTelemetry'] },
] as const

export function Projects() {
  const { t } = useTranslation()

  return (
    <section id="projects" className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <p className="text-kanagawa-blue text-sm">{t('projects.eyebrow')}</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        {t('projects.title')}
      </h2>
      <p className="mt-2 max-w-xl text-muted-foreground">{t('projects.subtitle')}</p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projectKeys.map(({ titleKey, descriptionKey, tags }) => (
          <TerminalWindow key={titleKey} title={t(titleKey)}>
            <p className="text-muted-foreground">{t(descriptionKey)}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </TerminalWindow>
        ))}
      </div>
    </section>
  )
}

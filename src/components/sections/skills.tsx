import { useTranslation } from 'react-i18next'
import { TerminalWindow } from '@/components/terminal-window'
import { reveal } from '@/lib/reveal'
import { skillGroups } from '@/lib/skills'

export function Skills() {
  const { t } = useTranslation()

  return (
    <section
      id="skills"
      aria-label={t('skills.title')}
      className="render-on-view mx-auto max-w-5xl scroll-mt-12 px-4 py-16 sm:px-6 [--section-estimate:700px]"
    >
      <p {...reveal('type')} className="text-sm text-kanagawa-blue">
        {t('skills.eyebrow')}
      </p>
      <h2 {...reveal('title', 1)} className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        {t('skills.title')}
      </h2>
      <p {...reveal('up', 2)} className="mt-2 max-w-2xl text-muted-foreground">
        {t('skills.subtitle')}
      </p>

      <div {...reveal('window', 3)} className="mt-8">
        <TerminalWindow title={t('skills.windowTitle')}>
          <dl className="grid gap-x-8 gap-y-4 md:grid-cols-2">
            {skillGroups.map((group, index) => (
              <div key={group.id} {...reveal('up', 4 + index)} className="flex flex-col gap-2">
                <dt className="text-xs">
                  <span className="text-kanagawa-yellow">{t(`skills.groups.${group.id}`)}</span>
                  <span className="text-muted-foreground">:</span>
                </dt>
                <dd>
                  <ul className="flex flex-wrap gap-1.5">
                    {group.skills.map((skill) => (
                      <li
                        key={skill}
                        className="rounded-sm border border-border bg-background/60 px-2 py-0.5 text-xs transition-colors duration-200 hover:border-primary/60 hover:text-primary"
                      >
                        {skill}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            ))}
          </dl>
        </TerminalWindow>
      </div>
    </section>
  )
}

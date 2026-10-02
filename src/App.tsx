import { useTranslation } from 'react-i18next'
import { StatusBar } from '@/components/status-bar'
import { Footer } from '@/components/footer'
import { Hero } from '@/components/sections/hero'
import { FeatureSection } from '@/components/sections/feature-section'
import { Projects } from '@/components/sections/projects'
import { ContactCta } from '@/components/sections/contact-cta'
import { TerminalWindow } from '@/components/terminal-window'

function App() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-svh flex-col">
      <StatusBar />
      <main className="flex-1">
        <Hero />

        <FeatureSection
          index={t('section.streamingIndex')}
          eyebrow={t('section.streamingEyebrow')}
          title={t('section.streamingTitle')}
          points={[
            t('section.streamingPoint1'),
            t('section.streamingPoint2'),
            t('section.streamingPoint3'),
          ]}
          linkLabel={t('section.streamingLink')}
          visual={
            <TerminalWindow title="pipeline.json">
              <pre className="whitespace-pre-wrap">
                {`{\n  "streaming": "kafka",\n  "processing": "flink",\n  "messaging": "rabbitmq"\n}`}
              </pre>
            </TerminalWindow>
          }
        />

        <FeatureSection
          index={t('section.platformIndex')}
          eyebrow={t('section.platformEyebrow')}
          title={t('section.platformTitle')}
          points={[
            t('section.platformPoint1'),
            t('section.platformPoint2'),
            t('section.platformPoint3'),
          ]}
          linkLabel={t('section.platformLink')}
          reverse
          visual={
            <TerminalWindow title="status.log">
              <pre className="whitespace-pre-wrap text-muted-foreground">
                {`[ok] gateway: kong on kubernetes\n[ok] auth: oidc + keycloak\n[ok] tracing: opentelemetry`}
              </pre>
            </TerminalWindow>
          }
        />

        <Projects />
        <ContactCta />
      </main>
      <Footer />
    </div>
  )
}

export default App

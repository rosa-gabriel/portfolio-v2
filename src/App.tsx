import { Suspense, lazy, useEffect, type ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import { ArchitectureFlow } from '@/components/architecture/architecture-flow'
import { Footer } from '@/components/footer'
import { ContactCta } from '@/components/sections/contact-cta'
import { Hero } from '@/components/sections/hero'
import { ScrollCue } from '@/components/scroll-cue'
import { Highlights } from '@/components/sections/highlights'
import { StatusBar } from '@/components/status-bar'
import { VineMargins } from '@/components/vine-margins'

const lazyFlow = <K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) =>
  lazy(() => load().then((module) => ({ default: module[name] })))

const GatewayFlow = lazyFlow(() => import('@/components/flows/gateway-flow'), 'GatewayFlow')
const AuthFlow = lazyFlow(() => import('@/components/flows/auth-flow'), 'AuthFlow')
const K8sFlow = lazyFlow(() => import('@/components/flows/k8s-flow'), 'K8sFlow')
const ObservabilityFlow = lazyFlow(() => import('@/components/flows/observability-flow'), 'ObservabilityFlow')
const DddFlow = lazyFlow(() => import('@/components/flows/ddd-flow'), 'DddFlow')
const AgentsFlow = lazyFlow(() => import('@/components/flows/agents-flow'), 'AgentsFlow')
const Journey = lazyFlow(() => import('@/components/sections/journey'), 'Journey')
const Certificates = lazyFlow(() => import('@/components/sections/certificates'), 'Certificates')

function App() {
  const { t, i18n } = useTranslation()

  useEffect(() => {
    document.title = t('meta.title')
  }, [t, i18n.language])

  return (
    <div className="flex min-h-svh flex-col">
      <VineMargins />
      <StatusBar />
      <main className="flex-1">
        <div className="flex flex-col lg:min-h-[calc(100svh-3rem)]">
          <div className="flex flex-1 flex-col justify-center">
            <Hero />
            <Highlights />
          </div>
          <ScrollCue targetId="content" />
        </div>
        <div id="content" className="scroll-mt-12">
          <Suspense fallback={<div className="min-h-svh" />}>
            <Journey />
            <Certificates />
          </Suspense>
        </div>
        <ArchitectureFlow />
        <Suspense fallback={<div className="min-h-svh" />}>
          <GatewayFlow />
          <AgentsFlow />
          <K8sFlow />
          <ObservabilityFlow />
          <DddFlow />
          <AuthFlow />
        </Suspense>
        <ContactCta />
      </main>
      <Footer />
    </div>
  )
}

export default App

import { Suspense, lazy, useEffect, type ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import { ArchitectureFlow } from '@/components/architecture/architecture-flow'
import { Footer } from '@/components/footer'
import { ContactCta } from '@/components/sections/contact-cta'
import { Hero } from '@/components/sections/hero'
import { Projects } from '@/components/sections/projects'
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
        <Hero />
        <ArchitectureFlow />
        <Suspense fallback={<div className="min-h-svh" />}>
          <GatewayFlow />
          <AuthFlow />
          <K8sFlow />
          <ObservabilityFlow />
          <DddFlow />
          <AgentsFlow />
        </Suspense>
        <Projects />
        <ContactCta />
      </main>
      <Footer />
    </div>
  )
}

export default App

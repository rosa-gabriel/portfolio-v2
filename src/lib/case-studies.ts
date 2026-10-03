export type DemoKey = 'arch' | 'gateway' | 'auth' | 'k8s' | 'obs' | 'ddd'

export type CaseStudy = {
  id: 'streaming' | 'devsuite' | 'provisioning' | 'gateway' | 'oxid'
  path: string
  org: string
  period: string
  stack: string[]
  demos: { key: DemoKey; anchor: string }[]
  featured?: boolean
}

export const caseStudies: CaseStudy[] = [
  {
    id: 'streaming',
    path: '~/weg/streaming-platform',
    org: 'WEG',
    period: '2025 - now',
    stack: ['Apache Kafka', 'Kafka Connect', 'Apache Flink', 'RabbitMQ', 'Kubernetes', 'Java', 'Quarkus', 'AWS'],
    demos: [{ key: 'arch', anchor: 'demo-streaming' }],
    featured: true,
  },
  {
    id: 'devsuite',
    path: '~/weg/developers-suite',
    org: 'WEG',
    period: '2023 - 2025',
    stack: ['TypeScript', 'Kubernetes', 'API governance'],
    demos: [{ key: 'ddd', anchor: 'demo-ddd' }],
  },
  {
    id: 'provisioning',
    path: '~/weg/self-service-infra',
    org: 'WEG',
    period: '2023 - 2025',
    stack: ['Kubernetes', 'PostgreSQL', 'MongoDB', 'Redis', 'MinIO', 'CI/CD'],
    demos: [{ key: 'k8s', anchor: 'demo-kubernetes' }],
  },
  {
    id: 'gateway',
    path: '~/weg/api-gateway',
    org: 'WEG',
    period: '2023 - 2025',
    stack: ['Kong', 'Kubernetes', 'Keycloak', 'OpenID Connect', 'OpenTelemetry', 'Grafana'],
    demos: [
      { key: 'gateway', anchor: 'demo-gateway' },
      { key: 'auth', anchor: 'demo-identity' },
      { key: 'obs', anchor: 'demo-observability' },
    ],
  },
  {
    id: 'oxid',
    path: '~/thesis/oxid-gateway',
    org: 'Católica SC',
    period: '2025',
    stack: ['Rust', 'Reverse proxy', 'API gateway', 'Performance'],
    demos: [{ key: 'gateway', anchor: 'demo-gateway' }],
  },
]

export type JourneyLane = 'work' | 'education'

export type JourneyEntry = {
  id: 'bsc' | 'researcher' | 'architect' | 'msc'
  lane: JourneyLane
  org: string
  orgUrl: string
  location?: string
  start: string
  end?: string
  skills: string[]
}

export const journeyLanes: JourneyLane[] = ['work', 'education']

export const journeyRange = { start: '2022-01', end: '2029-01' }

export const journeyEntries: JourneyEntry[] = [
  {
    id: 'bsc',
    lane: 'education',
    org: 'Católica de Santa Catarina',
    orgUrl: 'https://www.catolicasc.org.br',
    start: '2022-03',
    end: '2025-12',
    skills: ['Rust', 'API Gateway', 'Software Architecture', 'Distributed Systems', 'Networking', 'Operating Systems'],
  },
  {
    id: 'researcher',
    lane: 'work',
    org: 'WEG',
    orgUrl: 'https://www.linkedin.com/company/11931/',
    location: 'Jaraguá do Sul, SC',
    start: '2023-02',
    end: '2025-08',
    skills: [
      'Kubernetes',
      'TypeScript',
      'Kong',
      'Keycloak',
      'OpenID Connect',
      'OpenTelemetry',
      'Grafana',
      'PostgreSQL',
      'MongoDB',
      'Redis',
      'MinIO',
      'CI/CD',
    ],
  },
  {
    id: 'architect',
    lane: 'work',
    org: 'WEG',
    orgUrl: 'https://www.linkedin.com/company/11931/',
    location: 'Jaraguá do Sul, SC',
    start: '2025-09',
    skills: ['Apache Kafka', 'RabbitMQ', 'Apache Flink', 'Kubernetes', 'Kafka Connect', 'Event-Driven Architecture', 'Hybrid Cloud'],
  },
  {
    id: 'msc',
    lane: 'education',
    org: 'Universidade do Estado de Santa Catarina',
    orgUrl: 'https://www.udesc.br',
    start: '2026-03',
    end: '2028-12',
    skills: ['High Performance Computing', 'Optimization Algorithms', 'Parallel Programming', 'Distributed Systems'],
  },
]

export function toMonthIndex(value: string | Date) {
  if (value instanceof Date) return value.getFullYear() * 12 + value.getMonth()
  const [year, month] = value.split('-').map(Number)
  return year * 12 + month - 1
}

export function monthIndexToDate(index: number) {
  return new Date(Math.floor(index / 12), index % 12, 1)
}

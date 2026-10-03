export const skillGroups = [
  { id: 'streaming', skills: ['Apache Kafka', 'Kafka Connect', 'Apache Flink', 'RabbitMQ', 'Kubernetes'] },
  { id: 'platform', skills: ['Kubernetes', 'Kong', 'Keycloak', 'OpenID Connect', 'CI/CD', 'Hybrid cloud', 'AWS', 'SAP Business Suite'] },
  { id: 'data', skills: ['PostgreSQL', 'MongoDB', 'Redis', 'MinIO', 'Databricks', 'Qlik Replicate', 'Oracle'] },
  { id: 'observability', skills: ['OpenTelemetry', 'Grafana'] },
  { id: 'languages', skills: ['Go', 'Rust', 'Java', 'TypeScript', 'JavaScript', 'Quarkus', 'NestJS'] },
  {
    id: 'architecture',
    skills: ['Event-driven', 'Domain-driven design', 'API governance', 'Distributed systems', 'Parallel computing'],
  },
] as const

export type SkillGroupId = (typeof skillGroups)[number]['id']

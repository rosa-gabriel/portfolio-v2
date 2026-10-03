export type Certificate = {
  id: string
  title: string
  issuer: string
  issued: string
  credentialUrl?: string
  tags: string[]
}

export const certificates: Certificate[] = [
  {
    id: 'cert-1',
    title: 'Certificate title',
    issuer: 'Issuer',
    issued: '2025-01',
    tags: ['Tag'],
  },
  {
    id: 'cert-2',
    title: 'Certificate title',
    issuer: 'Issuer',
    issued: '2024-06',
    tags: ['Tag'],
  },
  {
    id: 'cert-3',
    title: 'Certificate title',
    issuer: 'Issuer',
    issued: '2024-01',
    tags: ['Tag'],
  },
]

export type Certificate = {
  id: string
  title: string
  issuer: string
  issued: string
  credentialUrl?: string
  tags: string[]
  draft?: boolean
}

export const certificates: Certificate[] = [
  {
    id: 'english-c1',
    title: 'English Proficiency, C1 (score 73)',
    issuer: 'University of Michigan',
    issued: '2020-11',
    tags: ['English', 'C1'],
  },
  {
    id: 'cert-1',
    draft: true,
    title: 'Certificate title',
    issuer: 'Issuer',
    issued: '2025-01',
    tags: ['Tag'],
  },
  {
    id: 'cert-2',
    draft: true,
    title: 'Certificate title',
    issuer: 'Issuer',
    issued: '2024-06',
    tags: ['Tag'],
  },
  {
    id: 'cert-3',
    draft: true,
    title: 'Certificate title',
    issuer: 'Issuer',
    issued: '2024-01',
    tags: ['Tag'],
  },
]

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
    id: 'bsc-software-engineering',
    title: "Bachelor's Degree in Software Engineering",
    issuer: 'Católica de Santa Catarina',
    issued: '2025-12',
    tags: ['Software Engineering', 'Bachelor'],
  },
  {
    id: 'english-c1',
    title: 'English Proficiency, C1 (score 73)',
    issuer: 'University of Michigan',
    issued: '2020-11',
    tags: ['English', 'C1'],
  },
]

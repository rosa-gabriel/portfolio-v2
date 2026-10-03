import { Briefcase, Code2, Mail } from 'lucide-react'
import { email, githubUrl, linkedinUrl, resumeFiles } from '@/lib/profile'

export { email }

export const contactLinks = [
  { labelKey: 'contact.emailLabel', href: `mailto:${email}`, Icon: Mail },
  { labelKey: 'contact.githubLabel', href: githubUrl, Icon: Code2 },
  { labelKey: 'contact.linkedinLabel', href: linkedinUrl, Icon: Briefcase },
] as const

export const resumes = (Object.keys(resumeFiles) as (keyof typeof resumeFiles)[]).map((language) => ({
  language,
  ...resumeFiles[language],
  href: `${import.meta.env.BASE_URL}${resumeFiles[language].path}`,
}))

export const resumeFor = (language?: string) => resumes.find((resume) => language?.startsWith(resume.language)) ?? resumes[0]

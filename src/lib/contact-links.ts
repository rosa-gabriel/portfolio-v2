import { Briefcase, Code2, Mail } from 'lucide-react'
import { email, githubUrl, linkedinUrl } from '@/lib/profile'

export { email }

export const contactLinks = [
  { labelKey: 'contact.emailLabel', href: `mailto:${email}`, Icon: Mail },
  { labelKey: 'contact.githubLabel', href: githubUrl, Icon: Code2 },
  { labelKey: 'contact.linkedinLabel', href: linkedinUrl, Icon: Briefcase },
] as const

export const resumeHref = `${import.meta.env.BASE_URL}resume.pdf`

import { Briefcase, Code2, Mail } from 'lucide-react'

export const email = 'gabriel.edu.rosa@proton.me'

export const contactLinks = [
  { labelKey: 'contact.emailLabel', href: `mailto:${email}`, Icon: Mail },
  { labelKey: 'contact.githubLabel', href: 'https://github.com/rosa-gabriel', Icon: Code2 },
  {
    labelKey: 'contact.linkedinLabel',
    href: 'https://www.linkedin.com/in/gabriel-edu-rosa/',
    Icon: Briefcase,
  },
] as const

export const resumeHref = `${import.meta.env.BASE_URL}resume.pdf`

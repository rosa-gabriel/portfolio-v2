import { Check, Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useCopy } from '@/hooks/use-copy'
import { email } from '@/lib/contact-links'
import { cn } from '@/lib/utils'

export function CopyEmailButton({ className }: { className?: string }) {
  const { t } = useTranslation()
  const { copied, copy } = useCopy()

  const onClick = async () => {
    if (!(await copy(email))) window.location.href = `mailto:${email}`
  }

  const Icon = copied ? Check : Mail

  return (
    <Button
      type="button"
      size="lg"
      variant="outline"
      title={email}
      aria-label={`${t('copy.copyEmail')}: ${email}`}
      onClick={onClick}
      className={cn(copied && 'border-kanagawa-green/60 text-kanagawa-green', className)}
    >
      <Icon data-icon="inline-start" className={cn(copied && 'animate-in zoom-in-50 duration-300')} />
      <span className="max-sm:sr-only">{copied ? t('copy.copied') : t('contact.emailLabel')}</span>
      <span className="sr-only" aria-live="polite">
        {copied ? t('copy.copiedAnnouncement') : ''}
      </span>
    </Button>
  )
}

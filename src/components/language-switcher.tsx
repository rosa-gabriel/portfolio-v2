import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { supportedLanguages } from '@/i18n'

const languageLabels: Record<(typeof supportedLanguages)[number], string> = {
  en: 'EN',
  pt: 'PT',
}

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation()
  const currentLanguage = i18n.resolvedLanguage ?? i18n.language

  return (
    <div role="group" aria-label={t('a11y.language')} className="inline-flex gap-1">
      {supportedLanguages.map((lng) => (
        <Button
          key={lng}
          type="button"
          size="sm"
          variant={currentLanguage?.startsWith(lng) ? 'default' : 'ghost'}
          aria-pressed={currentLanguage?.startsWith(lng)}
          onClick={() => i18n.changeLanguage(lng)}
        >
          {languageLabels[lng]}
        </Button>
      ))}
    </div>
  )
}

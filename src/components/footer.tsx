import { useTranslation } from 'react-i18next'

export function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="border-t border-border px-4 py-6 text-center text-xs text-muted-foreground sm:px-6">
      {t('footer.text')}
    </footer>
  )
}

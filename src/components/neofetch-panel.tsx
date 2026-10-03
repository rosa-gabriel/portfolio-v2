import { useTranslation } from 'react-i18next'
import { AvatarPanel } from '@/components/avatar-panel'

const HOST = 'gabriel@portfolio'

const swatchClasses = [
  'bg-kanagawa-red',
  'bg-kanagawa-yellow',
  'bg-kanagawa-green',
  'bg-kanagawa-blue',
  'bg-kanagawa-violet',
  'bg-kanagawa-pink',
]

export function NeofetchPanel() {
  const { t } = useTranslation()

  const fields = [
    { label: 'OS', value: t('hero.fieldOs') },
    { label: 'Shell', value: t('hero.fieldShell') },
    { label: 'Host', value: t('hero.fieldHost') },
    { label: 'Theme', value: 'Kanagawa' },
  ]

  return (
    <div className="flex gap-3 text-[13px] sm:gap-4 sm:text-sm">
      <AvatarPanel />
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-kanagawa-blue font-semibold">{HOST}</p>
        <p className="text-muted-foreground">{'-'.repeat(HOST.length)}</p>
        {fields.map(({ label, value }) => (
          <p key={label}>
            <span className="text-kanagawa-yellow">{label}</span>
            <span className="text-muted-foreground">: </span>
            <span>{value}</span>
          </p>
        ))}
        <div className="mt-2 flex gap-1">
          {swatchClasses.map((swatchClass) => (
            <span key={swatchClass} className={`size-3 rounded-sm ${swatchClass}`} />
          ))}
        </div>
      </div>
    </div>
  )
}

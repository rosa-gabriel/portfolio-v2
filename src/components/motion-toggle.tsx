import { Pause, Play } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { setMotionPaused, useMotionPaused } from '@/lib/motion'

export function MotionToggle() {
  const { t } = useTranslation()
  const paused = useMotionPaused()

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-pressed={paused}
      aria-label={t(paused ? 'a11y.resumeMotion' : 'a11y.pauseMotion')}
      title={t(paused ? 'a11y.resumeMotion' : 'a11y.pauseMotion')}
      onClick={() => setMotionPaused(!paused)}
    >
      {paused ? <Play /> : <Pause />}
    </Button>
  )
}

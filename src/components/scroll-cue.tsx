import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

export function ScrollCue({ targetId }: { targetId: string }) {
  const { t } = useTranslation()
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const onScroll = () => setHidden(window.scrollY > 80)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToTarget = () => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById(targetId)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' })
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-10 hidden justify-center lg:flex">
      <button
        type="button"
        aria-label={t('hero.scrollDown')}
        onClick={scrollToTarget}
        tabIndex={hidden ? -1 : 0}
        className={cn(
          'scroll-cue group pointer-events-auto grid size-11 place-items-center rounded-full border border-border bg-card/70 text-muted-foreground backdrop-blur-sm transition-[opacity,color,border-color] duration-500 outline-none hover:border-primary/60 hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50',
          hidden && 'pointer-events-none opacity-0 [animation-play-state:paused]',
        )}
      >
        <ChevronDown className="size-5 transition-transform duration-300 group-hover:translate-y-0.5" />
      </button>
    </div>
  )
}

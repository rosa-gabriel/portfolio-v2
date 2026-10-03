import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type CarouselArrowsProps = {
  previousLabel: string
  nextLabel: string
  onMove: (direction: 1 | -1) => void
}

export function CarouselArrows({ previousLabel, nextLabel, onMove }: CarouselArrowsProps) {
  return (
    <div className="flex items-center gap-1">
      <Button type="button" variant="ghost" size="icon-sm" aria-label={previousLabel} onClick={() => onMove(-1)}>
        <ChevronLeft />
      </Button>
      <Button type="button" variant="ghost" size="icon-sm" aria-label={nextLabel} onClick={() => onMove(1)}>
        <ChevronRight />
      </Button>
    </div>
  )
}

type CarouselDotsProps = {
  positions: number
  active: number
  onSelect: (index: number) => void
  label: (index: number) => string
}

export function CarouselDots({ positions, active, onSelect, label }: CarouselDotsProps) {
  if (positions <= 1) return null
  return (
    <div className="mt-2 flex justify-center">
      {Array.from({ length: positions }, (_, index) => (
        <button
          key={index}
          type="button"
          aria-label={label(index)}
          aria-current={index === active}
          onClick={() => onSelect(index)}
          className="group grid h-6 min-w-6 place-items-center rounded-full px-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              index === active ? 'w-6 bg-primary' : 'w-1.5 bg-border group-hover:bg-muted-foreground',
            )}
          />
        </button>
      ))}
    </div>
  )
}

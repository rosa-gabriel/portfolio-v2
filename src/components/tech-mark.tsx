import { techLogos, type TechId } from '@/lib/tech-logos'

type TechMarkProps = {
  id: TechId
  x: number
  y: number
  size: number
  className?: string
}

export function TechMark({ id, x, y, size, className }: TechMarkProps) {
  const logo = techLogos[id]
  return (
    <svg x={x} y={y} width={size} height={size} viewBox={logo.viewBox} className={className}>
      <title>{logo.title}</title>
      <path d={logo.path} />
    </svg>
  )
}

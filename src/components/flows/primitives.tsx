import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { TechMark } from '@/components/tech-mark'
import type { TechId } from '@/lib/tech-logos'
import { cn } from '@/lib/utils'
import { easeInOut, easeOut, type Box, type Engine, type Point, type Tone } from './engine'

export const toneFill: Record<Tone, string> = {
  yellow: 'fill-kanagawa-yellow',
  green: 'fill-kanagawa-green',
  red: 'fill-kanagawa-red',
  blue: 'fill-kanagawa-blue',
  violet: 'fill-kanagawa-violet',
}

export const toneStroke: Record<Tone, string> = {
  yellow: 'stroke-kanagawa-yellow',
  green: 'stroke-kanagawa-green',
  red: 'stroke-kanagawa-red',
  blue: 'stroke-kanagawa-blue',
  violet: 'stroke-kanagawa-violet',
}

export const toneText: Record<Tone, string> = {
  yellow: 'text-kanagawa-yellow',
  green: 'text-kanagawa-green',
  red: 'text-kanagawa-red',
  blue: 'text-kanagawa-blue',
  violet: 'text-kanagawa-violet',
}

export const rectOf =(box: Box) => ({ x: box.x, y: box.y, width: box.w, height: box.h })
export const centerOf = (box: Box): Point => ({ x: box.x + box.w / 2, y: box.y + box.h / 2 })

type NodeProps = {
  box: Box
  accent?: Tone
  dashed?: boolean
  dim?: boolean
  className?: string
  children?: ReactNode
}

export function Node({ box, accent, dashed, dim, className, children }: NodeProps) {
  return (
    <g className={cn('transition-opacity duration-300', dim && 'opacity-20', className)}>
      <rect
        {...rectOf(box)}
        rx={8}
        className={cn('fill-background', accent ? toneStroke[accent] : 'stroke-border')}
        strokeWidth={accent ? 2 : 1}
        strokeDasharray={dashed ? '6 4' : undefined}
      />
      {children}
    </g>
  )
}

type LabelProps = {
  at: Point
  children: ReactNode
  size?: number
  tone?: Tone | 'muted' | 'foreground'
  anchor?: 'start' | 'middle' | 'end'
  weight?: number
}

export function Label({ at, children, size = 13, tone = 'foreground', anchor = 'middle', weight }: LabelProps) {
  const className =
    tone === 'muted' ? 'fill-muted-foreground' : tone === 'foreground' ? 'fill-foreground' : toneFill[tone]
  return (
    <text x={at.x} y={at.y} fontSize={size} textAnchor={anchor} fontWeight={weight} className={className}>
      {children}
    </text>
  )
}

type HaloLabelProps = { at: Point; children: ReactNode; tone?: Tone; size?: number }

export function HaloLabel({ at, children, tone = 'red', size = 14 }: HaloLabelProps) {
  return (
    <text
      x={at.x}
      y={at.y}
      fontSize={size}
      textAnchor="middle"
      strokeWidth={8}
      paintOrder="stroke"
      strokeLinejoin="round"
      className={cn(toneFill[tone], 'stroke-card')}
    >
      {children}
    </text>
  )
}

type LogoProps = { id: TechId; at: Point; size: number; dim?: boolean }

export function Logo({ id, at, size, dim }: LogoProps) {
  return (
    <TechMark
      id={id}
      x={at.x - size / 2}
      y={at.y - size / 2}
      size={size}
      className={cn('fill-foreground transition-opacity', dim && 'opacity-25')}
    />
  )
}

type IconProps = { icon: LucideIcon; at: Point; size: number; tone?: Tone }

export function Icon({ icon: Glyph, at, size, tone }: IconProps) {
  return (
    <Glyph
      x={at.x - size / 2}
      y={at.y - size / 2}
      size={size}
      strokeWidth={1.75}
      className={tone ? toneText[tone] : 'text-foreground'}
    />
  )
}

type RingProps = { at: Point; radius?: number; progress: number | null; tone?: Tone; width?: number }

export function Ring({ at, radius = 15, progress, tone = 'green', width = 3 }: RingProps) {
  return (
    <g>
      <circle cx={at.x} cy={at.y} r={radius} className="fill-card stroke-border" strokeWidth={width} />
      {progress !== null && (
        <circle
          cx={at.x}
          cy={at.y}
          r={radius}
          pathLength={1}
          strokeDasharray={`${Math.min(Math.max(progress, 0), 1)} 1`}
          transform={`rotate(-90 ${at.x} ${at.y})`}
          className={cn('fill-none', toneStroke[tone])}
          strokeWidth={width}
        />
      )}
    </g>
  )
}

export function Connectors({ paths }: { paths: string[] }) {
  return paths.map((d) => (
    <path key={d} d={d} className="fill-none stroke-border" strokeWidth={2} strokeDasharray="4 6" />
  ))
}

type TokensProps<A> = { engine: Engine<A>; resolve: (anchor: A) => Point }

export function Tokens<A>({ engine, resolve }: TokensProps<A>) {
  return engine.tokens.map((token) => {
    const progress = easeInOut(Math.min((engine.time - token.start) / token.duration, 1))
    const from = resolve(token.from)
    const to = resolve(token.to)
    const x = from.x + (to.x - from.x) * progress
    const y = from.y + (to.y - from.y) * progress
    return (
      <g key={token.id}>
        <circle cx={x} cy={y} r={6} className={toneFill[token.tone]} />
        {token.label && (
          <text
            x={x}
            y={y - 11}
            fontSize={10}
            textAnchor="middle"
            strokeWidth={4}
            paintOrder="stroke"
            className={cn(toneFill[token.tone], 'stroke-card')}
          >
            {token.label}
          </text>
        )}
      </g>
    )
  })
}

export function Floaters<A>({ engine, resolve }: TokensProps<A>) {
  return engine.floaters.map((floater) => {
    const progress = (engine.time - floater.start) / floater.duration
    if (progress <= 0) return null
    const origin = resolve(floater.anchor)
    return (
      <text
        key={floater.id}
        x={origin.x + floater.offsetX + floater.drift * Math.sin(progress * Math.PI)}
        y={origin.y - floater.rise * easeOut(progress)}
        fontSize={floater.size}
        fontWeight={700}
        textAnchor="middle"
        opacity={progress < 0.15 ? progress / 0.15 : 1 - (progress - 0.15) / 0.85}
        className={toneFill[floater.tone]}
      >
        {floater.text}
      </text>
    )
  })
}

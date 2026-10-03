export type Point = { x: number; y: number }
export type Box = { x: number; y: number; w: number; h: number }
export type Tone = 'yellow' | 'green' | 'red' | 'blue' | 'violet'

export type Token<A> = {
  id: number
  from: A
  to: A
  start: number
  duration: number
  tone: Tone
  label?: string
  arrive?: () => void
}

export type Floater<A> = {
  id: number
  anchor: A
  text: string
  tone: Tone
  start: number
  duration: number
  offsetX: number
  drift: number
  rise: number
  size: number
}

type Timer = { at: number; run: () => void }

export type Engine<A> = {
  time: number
  nextId: number
  tokens: Token<A>[]
  floaters: Floater<A>[]
  timers: Timer[]
}

export const random = (min: number, max: number) => min + Math.random() * (max - min)
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
export const easeOut = (t: number) => 1 - (1 - t) ** 3

export function createEngine<A>(): Engine<A> {
  return { time: 0, nextId: 0, tokens: [], floaters: [], timers: [] }
}

export function schedule<A>(engine: Engine<A>, delay: number, run: () => void) {
  engine.timers.push({ at: engine.time + delay, run })
}

export function addToken<A>(engine: Engine<A>, token: Omit<Token<A>, 'id' | 'start'>) {
  engine.tokens.push({ ...token, id: engine.nextId++, start: engine.time })
}

type FloatOptions<A> = Pick<Floater<A>, 'anchor' | 'text' | 'tone'> &
  Partial<Pick<Floater<A>, 'duration' | 'offsetX' | 'drift' | 'rise' | 'size'>> & { delay?: number }

export function float<A>(engine: Engine<A>, { delay = 0, ...options }: FloatOptions<A>) {
  engine.floaters.push({
    id: engine.nextId++,
    start: engine.time + delay,
    duration: 1300,
    offsetX: 0,
    drift: random(-8, 8),
    rise: 34,
    size: 13,
    ...options,
  })
}

export function since<A>(engine: Engine<A>, moment: number) {
  return engine.time - moment
}

export function advance<A>(engine: Engine<A>, dt: number) {
  engine.time += dt

  const due = engine.timers.filter((timer) => timer.at <= engine.time)
  engine.timers = engine.timers.filter((timer) => timer.at > engine.time)
  due.forEach((timer) => timer.run())

  const arrived = engine.tokens.filter((token) => engine.time - token.start >= token.duration)
  engine.tokens = engine.tokens.filter((token) => engine.time - token.start < token.duration)
  arrived.forEach((token) => token.arrive?.())

  engine.floaters = engine.floaters.filter((floater) => engine.time - floater.start < floater.duration)
}

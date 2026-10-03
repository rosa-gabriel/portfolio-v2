export const PARTITIONS = 2
export const PRODUCERS = 3
export const VISIBLE_SLOTS = 12
export const SOURCE_VISIBLE = VISIBLE_SLOTS * 2
export const CRON_INTERVAL = 8000
const RETAINED_RECORDS = 120
const SPIKE_SIZE = 20
const SPIKE_INTERVAL = 70
const STREAM_EVENT_COST = 1
const FULL_LOAD_ROW_COST = 1
const LATENCY_SAMPLES = 12
const LOAD_STAGGER = 35

export const TIMING = {
  toBroker: 550,
  fetch: 140,
  process: 220,
  toLake: 420,
  toSource: 700,
  extract: 350,
  load: 550,
  dollar: 1500,
  autoEmitMin: 1500,
  autoEmitJitter: 900,
}

export type Mode = 'kafka' | 'batch'
export type Tone = 'raw' | 'processed'
export type Layer = 'raw' | 'silver'

export type Anchor =
  | { kind: 'producer'; index: number }
  | { kind: 'slot'; partition: number; offset: number }
  | { kind: 'subtask'; index: number }
  | { kind: 'source'; index: number }
  | { kind: 'cron' }
  | { kind: 'layer'; layer: Layer }

export type Token = {
  id: number
  from: Anchor
  to: Anchor
  start: number
  duration: number
  tone: Tone
  arrive?: () => void
}

export type Dollar = {
  id: number
  start: number
  offsetX: number
  drift: number
  rise: number
  size: number
}

export type Subtask = {
  busy: boolean
  processing: { start: number; end: number } | null
}

export type LogRecord = { offset: number; bornAt: number }

type Timer = { at: number; run: () => void }

export type Simulation = {
  time: number
  mode: Mode
  flinkUp: boolean
  subtasks: Subtask[]
  logs: LogRecord[][]
  logEnd: number[]
  arrivedEnd: number[]
  committed: number[]
  sourceEnd: number
  sourceArrived: number
  pending: number[]
  loadedEnd: number
  nextRunAt: number
  loadingUntil: number
  loadingCount: number
  tokens: Token[]
  dollars: Dollar[]
  timers: Timer[]
  sent: number
  raw: number
  silver: number
  cost: number
  latencies: number[]
  lakeFlashAt: number
  replaying: boolean
  nextAutoEmitAt: number
  nextId: number
}

const perPartition = <T>(make: () => T) => Array.from({ length: PARTITIONS }, make)
const random = (min: number, max: number) => min + Math.random() * (max - min)

export function createSimulation(mode: Mode): Simulation {
  return {
    time: 0,
    mode,
    flinkUp: true,
    subtasks: perPartition(() => ({ busy: false, processing: null })),
    logs: perPartition(() => []),
    logEnd: perPartition(() => 0),
    arrivedEnd: perPartition(() => 0),
    committed: perPartition(() => 0),
    sourceEnd: 0,
    sourceArrived: 0,
    pending: [],
    loadedEnd: 0,
    nextRunAt: CRON_INTERVAL,
    loadingUntil: -Infinity,
    loadingCount: 0,
    tokens: [],
    dollars: [],
    timers: [],
    sent: 0,
    raw: 0,
    silver: 0,
    cost: 0,
    latencies: [],
    lakeFlashAt: -Infinity,
    replaying: false,
    nextAutoEmitAt: 400,
    nextId: 0,
  }
}

function addToken(sim: Simulation, token: Omit<Token, 'id' | 'start'>) {
  sim.tokens.push({ ...token, id: sim.nextId++, start: sim.time })
}

function schedule(sim: Simulation, delay: number, run: () => void) {
  sim.timers.push({ at: sim.time + delay, run })
}

function recordLatency(sim: Simulation, latency: number) {
  sim.latencies.push(latency)
  if (sim.latencies.length > LATENCY_SAMPLES) sim.latencies.shift()
}

export function lag(sim: Simulation) {
  return sim.arrivedEnd.reduce((total, end, partition) => total + end - sim.committed[partition], 0)
}

export function averageLatency(sim: Simulation) {
  if (!sim.latencies.length) return null
  return sim.latencies.reduce((total, value) => total + value, 0) / sim.latencies.length
}

export function isLoading(sim: Simulation) {
  return sim.time < sim.loadingUntil
}

export function sourceWindowStart(sim: Simulation) {
  return Math.max(0, Math.ceil((sim.sourceEnd - SOURCE_VISIBLE) / 2) * 2)
}

function spawnDollars(sim: Simulation, count: number, spread: number) {
  for (let i = 0; i < count; i++) {
    sim.dollars.push({
      id: sim.nextId++,
      start: sim.time + (i / count) * spread,
      offsetX: random(-58, 58),
      drift: random(-14, 14),
      rise: random(28, 72),
      size: random(14, 21),
    })
  }
}

function beginProcessing(sim: Simulation, index: number, bornAt: number) {
  const subtask = sim.subtasks[index]
  subtask.busy = true
  subtask.processing = { start: sim.time, end: sim.time + TIMING.process }
  schedule(sim, TIMING.process, () => {
    subtask.processing = null
    subtask.busy = false
    addToken(sim, {
      from: { kind: 'subtask', index },
      to: { kind: 'layer', layer: 'silver' },
      duration: TIMING.toLake,
      tone: 'processed',
      arrive: () => {
        sim.silver++
        sim.cost += STREAM_EVENT_COST
        sim.lakeFlashAt = sim.time
        if (!sim.replaying) recordLatency(sim, sim.time - bornAt)
      },
    })
  })
}

export function emit(sim: Simulation, producer = Math.floor(Math.random() * PRODUCERS)) {
  sim.sent++
  const bornAt = sim.time

  if (sim.mode === 'batch') {
    const index = sim.sourceEnd++
    addToken(sim, {
      from: { kind: 'producer', index: producer },
      to: { kind: 'source', index },
      duration: TIMING.toSource,
      tone: 'raw',
      arrive: () => {
        sim.sourceArrived = Math.max(sim.sourceArrived, index + 1)
        sim.pending.push(bornAt)
      },
    })
    return
  }

  const partition = producer % PARTITIONS
  const offset = sim.logEnd[partition]++
  addToken(sim, {
    from: { kind: 'producer', index: producer },
    to: { kind: 'slot', partition, offset },
    duration: TIMING.toBroker,
    tone: 'raw',
    arrive: () => {
      const log = sim.logs[partition]
      log.push({ offset, bornAt })
      if (log.length > RETAINED_RECORDS) log.shift()
      sim.arrivedEnd[partition] = Math.max(sim.arrivedEnd[partition], offset + 1)
    },
  })
}

export function spike(sim: Simulation) {
  for (let i = 0; i < SPIKE_SIZE; i++) schedule(sim, i * SPIKE_INTERVAL, () => emit(sim))
}

export function setFlinkUp(sim: Simulation, up: boolean) {
  sim.flinkUp = up
}

export function replay(sim: Simulation) {
  if (sim.mode !== 'kafka') return
  sim.logs.forEach((log, partition) => {
    if (log.length) sim.committed[partition] = log[0].offset
  })
  sim.replaying = true
}

function fetchNext(sim: Simulation) {
  sim.subtasks.forEach((subtask, index) => {
    if (subtask.busy || sim.committed[index] >= sim.arrivedEnd[index]) return

    const offset = sim.committed[index]++
    const record = sim.logs[index].find((entry) => entry.offset === offset)
    const bornAt = record?.bornAt ?? sim.time
    subtask.busy = true
    addToken(sim, {
      from: { kind: 'slot', partition: index, offset },
      to: { kind: 'subtask', index },
      duration: TIMING.fetch,
      tone: 'raw',
      arrive: () => beginProcessing(sim, index, bornAt),
    })
  })
}

function runFullLoad(sim: Simulation) {
  sim.nextRunAt = sim.time + CRON_INTERVAL
  const total = sim.sourceArrived
  if (!total) return

  const waitingSince = sim.pending.splice(0)
  const firstVisible = Math.max(sourceWindowStart(sim), 0)
  const visible = Array.from({ length: Math.max(total - firstVisible, 0) }, (_, i) => firstVisible + i)
  const duration = visible.length * LOAD_STAGGER + TIMING.extract + TIMING.load

  visible.forEach((index, order) => {
    schedule(sim, order * LOAD_STAGGER, () => {
      addToken(sim, {
        from: { kind: 'source', index },
        to: { kind: 'cron' },
        duration: TIMING.extract,
        tone: 'raw',
        arrive: () =>
          addToken(sim, {
            from: { kind: 'cron' },
            to: { kind: 'layer', layer: 'raw' },
            duration: TIMING.load,
            tone: 'raw',
          }),
      })
    })
  })

  sim.loadingUntil = sim.time + duration
  sim.loadingCount = total
  sim.cost += total * FULL_LOAD_ROW_COST
  spawnDollars(sim, Math.min(2 + Math.ceil(total / 3), 16), duration)

  schedule(sim, duration, () => {
    sim.raw = total
    sim.loadedEnd = total
    sim.lakeFlashAt = sim.time
    waitingSince.forEach((bornAt) => recordLatency(sim, sim.time - bornAt))
  })
}

export function step(sim: Simulation, dt: number, autoplay: boolean) {
  sim.time += dt

  if (autoplay && sim.time >= sim.nextAutoEmitAt) {
    emit(sim)
    sim.nextAutoEmitAt = sim.time + TIMING.autoEmitMin + Math.random() * TIMING.autoEmitJitter
  }

  if (sim.mode === 'batch' && sim.time >= sim.nextRunAt) runFullLoad(sim)

  const due = sim.timers.filter((timer) => timer.at <= sim.time)
  sim.timers = sim.timers.filter((timer) => timer.at > sim.time)
  due.forEach((timer) => timer.run())

  const arrived = sim.tokens.filter((token) => sim.time - token.start >= token.duration)
  sim.tokens = sim.tokens.filter((token) => sim.time - token.start < token.duration)
  arrived.forEach((token) => token.arrive?.())

  sim.dollars = sim.dollars.filter((dollar) => sim.time - dollar.start < TIMING.dollar)

  if (sim.mode === 'kafka' && sim.flinkUp) fetchNext(sim)

  const idle = sim.subtasks.every((subtask) => !subtask.busy)
  if (sim.replaying && idle && lag(sim) === 0) sim.replaying = false
}

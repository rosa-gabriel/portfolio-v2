import { useState } from 'react'
import { KeyRound, RotateCcw, Send, Skull } from 'lucide-react'
import { useCachedTranslation } from '@/i18n/use-cached-translation'
import { cn } from '@/lib/utils'
import {
  addToken,
  advance,
  createEngine,
  float,
  random,
  schedule,
  since,
  type Box,
  type Engine,
  type Point,
} from './engine'
import { FlowAction, FlowSection } from './flow-section'
import { Connectors, Floaters, HaloLabel, Label, Logo, Node, Tokens, centerOf, toneFill } from './primitives'
import { useFlowLoop } from './use-flow-loop'

type Mode = 'direct' | 'kong'
type Anchor =
  | { kind: 'client'; index: number }
  | { kind: 'shield' }
  | { kind: 'bounce'; index: number }
  | { kind: 'service'; index: number }
  | { kind: 'serviceTop'; index: number }

type Service = { busy: boolean; queue: number; overloadedAt: number }

type Sim = Engine<Anchor> & {
  mode: Mode
  services: Service[]
  buckets: number[]
  served: number
  blocked: number
  errors: number
  exposed: number
  lastBlockAt: number
  lastErrorAt: number
  lastExposedAt: number
  nextAutoAt: number
}

const CLIENTS = ['web', 'mobile', 'partner', 'bot']
const SERVICES = ['orders', 'users', 'payments']
const BOT = 3
const QUEUE_LIMIT = 2
const BUCKET_SIZE = 4
const REFILL_PER_SECOND = 2
const FLOOD_SIZE = 30
const FLOOD_INTERVAL = 55
const RECENT = 2500

const TIMING = {
  toGate: 500,
  toService: 500,
  direct: 900,
  bounce: 450,
  service: 560,
  autoMin: 1300,
  autoJitter: 900,
}

function createSim(mode: Mode): Sim {
  return {
    ...createEngine<Anchor>(),
    mode,
    services: SERVICES.map(() => ({ busy: false, queue: 0, overloadedAt: -Infinity })),
    buckets: CLIENTS.map(() => BUCKET_SIZE),
    served: 0,
    blocked: 0,
    errors: 0,
    exposed: 0,
    lastBlockAt: -Infinity,
    lastErrorAt: -Infinity,
    lastExposedAt: -Infinity,
    nextAutoAt: 500,
  }
}

function process(sim: Sim, index: number) {
  const service = sim.services[index]
  service.busy = true
  schedule(sim, TIMING.service, () => {
    sim.served++
    float(sim, { anchor: { kind: 'serviceTop', index }, text: '200', tone: 'green', size: 11, rise: 22, offsetX: random(-50, 50) })
    if (service.queue > 0) {
      service.queue--
      process(sim, index)
    } else {
      service.busy = false
    }
  })
}

function reachService(sim: Sim, index: number) {
  const service = sim.services[index]
  if (!service.busy) return process(sim, index)
  if (service.queue < QUEUE_LIMIT) {
    service.queue++
    return
  }
  sim.errors++
  sim.lastErrorAt = sim.time
  service.overloadedAt = sim.time
  float(sim, { anchor: { kind: 'serviceTop', index }, text: '503', tone: 'red', offsetX: random(-50, 50) })
}

function reject(sim: Sim, client: number, status: '401' | '429') {
  sim.blocked++
  sim.lastBlockAt = sim.time
  float(sim, { anchor: { kind: 'shield' }, text: status, tone: 'red', offsetX: random(-26, 6), rise: random(30, 80) })
  addToken(sim, { from: { kind: 'shield' }, to: { kind: 'bounce', index: client }, duration: TIMING.bounce, tone: 'red' })
}

function request(sim: Sim, client: number, authorized = true) {
  const service = Math.floor(Math.random() * SERVICES.length)
  const tone = authorized ? 'yellow' : 'violet'

  if (sim.mode === 'direct') {
    addToken(sim, {
      from: { kind: 'client', index: client },
      to: { kind: 'service', index: service },
      duration: TIMING.direct,
      tone,
      arrive: () => {
        if (!authorized) {
          sim.exposed++
          sim.lastExposedAt = sim.time
          float(sim, { anchor: { kind: 'serviceTop', index: service }, text: '!', tone: 'red', size: 18, offsetX: random(-50, 50) })
        }
        reachService(sim, service)
      },
    })
    return
  }

  addToken(sim, {
    from: { kind: 'client', index: client },
    to: { kind: 'shield' },
    duration: TIMING.toGate,
    tone,
    arrive: () => {
      if (!authorized) return reject(sim, client, '401')
      if (sim.buckets[client] < 1) return reject(sim, client, '429')
      sim.buckets[client]--
      addToken(sim, {
        from: { kind: 'shield' },
        to: { kind: 'service', index: service },
        duration: TIMING.toService,
        tone: 'blue',
        arrive: () => reachService(sim, service),
      })
    },
  })
}

const legitClient = () => Math.floor(Math.random() * BOT)

function flood(sim: Sim) {
  for (let i = 0; i < FLOOD_SIZE; i++) schedule(sim, i * FLOOD_INTERVAL, () => request(sim, BOT))
}

function step(sim: Sim, dt: number, autoplay: boolean) {
  advance(sim, dt)
  sim.buckets = sim.buckets.map((tokens) => Math.min(BUCKET_SIZE, tokens + (REFILL_PER_SECOND * dt) / 1000))
  if (autoplay && sim.time >= sim.nextAutoAt) {
    request(sim, legitClient())
    sim.nextAutoAt = sim.time + TIMING.autoMin + Math.random() * TIMING.autoJitter
  }
}

type ServiceLayout = { box: Box; name: Point; anchor: 'start' | 'middle'; load: Point[] }

type Layout = {
  width: number
  height: number
  clients: Box[]
  gateway: Box
  logo: Point
  title: Point
  gate: Point
  shieldEdge: Point
  plugins: Point[]
  shield: string
  services: ServiceLayout[]
  connectorsKong: string[]
  connectorsDirect: string[]
}

const clientY = [80, 160, 240, 320]
const serviceY = [110, 200, 290]

const horizontal: Layout = {
  width: 1000,
  height: 400,
  clients: clientY.map((y) => ({ x: 25, y: y - 24, w: 110, h: 48 })),
  gateway: { x: 390, y: 80, w: 160, h: 240 },
  logo: { x: 470, y: 116 },
  title: { x: 470, y: 162 },
  gate: { x: 470, y: 196 },
  shieldEdge: { x: 362, y: 200 },
  plugins: [
    { x: 470, y: 238 },
    { x: 470, y: 260 },
    { x: 470, y: 282 },
  ],
  shield: 'M362 60 H578 V180 C578 272 522 326 470 352 C418 326 362 272 362 180 Z',
  services: serviceY.map((y) => ({
    box: { x: 790, y: y - 32, w: 180, h: 64 },
    name: { x: 806, y: y + 5 },
    anchor: 'start',
    load: [0, 1, 2, 3].map((i) => ({ x: 900 + i * 18, y })),
  })),
  connectorsKong: [...clientY.map((y) => `M135 ${y} L390 200`), ...serviceY.map((y) => `M550 200 L790 ${y}`)],
  connectorsDirect: clientY.flatMap((y) => serviceY.map((sy) => `M135 ${y} L790 ${sy}`)),
}

const verticalClientX = [55, 150, 250, 345]
const verticalServiceX = [66, 200, 334]

const vertical: Layout = {
  width: 400,
  height: 640,
  clients: verticalClientX.map((x) => ({ x: x - 44, y: 20, w: 88, h: 44 })),
  gateway: { x: 110, y: 150, w: 180, h: 240 },
  logo: { x: 200, y: 188 },
  title: { x: 200, y: 234 },
  gate: { x: 200, y: 268 },
  shieldEdge: { x: 200, y: 130 },
  plugins: [
    { x: 200, y: 310 },
    { x: 200, y: 332 },
    { x: 200, y: 354 },
  ],
  shield: 'M84 130 H316 V262 C316 346 262 398 200 422 C138 398 84 346 84 262 Z',
  services: verticalServiceX.map((x) => ({
    box: { x: x - 60, y: 520, w: 120, h: 80 },
    name: { x, y: 552 },
    anchor: 'middle',
    load: [0, 1, 2, 3].map((i) => ({ x: x - 27 + i * 18, y: 578 })),
  })),
  connectorsKong: [
    ...verticalClientX.map((x) => `M${x} 64 L200 150`),
    ...verticalServiceX.map((x) => `M200 390 L${x} 520`),
  ],
  connectorsDirect: verticalClientX.flatMap((x) => verticalServiceX.map((sx) => `M${x} 64 L${sx} 520`)),
}

function resolver(layout: Layout) {
  const isVertical = layout === vertical
  return (anchor: Anchor): Point => {
    switch (anchor.kind) {
      case 'client': {
        const box = layout.clients[anchor.index]
        return isVertical ? { x: box.x + box.w / 2, y: box.y + box.h } : { x: box.x + box.w, y: box.y + box.h / 2 }
      }
      case 'shield':
        return layout.shieldEdge
      case 'bounce': {
        const client = resolver(layout)({ kind: 'client', index: anchor.index })
        return { x: (client.x + layout.shieldEdge.x) / 2, y: (client.y + layout.shieldEdge.y) / 2 }
      }
      case 'service': {
        const { box } = layout.services[anchor.index]
        return isVertical ? { x: box.x + box.w / 2, y: box.y } : { x: box.x, y: box.y + box.h / 2 }
      }
      case 'serviceTop': {
        const { box } = layout.services[anchor.index]
        return { x: box.x + box.w / 2, y: box.y - 4 }
      }
    }
  }
}

export function GatewayFlow() {
  const { t } = useCachedTranslation()
  const [sim, setSim] = useState(() => createSim('kong'))
  const { containerRef, vertical: isVertical, refresh } = useFlowLoop((dt, autoplay) => step(sim, dt, autoplay))
  const layout = isVertical ? vertical : horizontal
  const resolve = resolver(layout)
  const isKong = sim.mode === 'kong'
  const shieldHit = isKong && since(sim, sim.lastBlockAt) < 400

  const act = (action: () => void) => () => {
    action()
    refresh()
  }

  const caption = (() => {
    if (isKong) {
      return since(sim, sim.lastBlockAt) < RECENT
        ? t('gateway.caption.kongBlocking', { count: sim.blocked })
        : t('gateway.caption.kongIdle')
    }
    if (since(sim, sim.lastExposedAt) < RECENT) return t('gateway.caption.directExposed')
    if (since(sim, sim.lastErrorAt) < RECENT) return t('gateway.caption.directOverload', { count: sim.errors })
    return t('gateway.caption.directIdle')
  })()

  return (
    <FlowSection
      id="demo-gateway"
      eyebrow={t('gateway.eyebrow')}
      title={t('gateway.title')}
      subtitle={t('gateway.subtitle')}
      goals={[t('gateway.goal1'), t('gateway.goal2'), t('gateway.goal3'), t('gateway.goal4')]}
      windowTitle="gateway.live"
      modeLabel={t('gateway.modeLabel')}
      modes={[
        { id: 'direct', label: t('gateway.modeDirect') },
        { id: 'kong', label: t('gateway.modeKong') },
      ]}
      mode={sim.mode}
      onModeChange={(mode) => setSim(createSim(mode))}
      actions={
        <>
          <FlowAction icon={Send} label={t('gateway.send')} onClick={act(() => request(sim, legitClient()))} />
          <FlowAction icon={Skull} label={t('gateway.flood')} onClick={act(() => flood(sim))} />
          <FlowAction
            icon={KeyRound}
            label={t('gateway.noToken')}
            onClick={act(() => request(sim, legitClient(), false))}
          />
          <FlowAction icon={RotateCcw} label={t('flow.reset')} variant="ghost" onClick={() => setSim(createSim(sim.mode))} />
        </>
      }
      metrics={[
        { label: t('gateway.served'), value: sim.served, className: 'text-kanagawa-green' },
        { label: t('gateway.blocked'), value: sim.blocked, className: 'text-kanagawa-blue' },
        { label: t('gateway.errors'), value: sim.errors, className: sim.errors ? 'text-kanagawa-red' : undefined },
        { label: t('gateway.exposed'), value: sim.exposed, className: sim.exposed ? 'text-kanagawa-red' : undefined },
      ]}
      caption={caption}
      containerRef={containerRef}
      viewBox={layout}
      diagramLabel={t(isKong ? 'gateway.diagramKong' : 'gateway.diagramDirect')}
    >
      <Connectors paths={isKong ? layout.connectorsKong : layout.connectorsDirect} />

      {layout.clients.map((box, index) => (
        <Node key={CLIENTS[index]} box={box} accent={index === BOT ? 'red' : undefined}>
          <Label at={{ x: centerOf(box).x, y: centerOf(box).y + 5 }} size={13} tone={index === BOT ? 'red' : 'foreground'}>
            {CLIENTS[index]}
          </Label>
        </Node>
      ))}

      {isKong && (
        <path
          d={layout.shield}
          className="fill-kanagawa-blue stroke-kanagawa-blue transition-all duration-200"
          fillOpacity={shieldHit ? 0.16 : 0.05}
          strokeWidth={shieldHit ? 3 : 1.5}
          strokeOpacity={shieldHit ? 1 : 0.55}
        />
      )}

      <Node box={layout.gateway} dim={!isKong} dashed={!isKong}>
        <Logo id="kong" at={layout.logo} size={40} />
        <Label at={layout.title}>Kong Gateway</Label>
        {['gateway.pluginAuth', 'gateway.pluginRate', 'gateway.pluginRouting'].map((key, i) => (
          <Label key={key} at={layout.plugins[i]} size={11} tone="muted">
            {t(key as 'gateway.pluginAuth')}
          </Label>
        ))}
      </Node>
      {!isKong && <HaloLabel at={{ x: layout.gate.x, y: layout.gate.y + 5 }}>{t('gateway.noGateway')}</HaloLabel>}

      {layout.services.map((service, index) => {
        const state = sim.services[index]
        const overloaded = since(sim, state.overloadedAt) < 900
        const load = (state.busy ? 1 : 0) + state.queue
        return (
          <Node key={SERVICES[index]} box={service.box} accent={overloaded ? 'red' : undefined}>
            <Label at={service.name} anchor={service.anchor} tone={overloaded ? 'red' : 'foreground'}>
              {SERVICES[index]}
            </Label>
            {service.load.map((point, slot) => (
              <circle
                key={slot}
                cx={point.x}
                cy={point.y}
                r={5}
                className={cn(
                  slot < load ? (overloaded ? toneFill.red : toneFill.yellow) : 'fill-border',
                  'transition-colors',
                )}
              />
            ))}
          </Node>
        )
      })}

      <Tokens engine={sim} resolve={resolve} />
      <Floaters engine={sim} resolve={resolve} />
    </FlowSection>
  )
}

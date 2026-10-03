import { useState } from 'react'
import { Database, Power, RotateCcw, ShoppingCart, Wrench } from 'lucide-react'
import { useCachedTranslation } from '@/i18n/use-cached-translation'
import {
  addToken,
  advance,
  createEngine,
  float,
  random,
  schedule,
  type Box,
  type Engine,
  type Point,
  type Tone,
} from './engine'
import { FlowAction, FlowSection } from './flow-section'
import { Connectors, Floaters, Icon, Label, Node, Ring, Tokens, centerOf, rectOf } from './primitives'
import { useFlowLoop } from './use-flow-loop'

type Mode = 'monolith' | 'ddd'
type Anchor = { kind: 'client' } | { kind: 'context'; index: number } | { kind: 'hub' }
type Note = 'idle' | 'order' | 'rule'

type Sim = Engine<Anchor> & {
  mode: Mode
  billingUp: boolean
  pending: number
  redeploy: ({ start: number; end: number } | null)[]
  orders: number
  invoices: number
  redeployed: number
  failed: number
  note: Note
  nextAutoAt: number
}

const CONTEXTS = [
  { name: 'Orders', terms: 'Order · Customer' },
  { name: 'Catalog', terms: 'Product · SKU' },
  { name: 'Billing', terms: 'Invoice · Price' },
  { name: 'Shipping', terms: 'Shipment · Address' },
]
const ORDERS = 0
const BILLING = 2
const SHIPPING = 3
const REDEPLOY_DDD = 1600
const REDEPLOY_MONOLITH = 2400

const TIMING = {
  toOrders: 600,
  toHub: 450,
  fromHub: 500,
  call: 380,
  respond: 650,
  flush: 160,
  autoMin: 2000,
  autoJitter: 1200,
}

function createSim(mode: Mode): Sim {
  return {
    ...createEngine<Anchor>(),
    mode,
    billingUp: true,
    pending: 0,
    redeploy: CONTEXTS.map(() => null),
    orders: 0,
    invoices: 0,
    redeployed: 0,
    failed: 0,
    note: 'idle',
    nextAutoAt: 700,
  }
}

const context = (index: number): Anchor => ({ kind: 'context', index })
const hub: Anchor = { kind: 'hub' }
const client: Anchor = { kind: 'client' }

function hop(sim: Sim, from: Anchor, to: Anchor, tone: Tone, label: string | undefined, duration: number, then?: () => void) {
  addToken(sim, { from, to, tone, label, duration, arrive: then })
}

const redeploying = (sim: Sim, index: number) => {
  const window = sim.redeploy[index]
  return window !== null && sim.time < window.end
}

function invoice(sim: Sim) {
  sim.invoices++
  float(sim, { anchor: context(BILLING), text: 'Invoice', tone: 'green', size: 11, offsetX: random(-20, 20) })
}

function deliverToBilling(sim: Sim) {
  if (!sim.billingUp || redeploying(sim, BILLING)) {
    sim.pending++
    return
  }
  hop(sim, hub, context(BILLING), 'violet', 'OrderPlaced', TIMING.fromHub, () => invoice(sim))
}

function flushPending(sim: Sim) {
  const count = sim.pending
  sim.pending = 0
  for (let i = 0; i < count; i++) {
    schedule(sim, i * TIMING.flush, () => hop(sim, hub, context(BILLING), 'violet', undefined, TIMING.fromHub, () => invoice(sim)))
  }
}

function fail(sim: Sim) {
  sim.failed++
  float(sim, { anchor: context(ORDERS), text: '500', tone: 'red', offsetX: random(-24, 24) })
}

function placeOrder(sim: Sim) {
  if (sim.mode === 'ddd') {
    hop(sim, client, context(ORDERS), 'yellow', 'PlaceOrder', TIMING.toOrders, () => {
      sim.orders++
      float(sim, { anchor: context(ORDERS), text: '✓', tone: 'green', size: 15 })
      hop(sim, context(ORDERS), hub, 'violet', 'OrderPlaced', TIMING.toHub, () => {
        deliverToBilling(sim)
        hop(sim, hub, context(SHIPPING), 'violet', 'OrderPlaced', TIMING.fromHub, () =>
          float(sim, { anchor: context(SHIPPING), text: 'Shipment', tone: 'green', size: 11 }),
        )
      })
    })
    sim.note = 'order'
    return
  }

  hop(sim, client, context(ORDERS), 'yellow', 'POST /order', TIMING.toOrders, () => {
    if (redeploying(sim, ORDERS)) return fail(sim)
    hop(sim, context(ORDERS), context(BILLING), 'blue', 'call', TIMING.call, () => {
      if (!sim.billingUp) return fail(sim)
      hop(sim, context(BILLING), context(SHIPPING), 'blue', 'call', TIMING.call, () => {
        sim.orders++
        sim.invoices++
        hop(sim, context(SHIPPING), client, 'green', '200', TIMING.respond)
      })
    })
  })
  sim.note = 'order'
}

function changeRule(sim: Sim) {
  const targets = sim.mode === 'ddd' ? [BILLING] : CONTEXTS.map((_, index) => index)
  const duration = sim.mode === 'ddd' ? REDEPLOY_DDD : REDEPLOY_MONOLITH
  targets.forEach((index) => {
    sim.redeploy[index] = { start: sim.time, end: sim.time + duration }
    float(sim, { anchor: context(index), text: 'deploy', tone: 'blue', size: 11 })
  })
  sim.redeployed += targets.length
  sim.note = 'rule'
  if (sim.mode === 'ddd') schedule(sim, duration, () => sim.billingUp && flushPending(sim))
}

function toggleBilling(sim: Sim) {
  sim.billingUp = !sim.billingUp
  if (sim.billingUp && sim.mode === 'ddd') flushPending(sim)
}

function step(sim: Sim, dt: number, autoplay: boolean) {
  advance(sim, dt)
  if (autoplay && sim.time >= sim.nextAutoAt) {
    placeOrder(sim)
    sim.nextAutoAt = sim.time + TIMING.autoMin + Math.random() * TIMING.autoJitter
  }
}

type Layout = {
  width: number
  height: number
  client: Box
  contexts: Box[]
  hub: Box
  monolith: Box
  monolithLabel: Point
  dddConnectors: string[]
}

const horizontal: Layout = {
  width: 1000,
  height: 400,
  client: { x: 25, y: 172, w: 110, h: 56 },
  contexts: [
    { x: 220, y: 60, w: 210, h: 112 },
    { x: 220, y: 228, w: 210, h: 112 },
    { x: 720, y: 60, w: 210, h: 112 },
    { x: 720, y: 228, w: 210, h: 112 },
  ],
  hub: { x: 495, y: 176, w: 160, h: 48 },
  monolith: { x: 196, y: 30, w: 758, h: 340 },
  monolithLabel: { x: 575, y: 356 },
  dddConnectors: ['M135 200 L220 116', 'M430 116 L495 200', 'M655 200 L720 116', 'M655 200 L720 284', 'M430 284 L495 200'],
}

const vertical: Layout = {
  width: 400,
  height: 620,
  client: { x: 140, y: 16, w: 120, h: 48 },
  contexts: [
    { x: 16, y: 104, w: 176, h: 112 },
    { x: 208, y: 104, w: 176, h: 112 },
    { x: 16, y: 392, w: 176, h: 112 },
    { x: 208, y: 392, w: 176, h: 112 },
  ],
  hub: { x: 120, y: 280, w: 160, h: 48 },
  monolith: { x: 6, y: 84, w: 388, h: 500 },
  monolithLabel: { x: 200, y: 570 },
  dddConnectors: ['M200 64 L104 104', 'M104 216 L200 280', 'M296 216 L200 280', 'M200 328 L104 392', 'M200 328 L296 392'],
}

const pairs = [0, 1, 2, 3].flatMap((a) => [0, 1, 2, 3].filter((b) => b > a).map((b) => [a, b] as const))

function resolver(layout: Layout) {
  return (anchor: Anchor): Point => {
    switch (anchor.kind) {
      case 'client':
        return centerOf(layout.client)
      case 'context':
        return centerOf(layout.contexts[anchor.index])
      case 'hub':
        return centerOf(layout.hub)
    }
  }
}

export function DddFlow() {
  const { t } = useCachedTranslation()
  const [sim, setSim] = useState(() => createSim('ddd'))
  const { containerRef, vertical: isVertical, refresh } = useFlowLoop((dt, autoplay) => step(sim, dt, autoplay))
  const layout = isVertical ? vertical : horizontal
  const resolve = resolver(layout)
  const isDdd = sim.mode === 'ddd'

  const act = (action: () => void) => () => {
    action()
    refresh()
  }

  const caption = (() => {
    const prefix = isDdd ? 'ddd' : 'mono'
    if (!sim.billingUp) {
      return isDdd
        ? t('ddd.caption.dddBillingDown', { count: sim.pending })
        : t('ddd.caption.monoBillingDown', { count: sim.failed })
    }
    const anyRedeploying = CONTEXTS.some((_, index) => redeploying(sim, index))
    if (sim.note === 'rule' || anyRedeploying) return t(`ddd.caption.${prefix}Rule`)
    if (sim.note === 'order') return t(`ddd.caption.${prefix}Order`)
    return t(`ddd.caption.${prefix}Idle`)
  })()

  return (
    <FlowSection
      id="demo-ddd"
      eyebrow={t('ddd.eyebrow')}
      title={t('ddd.title')}
      subtitle={t('ddd.subtitle')}
      goals={[t('ddd.goal1'), t('ddd.goal2'), t('ddd.goal3'), t('ddd.goal4')]}
      windowTitle="domains.live"
      modeLabel={t('ddd.modeLabel')}
      modes={[
        { id: 'monolith', label: t('ddd.modeMonolith') },
        { id: 'ddd', label: t('ddd.modeDdd') },
      ]}
      mode={sim.mode}
      onModeChange={(mode) => setSim(createSim(mode))}
      actions={
        <>
          <FlowAction icon={ShoppingCart} label={t('ddd.placeOrder')} onClick={act(() => placeOrder(sim))} />
          <FlowAction icon={Wrench} label={t('ddd.changeRule')} onClick={act(() => changeRule(sim))} />
          <FlowAction
            icon={Power}
            label={sim.billingUp ? t('ddd.billingDown') : t('ddd.billingUp')}
            pressed={!sim.billingUp}
            onClick={act(() => toggleBilling(sim))}
          />
          <FlowAction icon={RotateCcw} label={t('flow.reset')} variant="ghost" onClick={() => setSim(createSim(sim.mode))} />
        </>
      }
      metrics={[
        { label: t('ddd.orders'), value: sim.orders, className: 'text-kanagawa-green' },
        { label: t('ddd.invoices'), value: sim.invoices },
        { label: t('ddd.redeployed'), value: sim.redeployed, className: 'text-kanagawa-blue' },
        { label: t('ddd.failed'), value: sim.failed, className: sim.failed ? 'text-kanagawa-red' : undefined },
      ]}
      caption={caption}
      containerRef={containerRef}
      viewBox={layout}
      diagramLabel={t(isDdd ? 'ddd.diagramDdd' : 'ddd.diagramMonolith')}
    >
      {isDdd ? (
        <Connectors paths={layout.dddConnectors} />
      ) : (
        <>
          <rect
            {...rectOf(layout.monolith)}
            rx={12}
            className="fill-kanagawa-red stroke-kanagawa-red"
            fillOpacity={0.04}
            strokeOpacity={0.5}
            strokeDasharray="6 4"
          />
          <Label at={layout.monolithLabel} size={12} tone="red">
            {t('ddd.monolithLabel')}
          </Label>
          {pairs.map(([a, b]) => {
            const from = centerOf(layout.contexts[a])
            const to = centerOf(layout.contexts[b])
            return (
              <line
                key={`${a}-${b}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                className="stroke-kanagawa-red"
                strokeOpacity={0.35}
                strokeWidth={1.5}
              />
            )
          })}
          {[0, 1, 2, 3].map((index) => {
            const from = centerOf(layout.contexts[index])
            const to = centerOf(layout.hub)
            return (
              <line
                key={index}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                className="stroke-border"
                strokeWidth={2}
                strokeDasharray="4 6"
              />
            )
          })}
          <path d={`M${centerOf(layout.client).x} ${centerOf(layout.client).y} L${centerOf(layout.contexts[ORDERS]).x} ${centerOf(layout.contexts[ORDERS]).y}`} className="fill-none stroke-border" strokeWidth={2} strokeDasharray="4 6" />
        </>
      )}

      <Node box={layout.client}>
        <Label at={{ x: centerOf(layout.client).x, y: centerOf(layout.client).y + 5 }}>{t('ddd.client')}</Label>
      </Node>

      <Node box={layout.hub} accent={isDdd && sim.pending > 0 ? 'yellow' : undefined}>
        {isDdd ? (
          <Label at={{ x: centerOf(layout.hub).x, y: centerOf(layout.hub).y + 5 }} size={12} tone="violet">
            {sim.pending > 0 ? `${t('ddd.eventBus')} · ${sim.pending}` : t('ddd.eventBus')}
          </Label>
        ) : (
          <>
            <Icon icon={Database} at={{ x: layout.hub.x + 24, y: centerOf(layout.hub).y }} size={18} tone="red" />
            <Label at={{ x: centerOf(layout.hub).x + 12, y: centerOf(layout.hub).y + 5 }} size={12} tone="red">
              {t('ddd.sharedDb')}
            </Label>
          </>
        )}
      </Node>

      {layout.contexts.map((box, index) => {
        const down = index === BILLING && !sim.billingUp
        const window = sim.redeploy[index]
        const deploying = redeploying(sim, index)
        const center = centerOf(box)
        return (
          <Node
            key={CONTEXTS[index].name}
            box={box}
            dashed={down}
            accent={down ? 'red' : deploying ? 'blue' : isDdd ? 'violet' : undefined}
          >
            <Label at={{ x: center.x, y: box.y + 30 }} weight={600} tone={down ? 'red' : 'foreground'}>
              {CONTEXTS[index].name}
            </Label>
            <Label at={{ x: center.x, y: box.y + 54 }} size={11} tone="muted">
              {CONTEXTS[index].terms}
            </Label>
            <Label at={{ x: center.x, y: box.y + 88 }} size={11} tone={down ? 'red' : deploying ? 'blue' : 'muted'}>
              {down ? t('ddd.offline') : deploying ? t('ddd.deploying') : isDdd ? t('ddd.ownsData') : t('ddd.sharesData')}
            </Label>
            {deploying && window && (
              <Ring
                at={{ x: box.x + box.w - 18, y: box.y + 18 }}
                radius={9}
                width={2.5}
                tone="blue"
                progress={(sim.time - window.start) / (window.end - window.start)}
              />
            )}
          </Node>
        )
      })}

      <Tokens engine={sim} resolve={resolve} />
      <Floaters engine={sim} resolve={resolve} />
    </FlowSection>
  )
}

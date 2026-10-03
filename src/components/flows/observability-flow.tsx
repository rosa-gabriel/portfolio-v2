import { useState } from 'react'
import { Bug, RotateCcw, Snail, Wrench } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { addToken, advance, createEngine, float, random, type Box, type Engine, type Point, type Tone } from './engine'
import { FlowAction, FlowSection } from './flow-section'
import { Connectors, Floaters, HaloLabel, Label, Logo, Node, Tokens, centerOf } from './primitives'
import { useFlowLoop } from './use-flow-loop'

type Mode = 'blind' | 'grafana'
type Incident = 'none' | 'slow' | 'errors'
type Anchor = { kind: 'service'; index: number } | { kind: 'collector' } | { kind: 'panel' }
type Sample = { p95: number; errorRate: number }
type Completed = { at: number; latency: number; failed: boolean }

type Sim = Engine<Anchor> & {
  mode: Mode
  incident: Incident
  incidentAt: number
  detectedAt: number | null
  complaintAt: number
  culprit: boolean
  completed: Completed[]
  samples: Sample[]
  breaches: number
  requests: number
  errors: number
  ttd: number | null
  nextRequestAt: number
  nextSampleAt: number
}

const SERVICES = ['users', 'gateway', 'orders', 'payments']
const PAYMENTS = 3
const HISTORY = 48
const WINDOW_MS = 3000
const SAMPLE_MS = 350
const LATENCY_LIMIT = 900
const ERROR_LIMIT = 0.2
const CHART_MAX = 2400

const TIMING = { hop: 260, slowHop: 1500, request: 380, complaintMin: 8000, complaintJitter: 3000 }

function createSim(mode: Mode): Sim {
  return {
    ...createEngine<Anchor>(),
    mode,
    incident: 'none',
    incidentAt: 0,
    detectedAt: null,
    complaintAt: Infinity,
    culprit: false,
    completed: [],
    samples: Array.from({ length: HISTORY }, () => ({ p95: 0, errorRate: 0 })),
    breaches: 0,
    requests: 0,
    errors: 0,
    ttd: null,
    nextRequestAt: 200,
    nextSampleAt: SAMPLE_MS,
  }
}

const service = (index: number): Anchor => ({ kind: 'service', index })

function finish(sim: Sim, startedAt: number, failed: boolean) {
  sim.requests++
  if (failed) sim.errors++
  sim.completed.push({ at: sim.time, latency: sim.time - startedAt, failed })
  if (sim.mode === 'grafana') {
    addToken(sim, { from: service(1), to: { kind: 'collector' }, tone: 'violet', duration: 500 })
  }
}

function request(sim: Sim) {
  const startedAt = sim.time
  const hop = (index: number) => {
    if (index === PAYMENTS) {
      const failed = sim.incident === 'errors' && Math.random() < 0.45
      if (failed) float(sim, { anchor: service(PAYMENTS), text: '500', tone: 'red', offsetX: random(-20, 20) })
      finish(sim, startedAt, failed)
      return
    }
    const slow = sim.incident === 'slow' && index + 1 === PAYMENTS
    const tone: Tone = sim.incident !== 'none' && index + 1 === PAYMENTS ? 'red' : 'yellow'
    addToken(sim, {
      from: service(index),
      to: service(index + 1),
      tone,
      duration: slow ? TIMING.slowHop : TIMING.hop,
      arrive: () => hop(index + 1),
    })
  }
  hop(0)
}

function detect(sim: Sim) {
  if (sim.incident === 'none' || sim.detectedAt !== null) return
  sim.detectedAt = sim.time
  sim.ttd = sim.time - sim.incidentAt
  if (sim.mode === 'grafana') {
    sim.culprit = true
    float(sim, { anchor: { kind: 'panel' }, text: 'ALERT', tone: 'red', size: 16, rise: 26, duration: 1800 })
    return
  }
  float(sim, { anchor: service(0), text: 'complaint', tone: 'red', size: 12, duration: 1800 })
  SERVICES.slice(1).forEach((_, i) => float(sim, { anchor: service(i + 1), text: '?', tone: 'yellow', size: 18, delay: 300 + i * 150 }))
}

function inject(sim: Sim, incident: Exclude<Incident, 'none'>) {
  sim.incident = incident
  sim.incidentAt = sim.time
  sim.detectedAt = null
  sim.culprit = false
  sim.breaches = 0
  sim.complaintAt = sim.time + TIMING.complaintMin + Math.random() * TIMING.complaintJitter
}

function fix(sim: Sim) {
  sim.incident = 'none'
  sim.detectedAt = null
  sim.culprit = false
  sim.complaintAt = Infinity
}

function sample(sim: Sim) {
  sim.completed = sim.completed.filter((entry) => sim.time - entry.at < WINDOW_MS)
  const latencies = sim.completed.map((entry) => entry.latency).sort((a, b) => a - b)
  const p95 = latencies.length ? latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * 0.95))] : 0
  const errorRate = sim.completed.length ? sim.completed.filter((entry) => entry.failed).length / sim.completed.length : 0
  sim.samples = [...sim.samples.slice(1), { p95, errorRate }]

  if (sim.mode !== 'grafana') return
  sim.breaches = p95 > LATENCY_LIMIT || errorRate > ERROR_LIMIT ? sim.breaches + 1 : 0
  if (sim.breaches >= 2) detect(sim)
}

function step(sim: Sim, dt: number, autoplay: boolean) {
  advance(sim, dt)
  if ((autoplay || sim.incident !== 'none') && sim.time >= sim.nextRequestAt) {
    request(sim)
    sim.nextRequestAt = sim.time + TIMING.request * random(0.7, 1.3)
  }
  if (sim.time >= sim.nextSampleAt) {
    sim.nextSampleAt = sim.time + SAMPLE_MS
    sample(sim)
  }
  if (sim.mode === 'blind' && sim.time >= sim.complaintAt) {
    sim.complaintAt = Infinity
    detect(sim)
  }
}

type Layout = {
  width: number
  height: number
  services: Box[]
  collector: Box
  collectorLogo: Point
  collectorTitle: Point
  collectorSub: Point
  panel: Box
  panelLogo: Point
  panelTitle: Point
  alert: Point
  chart: Box
  connectors: string[]
}

const horizontal: Layout = {
  width: 1000,
  height: 400,
  services: [20, 270, 520, 770].map((x) => ({ x, y: 40, w: 150, h: 60 })),
  collector: { x: 20, y: 180, w: 190, h: 170 },
  collectorLogo: { x: 115, y: 226 },
  collectorTitle: { x: 115, y: 278 },
  collectorSub: { x: 115, y: 300 },
  panel: { x: 250, y: 160, w: 730, h: 220 },
  panelLogo: { x: 276, y: 186 },
  panelTitle: { x: 296, y: 191 },
  alert: { x: 960, y: 191 },
  chart: { x: 276, y: 212, w: 680, h: 148 },
  connectors: [
    'M170 70 L270 70',
    'M420 70 L520 70',
    'M670 70 L770 70',
    'M95 100 L95 180',
    'M345 100 L150 180',
    'M595 100 L190 200',
    'M845 100 L210 220',
    'M210 265 L250 265',
  ],
}

const vertical: Layout = {
  width: 400,
  height: 640,
  services: [
    { x: 16, y: 16, w: 176, h: 56 },
    { x: 208, y: 16, w: 176, h: 56 },
    { x: 16, y: 100, w: 176, h: 56 },
    { x: 208, y: 100, w: 176, h: 56 },
  ],
  collector: { x: 16, y: 190, w: 368, h: 90 },
  collectorLogo: { x: 50, y: 235 },
  collectorTitle: { x: 80, y: 232 },
  collectorSub: { x: 80, y: 252 },
  panel: { x: 16, y: 310, w: 368, h: 310 },
  panelLogo: { x: 40, y: 336 },
  panelTitle: { x: 58, y: 341 },
  alert: { x: 370, y: 366 },
  chart: { x: 36, y: 380, w: 328, h: 220 },
  connectors: ['M192 44 L208 44', 'M296 72 L104 100', 'M192 128 L208 128', 'M200 156 L200 190', 'M200 280 L200 310'],
}

function resolver(layout: Layout) {
  return (anchor: Anchor): Point => {
    switch (anchor.kind) {
      case 'service':
        return centerOf(layout.services[anchor.index])
      case 'collector':
        return centerOf(layout.collector)
      case 'panel':
        return layout.alert
    }
  }
}

function chartPath(samples: Sample[], chart: Box) {
  const step = chart.w / (samples.length - 1)
  return samples
    .map((entry, i) => {
      const y = chart.y + chart.h - (Math.min(entry.p95, CHART_MAX) / CHART_MAX) * chart.h
      return `${i === 0 ? 'M' : 'L'}${(chart.x + i * step).toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
}

export function ObservabilityFlow() {
  const { t } = useTranslation()
  const [sim, setSim] = useState(() => createSim('grafana'))
  const { containerRef, vertical: isVertical, refresh } = useFlowLoop((dt, autoplay) => step(sim, dt, autoplay))
  const layout = isVertical ? vertical : horizontal
  const resolve = resolver(layout)
  const isGrafana = sim.mode === 'grafana'
  const latest = sim.samples[sim.samples.length - 1]
  const firing = isGrafana && sim.detectedAt !== null
  const thresholdY = layout.chart.y + layout.chart.h - (LATENCY_LIMIT / CHART_MAX) * layout.chart.h
  const barWidth = layout.chart.w / sim.samples.length

  const act = (action: () => void) => () => {
    action()
    refresh()
  }

  const caption = (() => {
    const prefix = isGrafana ? 'grafana' : 'blind'
    if (sim.incident === 'none') return t(`obs.caption.${prefix}Idle`)
    if (sim.detectedAt === null) return t(`obs.caption.${prefix}Incident`)
    return t(`obs.caption.${prefix}Detected`, { seconds: ((sim.ttd ?? 0) / 1000).toFixed(1) })
  })()

  return (
    <FlowSection
      eyebrow={t('obs.eyebrow')}
      title={t('obs.title')}
      subtitle={t('obs.subtitle')}
      goals={[t('obs.goal1'), t('obs.goal2'), t('obs.goal3'), t('obs.goal4')]}
      windowTitle="observability.live"
      modeLabel={t('obs.modeLabel')}
      modes={[
        { id: 'blind', label: t('obs.modeBlind') },
        { id: 'grafana', label: 'OpenTelemetry + Grafana' },
      ]}
      mode={sim.mode}
      onModeChange={(mode) => setSim(createSim(mode))}
      actions={
        <>
          {sim.incident === 'none' ? (
            <>
              <FlowAction icon={Snail} label={t('obs.injectSlow')} onClick={act(() => inject(sim, 'slow'))} />
              <FlowAction icon={Bug} label={t('obs.injectErrors')} onClick={act(() => inject(sim, 'errors'))} />
            </>
          ) : (
            <FlowAction icon={Wrench} label={t('obs.fix')} onClick={act(() => fix(sim))} />
          )}
          <FlowAction icon={RotateCcw} label={t('flow.reset')} variant="ghost" onClick={() => setSim(createSim(sim.mode))} />
        </>
      }
      metrics={[
        { label: t('obs.requests'), value: sim.requests },
        { label: t('obs.errors'), value: sim.errors, className: sim.errors ? 'text-kanagawa-red' : undefined },
        {
          label: 'p95',
          value: isGrafana ? `${Math.round(latest.p95)}ms` : '?',
          className: latest.p95 > LATENCY_LIMIT && isGrafana ? 'text-kanagawa-red' : undefined,
        },
        {
          label: t('obs.ttd'),
          value: sim.ttd === null ? '-' : `${(sim.ttd / 1000).toFixed(1)}s`,
          className: sim.ttd === null ? undefined : isGrafana ? 'text-kanagawa-green' : 'text-kanagawa-red',
        },
      ]}
      caption={caption}
      containerRef={containerRef}
      viewBox={layout}
      diagramLabel={t(isGrafana ? 'obs.diagramGrafana' : 'obs.diagramBlind')}
    >
      <Connectors paths={isGrafana ? layout.connectors : layout.connectors.slice(0, 3)} />

      {layout.services.map((box, index) => {
        const culprit = index === PAYMENTS && sim.culprit
        return (
          <Node key={SERVICES[index]} box={box} accent={culprit ? 'red' : undefined}>
            <Label at={{ x: centerOf(box).x, y: centerOf(box).y + (culprit ? -2 : 5) }} tone={culprit ? 'red' : 'foreground'}>
              {SERVICES[index]}
            </Label>
            {culprit && (
              <Label at={{ x: centerOf(box).x, y: centerOf(box).y + 18 }} size={10} tone="red">
                {t('obs.traceCulprit')}
              </Label>
            )}
          </Node>
        )
      })}

      <Node box={layout.collector} dim={!isGrafana} dashed={!isGrafana}>
        <Logo id="opentelemetry" at={layout.collectorLogo} size={isVertical ? 30 : 44} />
        <Label at={layout.collectorTitle} anchor={isVertical ? 'start' : 'middle'} size={13}>
          OpenTelemetry
        </Label>
        <Label at={layout.collectorSub} anchor={isVertical ? 'start' : 'middle'} size={11} tone="muted">
          metrics · logs · traces
        </Label>
      </Node>

      <Node box={layout.panel} dim={!isGrafana} dashed={!isGrafana} accent={firing ? 'red' : undefined}>
        <Logo id="grafana" at={layout.panelLogo} size={20} />
        <Label at={layout.panelTitle} anchor="start" size={12}>
          {t('obs.panelTitle')}
        </Label>
        {firing && (
          <Label at={layout.alert} anchor="end" size={12} tone="red" weight={600}>
            {t('obs.alertFiring')}
          </Label>
        )}
        {isGrafana && sim.samples.map((entry, i) => (
          <rect
            key={i}
            x={layout.chart.x + i * barWidth}
            y={layout.chart.y + layout.chart.h - entry.errorRate * layout.chart.h}
            width={Math.max(barWidth - 2, 1)}
            height={entry.errorRate * layout.chart.h}
            className="fill-kanagawa-red"
            opacity={0.35}
          />
        ))}
        <line
          x1={layout.chart.x}
          x2={layout.chart.x + layout.chart.w}
          y1={thresholdY}
          y2={thresholdY}
          className="stroke-kanagawa-red"
          strokeDasharray="5 5"
          strokeOpacity={0.7}
        />
        <line
          x1={layout.chart.x}
          x2={layout.chart.x + layout.chart.w}
          y1={layout.chart.y + layout.chart.h}
          y2={layout.chart.y + layout.chart.h}
          className="stroke-border"
        />
        {isGrafana && (
          <path
            d={chartPath(sim.samples, layout.chart)}
          className={cn('fill-none', firing ? 'stroke-kanagawa-red' : 'stroke-kanagawa-yellow')}
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
        )}
      </Node>
      {!isGrafana && <HaloLabel at={centerOf(layout.panel)}>{t('obs.noTelemetry')}</HaloLabel>}

      <Tokens engine={sim} resolve={resolve} />
      <Floaters engine={sim} resolve={resolve} />
    </FlowSection>
  )
}

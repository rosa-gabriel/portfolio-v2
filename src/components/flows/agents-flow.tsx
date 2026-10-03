import { useState } from 'react'
import { GitMerge, ListPlus, ListTodo, Plus, RotateCcw, User } from 'lucide-react'
import { useCachedTranslation } from '@/i18n/use-cached-translation'
import { addToken, advance, createEngine, schedule, type Box, type Engine, type Point } from './engine'
import { FlowAction, FlowSection } from './flow-section'
import { Connectors, Floaters, HaloLabel, Icon, Label, Logo, Node, Ring, Tokens, centerOf } from './primitives'
import { useFlowLoop } from './use-flow-loop'

type Mode = 'solo' | 'agents'
type Anchor = { kind: 'backlog' } | { kind: 'agent'; index: number } | { kind: 'dev' } | { kind: 'shipped' }
type Work = { createdAt: number; start: number; end: number }

type Sim = Engine<Anchor> & {
  mode: Mode
  backlog: number[]
  agents: (Work | null)[]
  dev: (Work & { kind: 'implement' | 'review' }) | null
  reviewQueue: number[]
  shipped: number
  leadTimes: number[]
  nextAutoAt: number
}

const AGENTS = 3
const VISIBLE_TASKS = 12
const BATCH = 6
const LEAD_SAMPLES = 10

const TIMING = {
  travel: 500,
  soloImplement: 2400,
  agentImplement: 2200,
  review: 500,
  autoMin: 2800,
  autoJitter: 1400,
}

function createSim(mode: Mode): Sim {
  return {
    ...createEngine<Anchor>(),
    mode,
    backlog: [],
    agents: Array.from({ length: AGENTS }, () => null),
    dev: null,
    reviewQueue: [],
    shipped: 0,
    leadTimes: [],
    nextAutoAt: 400,
  }
}

function addTasks(sim: Sim, count: number) {
  for (let i = 0; i < count; i++) sim.backlog.push(sim.time)
}

function ship(sim: Sim, createdAt: number) {
  addToken(sim, {
    from: { kind: 'dev' },
    to: { kind: 'shipped' },
    tone: 'green',
    duration: TIMING.travel,
    arrive: () => {
      sim.shipped++
      sim.leadTimes.push(sim.time - createdAt)
      if (sim.leadTimes.length > LEAD_SAMPLES) sim.leadTimes.shift()
    },
  })
}

function startDev(sim: Sim, createdAt: number, kind: 'implement' | 'review', delay: number, duration: number) {
  const start = sim.time + delay
  sim.dev = { createdAt, start, end: start + duration, kind }
  schedule(sim, delay + duration, () => {
    sim.dev = null
    ship(sim, createdAt)
  })
}

function assign(sim: Sim) {
  if (sim.mode === 'solo') {
    if (sim.dev || !sim.backlog.length) return
    const createdAt = sim.backlog.shift()!
    addToken(sim, { from: { kind: 'backlog' }, to: { kind: 'dev' }, tone: 'yellow', duration: TIMING.travel })
    startDev(sim, createdAt, 'implement', TIMING.travel, TIMING.soloImplement)
    return
  }

  sim.agents.forEach((work, index) => {
    if (work || !sim.backlog.length) return
    const createdAt = sim.backlog.shift()!
    const start = sim.time + TIMING.travel
    sim.agents[index] = { createdAt, start, end: start + TIMING.agentImplement }
    addToken(sim, { from: { kind: 'backlog' }, to: { kind: 'agent', index }, tone: 'yellow', duration: TIMING.travel })
    schedule(sim, TIMING.travel + TIMING.agentImplement, () => {
      sim.agents[index] = null
      addToken(sim, {
        from: { kind: 'agent', index },
        to: { kind: 'dev' },
        tone: 'blue',
        label: 'PR',
        duration: TIMING.travel,
        arrive: () => sim.reviewQueue.push(createdAt),
      })
    })
  })

  if (!sim.dev && sim.reviewQueue.length) startDev(sim, sim.reviewQueue.shift()!, 'review', 0, TIMING.review)
}

function step(sim: Sim, dt: number, autoplay: boolean) {
  advance(sim, dt)
  if (autoplay && sim.time >= sim.nextAutoAt) {
    addTasks(sim, 1)
    sim.nextAutoAt = sim.time + TIMING.autoMin + Math.random() * TIMING.autoJitter
  }
  assign(sim)
}

type Layout = {
  width: number
  height: number
  backlog: Box
  backlogIcon: Point
  backlogTitle: Point
  taskOrigin: Point
  taskColumns: number
  agents: Box
  claudeLogo: Point
  agentsTitle: Point
  agentRows: { mascot: Point; label: Point; ring: Point }[]
  dev: Box
  devIcon: Point
  devTitle: Point
  devRing: Point
  devStatus: Point
  shipped: Box
  shippedIcon: Point
  shippedTitle: Point
  shippedCount: Point
  connectorsAgents: string[]
  connectorsSolo: string[]
}

const horizontal: Layout = {
  width: 1000,
  height: 400,
  backlog: { x: 20, y: 110, w: 210, h: 180 },
  backlogIcon: { x: 46, y: 140 },
  backlogTitle: { x: 64, y: 145 },
  taskOrigin: { x: 50, y: 200 },
  taskColumns: 6,
  agents: { x: 290, y: 60, w: 250, h: 280 },
  claudeLogo: { x: 322, y: 96 },
  agentsTitle: { x: 344, y: 101 },
  agentRows: [168, 228, 288].map((y) => ({ mascot: { x: 322, y }, label: { x: 344, y: y + 4 }, ring: { x: 505, y } })),
  dev: { x: 600, y: 110, w: 170, h: 180 },
  devIcon: { x: 685, y: 142 },
  devTitle: { x: 685, y: 180 },
  devRing: { x: 685, y: 226 },
  devStatus: { x: 685, y: 274 },
  shipped: { x: 830, y: 130, w: 150, h: 140 },
  shippedIcon: { x: 905, y: 164 },
  shippedTitle: { x: 905, y: 198 },
  shippedCount: { x: 905, y: 244 },
  connectorsAgents: ['M230 200 L290 200', 'M540 200 L600 200', 'M770 200 L830 200'],
  connectorsSolo: ['M230 200 L600 200', 'M770 200 L830 200'],
}

const vertical: Layout = {
  width: 400,
  height: 860,
  backlog: { x: 16, y: 16, w: 368, h: 140 },
  backlogIcon: { x: 40, y: 44 },
  backlogTitle: { x: 58, y: 49 },
  taskOrigin: { x: 48, y: 96 },
  taskColumns: 12,
  agents: { x: 16, y: 200, w: 368, h: 250 },
  claudeLogo: { x: 44, y: 234 },
  agentsTitle: { x: 66, y: 239 },
  agentRows: [300, 350, 400].map((y) => ({ mascot: { x: 46, y }, label: { x: 68, y: y + 4 }, ring: { x: 344, y } })),
  dev: { x: 100, y: 494, w: 200, h: 180 },
  devIcon: { x: 200, y: 526 },
  devTitle: { x: 200, y: 564 },
  devRing: { x: 200, y: 610 },
  devStatus: { x: 200, y: 658 },
  shipped: { x: 120, y: 714, w: 160, h: 130 },
  shippedIcon: { x: 200, y: 744 },
  shippedTitle: { x: 200, y: 776 },
  shippedCount: { x: 200, y: 820 },
  connectorsAgents: ['M200 156 L200 200', 'M200 450 L200 494', 'M200 674 L200 714'],
  connectorsSolo: ['M200 156 L200 494', 'M200 674 L200 714'],
}

const taskPoint = (layout: Layout, index: number): Point => ({
  x: layout.taskOrigin.x + (index % layout.taskColumns) * 26,
  y: layout.taskOrigin.y + Math.floor(index / layout.taskColumns) * 36,
})

function resolver(layout: Layout) {
  return (anchor: Anchor): Point => {
    switch (anchor.kind) {
      case 'backlog':
        return taskPoint(layout, 0)
      case 'agent':
        return layout.agentRows[anchor.index].ring
      case 'dev':
        return layout.devRing
      case 'shipped':
        return centerOf(layout.shipped)
    }
  }
}

const progressOf = (sim: Sim, work: Work | null) =>
  work && sim.time >= work.start ? (sim.time - work.start) / (work.end - work.start) : null

export function AgentsFlow() {
  const { t } = useCachedTranslation()
  const [sim, setSim] = useState(() => createSim('agents'))
  const { containerRef, vertical: isVertical, refresh } = useFlowLoop((dt, autoplay) => step(sim, dt, autoplay))
  const layout = isVertical ? vertical : horizontal
  const resolve = resolver(layout)
  const isAgents = sim.mode === 'agents'
  const working = sim.agents.filter(Boolean).length
  const inProgress = working + (sim.dev ? 1 : 0) + sim.reviewQueue.length
  const lead = sim.leadTimes.length
    ? sim.leadTimes.reduce((total, value) => total + value, 0) / sim.leadTimes.length
    : null

  const act = (action: () => void) => () => {
    action()
    refresh()
  }

  const caption = (() => {
    if (!isAgents) {
      return sim.backlog.length >= 3
        ? t('agents.caption.soloBusy', { count: sim.backlog.length })
        : t('agents.caption.soloIdle')
    }
    if (sim.dev?.kind === 'review' && sim.reviewQueue.length >= 1) return t('agents.caption.agentsReview')
    if (working > 0) return t('agents.caption.agentsBusy', { count: working })
    return t('agents.caption.agentsIdle')
  })()

  const devStatus = sim.dev
    ? sim.dev.kind === 'review'
      ? t('agents.reviewing')
      : t('agents.implementing')
    : t('agents.idle')

  return (
    <FlowSection
      eyebrow={t('agents.eyebrow')}
      title={t('agents.title')}
      subtitle={t('agents.subtitle')}
      goals={[t('agents.goal1'), t('agents.goal2'), t('agents.goal3'), t('agents.goal4')]}
      windowTitle="workflow.live"
      modeLabel={t('agents.modeLabel')}
      modes={[
        { id: 'solo', label: t('agents.modeSolo') },
        { id: 'agents', label: t('agents.modeAgents') },
      ]}
      mode={sim.mode}
      onModeChange={(mode) => setSim(createSim(mode))}
      actions={
        <>
          <FlowAction icon={ListPlus} label={t('agents.addBatch', { count: BATCH })} onClick={act(() => addTasks(sim, BATCH))} />
          <FlowAction icon={Plus} label={t('agents.addTask')} onClick={act(() => addTasks(sim, 1))} />
          <FlowAction icon={RotateCcw} label={t('flow.reset')} variant="ghost" onClick={() => setSim(createSim(sim.mode))} />
        </>
      }
      metrics={[
        { label: t('agents.backlog'), value: sim.backlog.length, className: 'text-kanagawa-yellow' },
        { label: t('agents.inProgress'), value: inProgress, className: 'text-kanagawa-blue' },
        { label: t('agents.shipped'), value: sim.shipped, className: 'text-kanagawa-green' },
        { label: t('agents.leadTime'), value: lead === null ? '-' : `${(lead / 1000).toFixed(1)}s` },
      ]}
      caption={caption}
      containerRef={containerRef}
      viewBox={layout}
      diagramLabel={t(isAgents ? 'agents.diagramAgents' : 'agents.diagramSolo')}
    >
      <Connectors paths={isAgents ? layout.connectorsAgents : layout.connectorsSolo} />

      <Node box={layout.backlog}>
        <Icon icon={ListTodo} at={layout.backlogIcon} size={18} />
        <Label at={layout.backlogTitle} anchor="start" size={12} tone="muted">
          backlog
        </Label>
        {sim.backlog.slice(0, VISIBLE_TASKS).map((createdAt, index) => {
          const point = taskPoint(layout, index)
          return (
            <rect
              key={`${createdAt}-${index}`}
              x={-7}
              y={-7}
              width={14}
              height={14}
              rx={3}
              className="fill-kanagawa-yellow"
              style={{ transform: `translate(${point.x}px, ${point.y}px)`, transition: 'transform 250ms ease-out' }}
            />
          )
        })}
        {sim.backlog.length > VISIBLE_TASKS && (
          <Label at={{ x: layout.backlog.x + layout.backlog.w - 14, y: layout.backlog.y + layout.backlog.h - 14 }} anchor="end" size={11} tone="yellow">
            {`+${sim.backlog.length - VISIBLE_TASKS}`}
          </Label>
        )}
      </Node>

      <Node box={layout.agents} dim={!isAgents} dashed={!isAgents} accent={isAgents && working > 0 ? 'violet' : undefined}>
        <Logo id="claude" at={layout.claudeLogo} size={24} />
        <Label at={layout.agentsTitle} anchor="start">
          Claude Code
        </Label>
        {layout.agentRows.map((row, index) => (
          <g key={index}>
            <Logo id="claudecode" at={row.mascot} size={18} dim={!sim.agents[index]} />
            <Label at={row.label} anchor="start" size={11} tone={sim.agents[index] ? 'foreground' : 'muted'}>
              {`worktree-${index + 1}`}
            </Label>
            <Ring at={row.ring} progress={progressOf(sim, sim.agents[index])} tone="violet" />
          </g>
        ))}
      </Node>
      {!isAgents && <HaloLabel at={{ x: centerOf(layout.agents).x, y: centerOf(layout.agents).y + 5 }}>{t('agents.justMe')}</HaloLabel>}

      <Node box={layout.dev} accent={sim.dev ? (sim.dev.kind === 'review' ? 'blue' : 'yellow') : undefined}>
        <Icon icon={User} at={layout.devIcon} size={24} />
        <Label at={layout.devTitle}>Gabriel</Label>
        <Ring at={layout.devRing} radius={18} progress={progressOf(sim, sim.dev)} tone={sim.dev?.kind === 'review' ? 'blue' : 'yellow'} />
        <Label at={layout.devStatus} size={11} tone="muted">
          {devStatus}
        </Label>
      </Node>

      <Node box={layout.shipped}>
        <Icon icon={GitMerge} at={layout.shippedIcon} size={22} tone="green" />
        <Label at={layout.shippedTitle} size={12} tone="muted">
          main
        </Label>
        <Label at={layout.shippedCount} size={26} weight={600}>
          {sim.shipped}
        </Label>
      </Node>

      <Tokens engine={sim} resolve={resolve} />
      <Floaters engine={sim} resolve={resolve} />
    </FlowSection>
  )
}

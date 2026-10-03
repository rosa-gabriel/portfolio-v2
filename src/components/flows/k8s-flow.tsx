import { useState } from 'react'
import { Building2, Cloud, Rocket, RotateCcw, ServerCrash, TrendingUp } from 'lucide-react'
import { useCachedTranslation } from '@/i18n/use-cached-translation'
import { cn } from '@/lib/utils'
import { addToken, advance, createEngine, float, random, schedule, since, type Box, type Engine, type Point } from './engine'
import { FlowAction, FlowSection } from './flow-section'
import { Connectors, Floaters, Icon, Label, Logo, Node, Tokens, centerOf, toneFill, toneStroke } from './primitives'
import { useFlowLoop } from './use-flow-loop'

type Mode = 'servers' | 'k8s'
type Note = 'idle' | 'spike' | 'node' | 'deploy'
type Anchor = { kind: 'users' } | { kind: 'lb' } | { kind: 'pod'; id: number }
type PodState = 'starting' | 'running' | 'terminating' | 'deploying'

type Version = 1 | 2
type Pod = { id: number; node: number; slot: number; version: Version; state: PodState; since: number }
type NodeState = { up: boolean }

type Sim = Engine<Anchor> & {
  mode: Mode
  nodes: NodeState[]
  pods: Pod[]
  desired: number
  version: Version
  recent: number[]
  boostUntil: number
  served: number
  failed: number
  manual: number
  note: Note
  noteAt: number
  nextRequestAt: number
  nextHpaAt: number
}

const NODES = 6
const SLOTS = 3
const CAPACITY_PER_POD = 2.6
const MIN_PODS = 4
const MAX_PODS = 12
const BASE_INTERVAL = 260
const SPIKE_FACTOR = 8
const SPIKE_MS = 6000
const NOTE_MS = 7000

const TIMING = { toLb: 320, toPod: 380, start: 900, terminate: 500, hpa: 700, recover: 7000, serverDeploy: 1200 }

const clusterOf = (node: number) => (node < NODES / 2 ? 0 : 1)

function createSim(mode: Mode): Sim {
  const sim: Sim = {
    ...createEngine<Anchor>(),
    mode,
    nodes: Array.from({ length: NODES }, () => ({ up: true })),
    pods: [],
    desired: mode === 'k8s' ? MIN_PODS : NODES,
    version: 1,
    recent: [],
    boostUntil: -Infinity,
    served: 0,
    failed: 0,
    manual: 0,
    note: 'idle',
    noteAt: 0,
    nextRequestAt: 300,
    nextHpaAt: TIMING.hpa,
  }
  if (mode === 'servers') {
    for (let node = 0; node < NODES; node++) sim.pods.push(newPod(sim, node, 1, 1, 'running'))
  } else {
    for (let i = 0; i < MIN_PODS; i++) {
      const node = i * 2 + (i % 2)
      sim.pods.push(newPod(sim, node % NODES, 0, 1, 'running'))
    }
  }
  return sim
}

function newPod(sim: Sim, node: number, slot: number, version: Version, state: PodState): Pod {
  return { id: sim.nextId++, node, slot, version, state, since: sim.time }
}

const running = (sim: Sim) => sim.pods.filter((pod) => pod.state === 'running' && sim.nodes[pod.node].up)
const alive = (sim: Sim) => sim.pods.filter((pod) => pod.state === 'running' || pod.state === 'starting')

function note(sim: Sim, value: Note) {
  sim.note = value
  sim.noteAt = sim.time
}

function freeSlot(sim: Sim): { node: number; slot: number } | null {
  const candidates = sim.nodes
    .map((state, node) => ({ node, state, used: sim.pods.filter((pod) => pod.node === node && pod.state !== 'terminating') }))
    .filter(({ state, used }) => state.up && used.length < SLOTS)
    .sort((a, b) => a.used.length - b.used.length || clusterOf(a.node) - clusterOf(b.node))
  const target = candidates[0]
  if (!target) return null
  const taken = new Set(target.used.map((pod) => pod.slot))
  const slot = [0, 1, 2].find((value) => !taken.has(value)) ?? 0
  return { node: target.node, slot }
}

function startPod(sim: Sim, version: Version, onReady?: () => void) {
  const place = freeSlot(sim)
  if (!place) return false
  const pod = newPod(sim, place.node, place.slot, version, 'starting')
  sim.pods.push(pod)
  schedule(sim, TIMING.start, () => {
    if (pod.state !== 'starting') return
    pod.state = 'running'
    onReady?.()
  })
  return true
}

function terminate(sim: Sim, pod: Pod) {
  pod.state = 'terminating'
  pod.since = sim.time
  schedule(sim, TIMING.terminate, () => {
    sim.pods = sim.pods.filter((entry) => entry !== pod)
  })
}

const nextVersion = (sim: Sim): Version => (sim.version === 1 ? 2 : 1)

function reconcile(sim: Sim) {
  const pods = alive(sim)
  const outdated = pods.filter((pod) => pod.version !== sim.version)
  const surge = outdated.length > 0 ? 1 : 0

  if (pods.length < sim.desired) {
    for (let i = pods.length; i < sim.desired; i++) if (!startPod(sim, sim.version)) break
    return
  }

  if (pods.length > sim.desired + surge) {
    const current = pods.filter((pod) => pod.version === sim.version).reverse()
    const excess = [...outdated, ...current].slice(0, pods.length - sim.desired - surge)
    excess.forEach((pod) => terminate(sim, pod))
    return
  }

  if (!outdated.length || pods.some((pod) => pod.state === 'starting')) return

  const started = startPod(sim, sim.version, () => {
    const old = alive(sim).find((pod) => pod.version !== sim.version && pod.state === 'running')
    if (old) terminate(sim, old)
    reconcile(sim)
  })
  if (!started) terminate(sim, outdated[0])
}

function request(sim: Sim) {
  sim.recent.push(sim.time)
  addToken(sim, {
    from: { kind: 'users' },
    to: { kind: 'lb' },
    tone: 'yellow',
    duration: TIMING.toLb,
    arrive: () => {
      const targets = sim.mode === 'k8s' ? running(sim) : sim.pods
      const pod = targets[Math.floor(Math.random() * targets.length)]
      const load = sim.recent.filter((at) => sim.time - at < 1000).length / Math.max(running(sim).length, 1)
      const healthy = pod && pod.state === 'running' && sim.nodes[pod.node].up
      const overloaded = load > CAPACITY_PER_POD && Math.random() > CAPACITY_PER_POD / load
      if (!healthy || overloaded) {
        sim.failed++
        float(sim, { anchor: { kind: 'lb' }, text: '503', tone: 'red', offsetX: random(-24, 24) })
        return
      }
      sim.served++
      addToken(sim, { from: { kind: 'lb' }, to: { kind: 'pod', id: pod.id }, tone: pod.version === 2 ? 'green' : 'blue', duration: TIMING.toPod })
    },
  })
}

function spike(sim: Sim) {
  sim.boostUntil = sim.time + SPIKE_MS
  note(sim, 'spike')
}

function killNode(sim: Sim) {
  const candidates = sim.nodes.map((state, node) => ({ state, node })).filter(({ state }) => state.up)
  const victim = candidates[Math.floor(Math.random() * candidates.length)]
  if (!victim) return
  victim.state.up = false
  note(sim, 'node')

  if (sim.mode === 'k8s') {
    sim.pods.filter((pod) => pod.node === victim.node).forEach((pod) => terminate(sim, pod))
    schedule(sim, 300, () => reconcile(sim))
    schedule(sim, TIMING.recover, () => {
      victim.state.up = true
    })
    return
  }

  sim.manual++
  schedule(sim, TIMING.recover, () => {
    victim.state.up = true
    float(sim, { anchor: { kind: 'lb' }, text: 'fixed by hand', tone: 'yellow', size: 11 })
  })
}

function deploy(sim: Sim) {
  note(sim, 'deploy')
  sim.version = nextVersion(sim)

  if (sim.mode === 'k8s') {
    reconcile(sim)
    return
  }

  const target = sim.version
  sim.pods.forEach((pod, order) => {
    schedule(sim, order * TIMING.serverDeploy, () => {
      pod.state = 'deploying'
      sim.manual++
      schedule(sim, TIMING.serverDeploy, () => {
        pod.version = target
        pod.state = 'running'
      })
    })
  })
}

function step(sim: Sim, dt: number, autoplay: boolean) {
  advance(sim, dt)
  sim.recent = sim.recent.filter((at) => sim.time - at < 1000)

  if (autoplay && sim.time >= sim.nextRequestAt) {
    request(sim)
    const factor = sim.time < sim.boostUntil ? SPIKE_FACTOR : 1
    sim.nextRequestAt = sim.time + (BASE_INTERVAL / factor) * random(0.7, 1.3)
  }

  if (sim.mode === 'k8s' && sim.time >= sim.nextHpaAt) {
    sim.nextHpaAt = sim.time + TIMING.hpa
    const utilization = sim.recent.length / Math.max(running(sim).length, 1) / CAPACITY_PER_POD
    if (utilization > 0.8) sim.desired = Math.min(MAX_PODS, sim.desired + 3)
    else if (utilization < 0.35) sim.desired = Math.max(MIN_PODS, sim.desired - 1)
    reconcile(sim)
  }

  if (sim.note !== 'idle' && since(sim, sim.noteAt) > NOTE_MS) sim.note = 'idle'
}

type Layout = {
  width: number
  height: number
  users: Box
  lb: Box
  clusters: Box[]
  clusterTitle: Point[]
  clusterIcon: Point[]
  clusterLogo: Point[]
  nodes: Box[]
  slotOffset: (slot: number) => Point
  connectors: string[]
}

const horizontalNodes: Box[] = [0, 1].flatMap((cluster) =>
  [0, 1, 2].map((i) => ({ x: 372 + i * 200, y: cluster === 0 ? 72 : 252, w: 180, h: 100 })),
)

const horizontal: Layout = {
  width: 1000,
  height: 400,
  users: { x: 20, y: 170, w: 100, h: 60 },
  lb: { x: 170, y: 160, w: 130, h: 80 },
  clusters: [
    { x: 352, y: 28, w: 628, h: 158 },
    { x: 352, y: 208, w: 628, h: 158 },
  ],
  clusterTitle: [
    { x: 394, y: 53 },
    { x: 394, y: 233 },
  ],
  clusterIcon: [
    { x: 376, y: 48 },
    { x: 376, y: 228 },
  ],
  clusterLogo: [
    { x: 958, y: 48 },
    { x: 958, y: 228 },
  ],
  nodes: horizontalNodes,
  slotOffset: (slot) => ({ x: 42 + slot * 48, y: 62 }),
  connectors: ['M120 200 L170 200', 'M300 200 L352 107', 'M300 200 L352 287'],
}

const verticalNodes: Box[] = [0, 1].flatMap((cluster) =>
  [0, 1, 2].map((i) => ({ x: 26 + i * 118, y: cluster === 0 ? 262 : 562, w: 110, h: 110 })),
)

const vertical: Layout = {
  width: 400,
  height: 720,
  users: { x: 150, y: 16, w: 100, h: 50 },
  lb: { x: 135, y: 100, w: 130, h: 70 },
  clusters: [
    { x: 14, y: 210, w: 372, h: 178 },
    { x: 14, y: 510, w: 372, h: 178 },
  ],
  clusterTitle: [
    { x: 56, y: 236 },
    { x: 56, y: 536 },
  ],
  clusterIcon: [
    { x: 38, y: 231 },
    { x: 38, y: 531 },
  ],
  clusterLogo: [
    { x: 364, y: 231 },
    { x: 364, y: 531 },
  ],
  nodes: verticalNodes,
  slotOffset: (slot) => ({ x: 24 + slot * 31, y: 70 }),
  connectors: ['M200 66 L200 100', 'M200 170 L200 210', 'M200 170 C 400 300, 400 450, 386 510'],
}

function podPoint(layout: Layout, pod: Pod): Point {
  const node = layout.nodes[pod.node]
  const offset = layout.slotOffset(pod.slot)
  return { x: node.x + offset.x, y: node.y + offset.y }
}

function resolver(layout: Layout, sim: Sim) {
  return (anchor: Anchor): Point => {
    switch (anchor.kind) {
      case 'users':
        return centerOf(layout.users)
      case 'lb':
        return centerOf(layout.lb)
      case 'pod': {
        const pod = sim.pods.find((entry) => entry.id === anchor.id)
        return pod ? podPoint(layout, pod) : centerOf(layout.lb)
      }
    }
  }
}

export function K8sFlow() {
  const { t } = useCachedTranslation()
  const [sim, setSim] = useState(() => createSim('k8s'))
  const { containerRef, vertical: isVertical, refresh } = useFlowLoop((dt, autoplay) => step(sim, dt, autoplay || sim.time < sim.boostUntil))
  const layout = isVertical ? vertical : horizontal
  const resolve = resolver(layout, sim)
  const isK8s = sim.mode === 'k8s'
  const replicas = running(sim).length
  const podSize = isVertical ? 24 : 30

  const act = (action: () => void) => () => {
    action()
    refresh()
  }

  const caption = (() => {
    const prefix = isK8s ? 'k8s' : 'servers'
    if (sim.note === 'spike') return t(`k8s.caption.${prefix}Spike`, { count: isK8s ? replicas : sim.failed })
    if (sim.note === 'node') return t(`k8s.caption.${prefix}Node`)
    if (sim.note === 'deploy') {
      return t(`k8s.caption.${prefix}Deploy`, { next: sim.version, previous: nextVersion(sim) })
    }
    return t(`k8s.caption.${prefix}Idle`)
  })()

  return (
    <FlowSection
      id="demo-kubernetes"
      eyebrow={t('k8s.eyebrow')}
      title={t('k8s.title')}
      subtitle={t('k8s.subtitle')}
      goals={[t('k8s.goal1'), t('k8s.goal2'), t('k8s.goal3'), t('k8s.goal4')]}
      windowTitle="cluster.live"
      modeLabel={t('k8s.modeLabel')}
      modes={[
        { id: 'servers', label: t('k8s.modeServers') },
        { id: 'k8s', label: 'Kubernetes' },
      ]}
      mode={sim.mode}
      onModeChange={(mode) => setSim(createSim(mode))}
      actions={
        <>
          <FlowAction icon={TrendingUp} label={t('k8s.spike')} onClick={act(() => spike(sim))} />
          <FlowAction icon={ServerCrash} label={t('k8s.killNode')} onClick={act(() => killNode(sim))} />
          <FlowAction
            icon={Rocket}
            label={t('k8s.deploy', { version: nextVersion(sim) })}
            onClick={act(() => deploy(sim))}
          />
          <FlowAction icon={RotateCcw} label={t('flow.reset')} variant="ghost" onClick={() => setSim(createSim(sim.mode))} />
        </>
      }
      metrics={[
        { label: t('k8s.replicas'), value: replicas, className: 'text-kanagawa-blue' },
        { label: t('k8s.served'), value: sim.served, className: 'text-kanagawa-green' },
        { label: t('k8s.failed'), value: sim.failed, className: sim.failed ? 'text-kanagawa-red' : undefined },
        { label: t('k8s.manual'), value: sim.manual, className: sim.manual ? 'text-kanagawa-red' : undefined },
      ]}
      caption={caption}
      containerRef={containerRef}
      viewBox={layout}
      diagramLabel={t(isK8s ? 'k8s.diagramK8s' : 'k8s.diagramServers')}
    >
      <Connectors paths={layout.connectors} />

      <Node box={layout.users}>
        <Label at={{ x: centerOf(layout.users).x, y: centerOf(layout.users).y + 5 }}>{t('k8s.users')}</Label>
      </Node>
      <Node box={layout.lb}>
        <Label at={{ x: centerOf(layout.lb).x, y: centerOf(layout.lb).y - 4 }} size={12}>
          {isK8s ? 'ingress' : 'load balancer'}
        </Label>
        <Label at={{ x: centerOf(layout.lb).x, y: centerOf(layout.lb).y + 16 }} size={11} tone="muted">
          {`${sim.recent.length} req/s`}
        </Label>
      </Node>

      {layout.clusters.map((cluster, index) => (
        <g key={index}>
          <rect
            x={cluster.x}
            y={cluster.y}
            width={cluster.w}
            height={cluster.h}
            rx={10}
            className={cn('fill-none', isK8s ? 'stroke-kanagawa-blue' : 'stroke-border')}
            strokeOpacity={isK8s ? 0.6 : 1}
            strokeDasharray="6 4"
          />
          <Icon icon={index === 0 ? Cloud : Building2} at={layout.clusterIcon[index]} size={16} />
          <Label at={layout.clusterTitle[index]} anchor="start" size={12} tone="muted">
            {index === 0 ? t('k8s.cloud') : t('k8s.onPrem')}
          </Label>
          {isK8s && <Logo id="kubernetes" at={layout.clusterLogo[index]} size={20} />}
        </g>
      ))}

      {layout.nodes.map((box, node) => {
        const up = sim.nodes[node].up
        return (
          <Node key={node} box={box} accent={up ? undefined : 'red'} dashed={!up}>
            <Label at={{ x: box.x + 10, y: box.y + 18 }} anchor="start" size={11} tone={up ? 'muted' : 'red'}>
              {up ? `${isK8s ? 'node' : 'server'}-${node + 1}` : t('k8s.down')}
            </Label>
          </Node>
        )
      })}

      {sim.pods.map((pod) => {
        const point = podPoint(layout, pod)
        const nodeUp = sim.nodes[pod.node].up
        const broken = !nodeUp || pod.state === 'deploying'
        const tone = broken ? 'red' : pod.version === 2 ? 'green' : 'blue'
        const opacity =
          pod.state === 'terminating'
            ? Math.max(0, 1 - since(sim, pod.since) / TIMING.terminate)
            : pod.state === 'starting'
              ? 0.45
              : 1
        return (
          <g key={pod.id} opacity={opacity}>
            <rect
              x={point.x - podSize / 2}
              y={point.y - podSize / 2}
              width={podSize}
              height={podSize}
              rx={6}
              className={cn(toneFill[tone], toneStroke[tone])}
              fillOpacity={pod.state === 'starting' ? 0.15 : 0.85}
              strokeDasharray={pod.state === 'starting' || broken ? '3 3' : undefined}
            />
            <text x={point.x} y={point.y + 4} fontSize={10} textAnchor="middle" className="fill-background font-semibold">
              {`v${pod.version}`}
            </text>
          </g>
        )
      })}

      <Tokens engine={sim} resolve={resolve} />
      <Floaters engine={sim} resolve={resolve} />
    </FlowSection>
  )
}

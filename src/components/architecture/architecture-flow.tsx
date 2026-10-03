import { useEffect, useRef, useState } from 'react'
import { Clock, Database, History, Power, RotateCcw, Send, Zap } from 'lucide-react'
import { useCachedTranslation } from '@/i18n/use-cached-translation'
import { FlowAction, FlowSection } from '@/components/flows/flow-section'
import { TechMark } from '@/components/tech-mark'
import { cn } from '@/lib/utils'
import {
  horizontal,
  resolve,
  slotPoint,
  sourcePoint,
  vertical,
  windowStart,
  type Box,
  type Layout,
} from './layouts'
import {
  CRON_INTERVAL,
  PARTITIONS,
  TIMING,
  VISIBLE_SLOTS,
  averageLatency,
  createSimulation,
  emit,
  isLoading,
  lag,
  replay,
  setFlinkUp,
  sourceWindowStart,
  spike,
  step,
  type Layer,
  type Mode,
  type Simulation,
  type Tone,
} from './simulation'

const PRODUCER_NAMES = ['app', 'erp', 'iot']
const LAYERS: Layer[] = ['raw', 'silver']
const MAX_FRAME_MS = 64
const VERTICAL_BREAKPOINT = 720
const LAKE_FLASH_MS = 350

const toneClass: Record<Tone, string> = {
  raw: 'fill-kanagawa-yellow',
  processed: 'fill-kanagawa-green',
}

const layerAccent: Record<Layer, string> = {
  raw: 'stroke-kanagawa-yellow',
  silver: 'stroke-kanagawa-green',
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
const easeOut = (t: number) => 1 - (1 - t) ** 3

export function ArchitectureFlow() {
  const { t } = useCachedTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [sim, setSim] = useState(() => createSimulation('kafka'))
  const [, setFrame] = useState(0)
  const [layout, setLayout] = useState<Layout>(horizontal)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const autoplay = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    let last = 0

    const loop = (now: number) => {
      const dt = last ? Math.min(now - last, MAX_FRAME_MS) : 16
      last = now
      step(sim, dt, autoplay)
      setFrame((value) => value + 1)
      frame = requestAnimationFrame(loop)
    }

    const visibility = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !frame) {
        last = 0
        frame = requestAnimationFrame(loop)
      }
      if (!entry.isIntersecting && frame) {
        cancelAnimationFrame(frame)
        frame = 0
      }
    })
    const size = new ResizeObserver(([entry]) => {
      setLayout(entry.contentRect.width < VERTICAL_BREAKPOINT ? vertical : horizontal)
    })

    visibility.observe(container)
    size.observe(container)
    return () => {
      visibility.disconnect()
      size.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [sim])

  const isKafka = sim.mode === 'kafka'
  const loading = isLoading(sim)
  const waiting = isKafka ? lag(sim) : sim.pending.length
  const delay = averageLatency(sim)
  const secondsToRun = Math.max(0, Math.ceil((sim.nextRunAt - sim.time) / 1000))
  const activeLayer: Layer = isKafka ? 'silver' : 'raw'
  const lakeFlashing = sim.time - sim.lakeFlashAt < LAKE_FLASH_MS

  const act = (action: (sim: Simulation) => void) => () => {
    action(sim)
    setFrame((value) => value + 1)
  }

  const switchMode = (mode: Mode) => setSim(createSimulation(mode))

  const caption = (() => {
    if (!isKafka) {
      if (loading) return t('arch.caption.batchLoading', { count: sim.loadingCount })
      if (waiting > 0) return t('arch.caption.batchWaiting', { count: waiting, seconds: secondsToRun })
      return t('arch.caption.batchIdle')
    }
    if (sim.replaying) return t('arch.caption.kafkaReplay')
    if (!sim.flinkUp) return t('arch.caption.kafkaDown', { count: waiting })
    if (waiting >= 3) return t('arch.caption.kafkaBuffering', { count: waiting })
    return t('arch.caption.kafkaIdle')
  })()

  const box = (b: Box) => ({ x: b.x, y: b.y, width: b.w, height: b.h })

  const lanes = Array.from({ length: PARTITIONS }, (_, lane) => (
    <line
      key={lane}
      x1={layout.laneStart}
      x2={layout.laneEnd}
      y1={layout.laneY[lane]}
      y2={layout.laneY[lane]}
      className="stroke-border"
      strokeWidth={18}
      strokeLinecap="round"
      opacity={0.6}
    />
  ))

  return (
    <FlowSection
      id="demo-streaming"
      eyebrow={t('arch.eyebrow')}
      title={t('arch.title')}
      subtitle={t('arch.subtitle')}
      goals={[t('arch.goal1'), t('arch.goal2'), t('arch.goal3'), t('arch.goal4')]}
      windowTitle="pipeline.live"
      modeLabel={t('arch.modeLabel')}
      modes={[
        { id: 'batch', label: t('arch.modeBatch') },
        { id: 'kafka', label: t('arch.modeKafka') },
      ]}
      mode={sim.mode}
      onModeChange={switchMode}
      actions={
        <>
          <FlowAction icon={Send} label={t('arch.send')} onClick={act((s) => emit(s))} />
          <FlowAction icon={Zap} label={t('arch.spike')} onClick={act(spike)} />
          {isKafka && (
            <>
              <FlowAction
                icon={Power}
                label={sim.flinkUp ? t('arch.killFlink') : t('arch.restoreFlink')}
                pressed={!sim.flinkUp}
                onClick={act((s) => setFlinkUp(s, !s.flinkUp))}
              />
              <FlowAction icon={History} label={t('arch.replay')} onClick={act(replay)} />
            </>
          )}
          <FlowAction icon={RotateCcw} label={t('arch.reset')} variant="ghost" onClick={() => switchMode(sim.mode)} />
        </>
      }
      metrics={[
        { label: t('arch.sent'), value: sim.sent },
        { label: t(isKafka ? 'arch.lag' : 'arch.waitingSync'), value: waiting, className: 'text-kanagawa-yellow' },
        {
          label: t('arch.delay'),
          value: delay === null ? '-' : `${(delay / 1000).toFixed(1)}s`,
          className: isKafka ? 'text-kanagawa-green' : 'text-kanagawa-red',
        },
        { label: t('arch.cost'), value: `$${sim.cost}`, className: isKafka ? undefined : 'text-kanagawa-red' },
      ]}
      caption={caption}
      containerRef={containerRef}
      viewBox={layout}
      diagramLabel={t(isKafka ? 'arch.diagramLabelKafka' : 'arch.diagramLabelBatch')}
    >
      {layout.connectors.map((d) => (
        <path key={d} d={d} className="fill-none stroke-border" strokeWidth={2} strokeDasharray="4 6" />
      ))}

      {layout.producers.map((producer, index) => (
        <g key={PRODUCER_NAMES[index]}>
          <rect {...box(producer)} rx={6} className="fill-background stroke-border" />
          <text
            x={producer.x + producer.w / 2}
            y={producer.y + producer.h / 2 + 5}
            textAnchor="middle"
            fontSize={14}
            className="fill-foreground"
          >
            {PRODUCER_NAMES[index]}
          </text>
        </g>
      ))}

      <g>
        <rect {...box(layout.store)} rx={8} className="fill-background stroke-border" />
        {isKafka ? (
          <>
            <TechMark id="kafka" {...layout.storeMark} className="fill-foreground" />
            <text {...layout.storeLabel} fontSize={13} className="fill-muted-foreground">
              {`apache kafka · ${t('arch.topic')}`}
            </text>
            {lanes}
            {Array.from({ length: PARTITIONS }, (_, partition) => {
              const y = layout.laneY[partition]
              const start = windowStart(sim, partition)
              const committedIndex = Math.min(Math.max(sim.committed[partition] - start, -1), VISIBLE_SLOTS)
              const caretX = layout.laneStart + 14 + committedIndex * layout.slotGap
              return (
                <g key={partition}>
                  <text x={layout.laneLabelX} y={y + 4} fontSize={11} className="fill-muted-foreground">
                    {`p${partition}`}
                  </text>
                  {sim.logs[partition]
                    .filter((record) => record.offset >= start)
                    .map(({ offset }) => {
                      const point = slotPoint(layout, sim, partition, offset)
                      return (
                        <circle
                          key={offset}
                          r={6}
                          style={{
                            transform: `translate(${point.x}px, ${point.y}px)`,
                            transition: 'transform 250ms ease-out',
                          }}
                          className={
                            offset >= sim.committed[partition]
                              ? 'fill-kanagawa-yellow'
                              : 'fill-muted-foreground opacity-40'
                          }
                        />
                      )
                    })}
                  <path d={`M${caretX} ${y + 13} l-5 7 h10 z`} className="fill-kanagawa-blue" />
                </g>
              )
            })}
          </>
        ) : (
          <>
            <Database
              x={layout.storeMark.x}
              y={layout.storeMark.y}
              size={layout.storeMark.size}
              strokeWidth={1.75}
              className="text-foreground"
            />
            <text {...layout.storeLabel} fontSize={13} className="fill-muted-foreground">
              {t('arch.sourceDb')}
            </text>
            {lanes}
            {Array.from(
              { length: Math.max(sim.sourceArrived - sourceWindowStart(sim), 0) },
              (_, i) => sourceWindowStart(sim) + i,
            ).map((index) => {
              const point = sourcePoint(layout, sim, index)
              return (
                <circle
                  key={index}
                  r={6}
                  style={{
                    transform: `translate(${point.x}px, ${point.y}px)`,
                    transition: 'transform 250ms ease-out',
                  }}
                  className={
                    index >= sim.loadedEnd ? 'fill-kanagawa-yellow' : 'fill-muted-foreground opacity-40'
                  }
                />
              )
            })}
          </>
        )}
      </g>

      <g>
        <rect
          {...box(layout.worker)}
          rx={8}
          className={cn(
            'fill-background',
            isKafka && !sim.flinkUp ? 'stroke-kanagawa-red' : 'stroke-border',
          )}
          strokeWidth={isKafka && !sim.flinkUp ? 2 : 1}
          strokeDasharray={isKafka && !sim.flinkUp ? '6 4' : undefined}
        />
        {isKafka ? (
          <>
            <TechMark
              id="flink"
              {...layout.workerMark}
              className={cn('fill-foreground transition-opacity', !sim.flinkUp && 'opacity-25')}
            />
            <text
              {...layout.workerLabel}
              textAnchor="middle"
              fontSize={13}
              className={sim.flinkUp ? 'fill-foreground' : 'fill-kanagawa-red'}
            >
              {sim.flinkUp ? 'Apache Flink' : t('arch.offline')}
            </text>
            {layout.subtasks.map((point, index) => {
              const { processing } = sim.subtasks[index]
              const progress = processing
                ? Math.min((sim.time - processing.start) / (processing.end - processing.start), 1)
                : 0
              return (
                <g key={index}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={15}
                    className={cn('fill-card stroke-border', !sim.flinkUp && 'opacity-40')}
                    strokeWidth={3}
                  />
                  {processing && (
                    <>
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r={15}
                        pathLength={1}
                        strokeDasharray={`${progress} 1`}
                        transform={`rotate(-90 ${point.x} ${point.y})`}
                        className="stroke-kanagawa-green fill-none"
                        strokeWidth={3}
                      />
                      <circle cx={point.x} cy={point.y} r={6} className="fill-kanagawa-yellow" />
                    </>
                  )}
                  <text
                    x={point.x}
                    y={layout.subtaskLabelY}
                    textAnchor="middle"
                    fontSize={11}
                    className="fill-muted-foreground"
                  >
                    {`t${index}`}
                  </text>
                </g>
              )
            })}
            <text {...layout.workerFooter} textAnchor="middle" fontSize={11} className="fill-kanagawa-blue">
              {t('arch.parallelism', { count: PARTITIONS })}
            </text>
          </>
        ) : (
          <>
            <Clock
              x={layout.workerMark.x + 4}
              y={layout.workerMark.y + 2}
              size={layout.workerMark.size - 8}
              strokeWidth={1.75}
              className="text-foreground"
            />
            <text {...layout.workerLabel} textAnchor="middle" fontSize={13} className="fill-foreground">
              {t('arch.cronLabel')}
            </text>
            <circle
              cx={layout.cronRing.x}
              cy={layout.cronRing.y}
              r={22}
              className="fill-card stroke-border"
              strokeWidth={4}
            />
            <circle
              cx={layout.cronRing.x}
              cy={layout.cronRing.y}
              r={22}
              pathLength={1}
              strokeDasharray={`${loading ? 1 : 1 - (sim.nextRunAt - sim.time) / CRON_INTERVAL} 1`}
              transform={`rotate(-90 ${layout.cronRing.x} ${layout.cronRing.y})`}
              className={cn('fill-none', loading ? 'stroke-kanagawa-red' : 'stroke-kanagawa-yellow')}
              strokeWidth={4}
            />
            {!loading && (
              <text
                x={layout.cronRing.x}
                y={layout.cronRing.y + 5}
                textAnchor="middle"
                fontSize={14}
                fontWeight={600}
                className="fill-foreground"
              >
                {`${secondsToRun}s`}
              </text>
            )}
            <text
              {...layout.workerFooter}
              textAnchor="middle"
              fontSize={11}
              className={loading ? 'fill-kanagawa-red' : 'fill-muted-foreground'}
            >
              {loading ? t('arch.loading') : t('arch.nextSync')}
            </text>
          </>
        )}
      </g>

      <g>
        <rect
          {...box(layout.lake)}
          rx={8}
          className={cn('fill-background', loading ? 'stroke-kanagawa-red' : 'stroke-border')}
          strokeWidth={loading ? 2 : 1}
        />
        <TechMark id="databricks" {...layout.lakeMark} className="fill-foreground" />
        <text {...layout.lakeLabel} textAnchor="middle" fontSize={13} className="fill-foreground">
          Data lake
        </text>
        {LAYERS.map((layer) => {
          const rect = layout.layers[layer]
          const active = layer === activeLayer
          const count = layer === 'raw' ? sim.raw : sim.silver
          return (
            <g key={layer} className={cn('transition-opacity duration-300', !active && 'opacity-45')}>
              <rect
                {...box(rect)}
                rx={6}
                className={cn('fill-card', active ? layerAccent[layer] : 'stroke-border')}
                strokeWidth={active ? 1.5 : 1}
              />
              <text
                x={rect.x + 10}
                y={rect.y + rect.h / 2 + 4}
                fontSize={12}
                className="fill-muted-foreground"
              >
                {layer}
              </text>
              <text
                x={rect.x + rect.w - 10}
                y={rect.y + rect.h / 2 + 6}
                textAnchor="end"
                fontSize={17}
                fontWeight={600}
                className={cn(
                  'transition-colors',
                  active && lakeFlashing
                    ? layer === 'silver'
                      ? 'fill-kanagawa-green'
                      : 'fill-kanagawa-yellow'
                    : 'fill-foreground',
                )}
              >
                {count}
              </text>
            </g>
          )
        })}
      </g>

      {sim.tokens.map((token) => {
        const progress = Math.min((sim.time - token.start) / token.duration, 1)
        const eased = easeInOut(progress)
        const from = resolve(layout, sim, token.from)
        const to = resolve(layout, sim, token.to)
        return (
          <circle
            key={token.id}
            cx={from.x + (to.x - from.x) * eased}
            cy={from.y + (to.y - from.y) * eased}
            r={6}
            className={toneClass[token.tone]}
          />
        )
      })}

      {sim.dollars.map((dollar) => {
        const progress = (sim.time - dollar.start) / TIMING.dollar
        if (progress <= 0) return null
        return (
          <text
            key={dollar.id}
            x={layout.dollarOrigin.x + dollar.offsetX + dollar.drift * Math.sin(progress * Math.PI)}
            y={layout.dollarOrigin.y - dollar.rise * easeOut(progress)}
            textAnchor="middle"
            fontSize={dollar.size}
            fontWeight={700}
            opacity={progress < 0.15 ? progress / 0.15 : 1 - (progress - 0.15) / 0.85}
            className="fill-kanagawa-red"
          >
            $
          </text>
        )
      })}
    </FlowSection>
  )
}

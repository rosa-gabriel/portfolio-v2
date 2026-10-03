import {
  PARTITIONS,
  VISIBLE_SLOTS,
  sourceWindowStart,
  type Anchor,
  type Layer,
  type Simulation,
} from './simulation'

export type Point = { x: number; y: number }
export type Box = { x: number; y: number; w: number; h: number }
export type Mark = { x: number; y: number; size: number }

export type Layout = {
  width: number
  height: number
  producers: Box[]
  producerOut: Point[]
  store: Box
  storeMark: Mark
  storeLabel: Point
  laneY: number[]
  laneStart: number
  laneEnd: number
  laneLabelX: number
  slotGap: number
  worker: Box
  workerMark: Mark
  workerLabel: Point
  subtasks: Point[]
  subtaskLabelY: number
  workerFooter: Point
  cronRing: Point
  lake: Box
  lakeMark: Mark
  lakeLabel: Point
  layers: Record<Layer, Box>
  dollarOrigin: Point
  connectors: string[]
}

const horizontalProducers = [110, 200, 290]
const horizontalLanes = [196, 250]

export const horizontal: Layout = {
  width: 1000,
  height: 400,
  producers: horizontalProducers.map((y) => ({ x: 30, y: y - 26, w: 110, h: 52 })),
  producerOut: horizontalProducers.map((y) => ({ x: 140, y })),
  store: { x: 240, y: 120, w: 350, h: 170 },
  storeMark: { x: 260, y: 136, size: 22 },
  storeLabel: { x: 292, y: 152 },
  laneY: horizontalLanes,
  laneStart: 296,
  laneEnd: 574,
  laneLabelX: 258,
  slotGap: 23,
  worker: { x: 660, y: 100, w: 140, h: 200 },
  workerMark: { x: 707, y: 114, size: 46 },
  workerLabel: { x: 730, y: 180 },
  subtasks: [
    { x: 700, y: 226 },
    { x: 760, y: 226 },
  ],
  subtaskLabelY: 258,
  workerFooter: { x: 730, y: 284 },
  cronRing: { x: 730, y: 230 },
  lake: { x: 840, y: 100, w: 140, h: 200 },
  lakeMark: { x: 890, y: 112, size: 40 },
  lakeLabel: { x: 910, y: 170 },
  layers: {
    raw: { x: 852, y: 186, w: 116, h: 44 },
    silver: { x: 852, y: 240, w: 116, h: 44 },
  },
  dollarOrigin: { x: 910, y: 104 },
  connectors: [
    ...horizontalProducers.map((y, i) => `M140 ${y} L240 ${horizontalLanes[i % PARTITIONS]}`),
    'M590 205 L660 205',
    'M800 200 L840 200',
  ],
}

const verticalProducers = [75, 200, 325]
const verticalLanes = [214, 262]

export const vertical: Layout = {
  width: 400,
  height: 800,
  producers: verticalProducers.map((x) => ({ x: x - 50, y: 30, w: 100, h: 46 })),
  producerOut: verticalProducers.map((x) => ({ x, y: 76 })),
  store: { x: 16, y: 130, w: 368, h: 166 },
  storeMark: { x: 34, y: 146, size: 20 },
  storeLabel: { x: 64, y: 161 },
  laneY: verticalLanes,
  laneStart: 70,
  laneEnd: 368,
  laneLabelX: 32,
  slotGap: 25,
  worker: { x: 100, y: 346, w: 200, h: 196 },
  workerMark: { x: 178, y: 360, size: 44 },
  workerLabel: { x: 200, y: 424 },
  subtasks: [
    { x: 160, y: 468 },
    { x: 240, y: 468 },
  ],
  subtaskLabelY: 500,
  workerFooter: { x: 200, y: 526 },
  cronRing: { x: 200, y: 472 },
  lake: { x: 110, y: 592, w: 180, h: 190 },
  lakeMark: { x: 180, y: 604, size: 40 },
  lakeLabel: { x: 200, y: 662 },
  layers: {
    raw: { x: 124, y: 678, w: 152, h: 42 },
    silver: { x: 124, y: 728, w: 152, h: 42 },
  },
  dollarOrigin: { x: 200, y: 596 },
  connectors: [
    ...verticalProducers.map((x) => `M${x} 76 L${x} 130`),
    'M200 296 L200 346',
    'M200 542 L200 592',
  ],
}

export function windowStart(sim: Simulation, partition: number) {
  return Math.max(0, sim.logEnd[partition] - VISIBLE_SLOTS)
}

export function slotPoint(layout: Layout, sim: Simulation, partition: number, offset: number): Point {
  const index = Math.max(-1, offset - windowStart(sim, partition))
  return { x: layout.laneStart + 14 + index * layout.slotGap, y: layout.laneY[partition] }
}

export function sourcePoint(layout: Layout, sim: Simulation, index: number): Point {
  const column = Math.max(-1, Math.floor((index - sourceWindowStart(sim)) / 2))
  return { x: layout.laneStart + 14 + column * layout.slotGap, y: layout.laneY[index % 2] }
}

export function layerCenter(layout: Layout, layer: Layer): Point {
  const box = layout.layers[layer]
  return { x: box.x + box.w / 2, y: box.y + box.h / 2 }
}

export function resolve(layout: Layout, sim: Simulation, anchor: Anchor): Point {
  switch (anchor.kind) {
    case 'producer':
      return layout.producerOut[anchor.index]
    case 'slot':
      return slotPoint(layout, sim, anchor.partition, anchor.offset)
    case 'subtask':
      return layout.subtasks[anchor.index]
    case 'source':
      return sourcePoint(layout, sim, anchor.index)
    case 'cron':
      return layout.cronRing
    case 'layer':
      return layerCenter(layout, anchor.layer)
  }
}

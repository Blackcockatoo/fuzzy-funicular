import { polarToCartesian } from "@/lib/glyph/mandala"

import {
  VIRMANA_CANVAS_SIZE,
  type VirmanaBackdropCircle,
  type VirmanaBackdropLine,
  type VirmanaBackdropPath,
  type VirmanaBackdropPolygon,
  type VirmanaBackdropRect,
  type VirmanaBackdropShape,
  type VirmanaBackdropText,
  type VirmanaOptions,
  type VirmanaPoint,
} from "@/lib/glyph/virmana"

export interface VirmanaPatternContext {
  canvas: number
  center: number
  ringRadii: number[]
  options: VirmanaOptions
}

export interface VirmanaPatternDefaults {
  rings?: number
  spokes?: number
  rotation?: number
  deduplicate?: boolean
  traceSequence?: boolean
  weaveRings?: boolean
  mirror?: boolean
  axis?: boolean
}

export interface VirmanaPattern {
  id: string
  label: string
  description: string
  defaults?: VirmanaPatternDefaults
  showGrid?: boolean
  accent?: string
  build: (context: VirmanaPatternContext) => VirmanaBackdropShape[]
}

const DEG_TO_RAD = Math.PI / 180
const SQRT_THREE = Math.sqrt(3)

function circle(
  cx: number,
  cy: number,
  r: number,
  props: Omit<VirmanaBackdropCircle, "type" | "cx" | "cy" | "r"> = {},
): VirmanaBackdropCircle {
  return {
    type: "circle",
    cx,
    cy,
    r,
    ...props,
  }
}

function line(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  props: Omit<VirmanaBackdropLine, "type" | "x1" | "y1" | "x2" | "y2"> = {},
): VirmanaBackdropLine {
  return {
    type: "line",
    x1,
    y1,
    x2,
    y2,
    ...props,
  }
}

function polygon(points: VirmanaPoint[], props: Omit<VirmanaBackdropPolygon, "type" | "points"> = {}): VirmanaBackdropPolygon {
  return {
    type: "polygon",
    points,
    ...props,
  }
}

function rect(
  x: number,
  y: number,
  width: number,
  height: number,
  props: Omit<VirmanaBackdropRect, "type" | "x" | "y" | "width" | "height"> = {},
): VirmanaBackdropRect {
  return {
    type: "rect",
    x,
    y,
    width,
    height,
    ...props,
  }
}

function path(d: string, props: Omit<VirmanaBackdropPath, "type" | "d"> = {}): VirmanaBackdropPath {
  return {
    type: "path",
    d,
    ...props,
  }
}

function text(
  x: number,
  y: number,
  value: string,
  props: Omit<VirmanaBackdropText, "type" | "x" | "y" | "text"> = {},
): VirmanaBackdropText {
  return {
    type: "text",
    x,
    y,
    text: value,
    ...props,
  }
}

function rotatePoint(point: VirmanaPoint, center: VirmanaPoint, angle: number): VirmanaPoint {
  const rad = angle * DEG_TO_RAD
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const translatedX = point.x - center.x
  const translatedY = point.y - center.y
  return {
    x: center.x + translatedX * cos - translatedY * sin,
    y: center.y + translatedX * sin + translatedY * cos,
  }
}

function squarePoints(center: number, size: number, rotation = 0): VirmanaPoint[] {
  const half = size / 2
  const basePoints: VirmanaPoint[] = [
    { x: center - half, y: center - half },
    { x: center + half, y: center - half },
    { x: center + half, y: center + half },
    { x: center - half, y: center + half },
  ]
  if (rotation === 0) {
    return basePoints
  }
  return basePoints.map((point) => rotatePoint(point, { x: center, y: center }, rotation))
}

function regularPolygon(center: number, radius: number, sides: number, rotation = -90): VirmanaPoint[] {
  return Array.from({ length: sides }, (_, index) => {
    const angle = rotation + (360 / sides) * index
    return polarToCartesian({ radius, angle }, { x: center, y: center })
  })
}

function buildFlowerOfLife(context: VirmanaPatternContext): VirmanaBackdropShape[] {
  const { center, canvas } = context
  const circleRadius = canvas / 6.5
  const spacing = circleRadius
  const axialSize = spacing / SQRT_THREE
  const range = 2
  const shapes: VirmanaBackdropShape[] = []

  shapes.push(circle(center, center, center - 36, { stroke: "rgba(226,232,240,0.25)", strokeWidth: 2 }))

  for (let q = -range; q <= range; q += 1) {
    const rMin = Math.max(-range, -q - range)
    const rMax = Math.min(range, -q + range)
    for (let r = rMin; r <= rMax; r += 1) {
      const x = center + axialSize * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r)
      const y = center + axialSize * (1.5 * r)
      shapes.push(circle(x, y, circleRadius, { stroke: "rgba(241,245,249,0.7)", strokeWidth: 1.6, opacity: 0.9 }))
    }
  }

  const angles = Array.from({ length: 6 }, (_, index) => index * 60)
  angles.forEach((angle) => {
    const { x, y } = polarToCartesian({ radius: circleRadius * 2, angle }, { x: center, y: center })
    shapes.push(line(center, center, x, y, { stroke: "rgba(148,163,184,0.35)", strokeWidth: 1.5, dashArray: "12 10" }))
  })

  return shapes
}

function buildMetatronCube(context: VirmanaPatternContext): VirmanaBackdropShape[] {
  const { center } = context
  const outerRadius = center - 108
  const nodeRadius = outerRadius * 0.34
  const shapes: VirmanaBackdropShape[] = []

  shapes.push(circle(center, center, outerRadius + 26, { stroke: "rgba(148,163,184,0.35)", strokeWidth: 2.5 }))
  shapes.push(circle(center, center, nodeRadius, { stroke: "rgba(148,163,184,0.4)", strokeWidth: 2 }))

  const angles = Array.from({ length: 6 }, (_, index) => index * 60)
  const points = angles.map((angle) => polarToCartesian({ radius: outerRadius, angle }, { x: center, y: center }))

  points.forEach((point) => {
    shapes.push(circle(point.x, point.y, nodeRadius / 2.2, { stroke: "rgba(96,165,250,0.7)", strokeWidth: 1.8 }))
    shapes.push(line(center, center, point.x, point.y, { stroke: "rgba(96,165,250,0.4)", strokeWidth: 2 }))
  })

  shapes.push(polygon(points, { stroke: "rgba(226,232,240,0.55)", strokeWidth: 2.2 }))
  const triangleA = [points[0], points[2], points[4]]
  const triangleB = [points[1], points[3], points[5]]
  shapes.push(polygon(triangleA, { stroke: "rgba(244,244,245,0.65)", strokeWidth: 2.2 }))
  shapes.push(polygon(triangleB, { stroke: "rgba(244,244,245,0.65)", strokeWidth: 2.2 }))

  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length]
    shapes.push(line(point.x, point.y, next.x, next.y, { stroke: "rgba(148,163,184,0.35)", strokeWidth: 1.6 }))
  })

  for (let index = 0; index < points.length; index += 1) {
    const second = points[(index + 2) % points.length]
    shapes.push(line(points[index].x, points[index].y, second.x, second.y, { stroke: "rgba(56,189,248,0.45)", strokeWidth: 1.35 }))
  }

  return shapes
}

function buildTridentYantra(context: VirmanaPatternContext): VirmanaBackdropShape[] {
  const { center } = context
  const board = VIRMANA_CANVAS_SIZE * 0.62
  const outerSquare = squarePoints(center, board, 45)
  const innerSquare = squarePoints(center, board * 0.75)
  const jewelSquare = squarePoints(center, board * 0.52, 45)
  const shapes: VirmanaBackdropShape[] = []

  shapes.push(polygon(outerSquare, { stroke: "rgba(248,250,252,0.6)", strokeWidth: 3 }))
  shapes.push(polygon(innerSquare, { stroke: "rgba(248,250,252,0.65)", strokeWidth: 2.6 }))
  shapes.push(polygon(jewelSquare, { stroke: "rgba(250,250,250,0.7)", strokeWidth: 2.4 }))

  shapes.push(circle(center, center, board * 0.28, { stroke: "rgba(248,250,252,0.75)", strokeWidth: 3.2 }))

  shapes.push(line(center - board / 2.8, center, center + board / 2.8, center, { stroke: "rgba(244,244,245,0.45)", strokeWidth: 2.2 }))
  shapes.push(line(center, center - board / 2.8, center, center + board / 2.8, { stroke: "rgba(244,244,245,0.45)", strokeWidth: 2.2 }))

  const digitRadius = board * 0.34
  const digits: { label: string; angle: number }[] = [
    { label: "९", angle: -90 },
    { label: "३", angle: -45 },
    { label: "६", angle: 0 },
    { label: "८", angle: 45 },
    { label: "७", angle: 90 },
    { label: "५", angle: 135 },
    { label: "२", angle: 180 },
    { label: "४", angle: -135 },
  ]

  digits.forEach((digit) => {
    const { x, y } = polarToCartesian({ radius: digitRadius, angle: digit.angle }, { x: center, y: center })
    shapes.push(text(x, y, digit.label, { fontSize: 26, fontWeight: "600", align: "middle", baseline: "middle", fontFamily: "'Noto Sans Devanagari', sans-serif" }))
  })

  shapes.push(text(center, center, "ॐ", { fontSize: 48, fontWeight: "700", align: "middle", baseline: "middle", fontFamily: "'Noto Sans Devanagari', sans-serif" }))

  const gridSize = board * 0.18
  const cell = gridSize / 3
  const offsets = [
    { x: -board * 0.5, y: -board * 0.5 },
    { x: board * 0.5 - gridSize, y: -board * 0.5 },
    { x: -board * 0.5, y: board * 0.5 - gridSize },
    { x: board * 0.5 - gridSize, y: board * 0.5 - gridSize },
  ]

  offsets.forEach((offset) => {
    const originX = center + offset.x
    const originY = center + offset.y
    shapes.push(rect(originX, originY, gridSize, gridSize, { stroke: "rgba(244,244,245,0.65)", strokeWidth: 1.6 }))
    for (let i = 1; i < 3; i += 1) {
      shapes.push(line(originX + cell * i, originY, originX + cell * i, originY + gridSize, { stroke: "rgba(244,244,245,0.45)", strokeWidth: 1.2 }))
      shapes.push(line(originX, originY + cell * i, originX + gridSize, originY + cell * i, { stroke: "rgba(244,244,245,0.45)", strokeWidth: 1.2 }))
    }
  })

  const tridentLength = board * 0.42
  const tridentOffset = board * 0.11

  const topY = center - tridentLength / 2 - tridentOffset
  const bottomY = center + tridentLength / 2 + tridentOffset
  const leftX = center - tridentLength / 2 - tridentOffset
  const rightX = center + tridentLength / 2 + tridentOffset

  shapes.push(line(center, topY, center, topY + tridentLength, { stroke: "rgba(248,250,252,0.7)", strokeWidth: 2.6, strokeLinecap: "round" }))
  shapes.push(line(center, bottomY, center, bottomY - tridentLength, { stroke: "rgba(248,250,252,0.7)", strokeWidth: 2.6, strokeLinecap: "round" }))
  shapes.push(line(leftX, center, leftX + tridentLength, center, { stroke: "rgba(248,250,252,0.7)", strokeWidth: 2.6, strokeLinecap: "round" }))
  shapes.push(line(rightX, center, rightX - tridentLength, center, { stroke: "rgba(248,250,252,0.7)", strokeWidth: 2.6, strokeLinecap: "round" }))

  const prong = board * 0.12

  shapes.push(line(center, topY, center - prong, topY + prong, { stroke: "rgba(248,250,252,0.7)", strokeWidth: 2 }))
  shapes.push(line(center, topY, center + prong, topY + prong, { stroke: "rgba(248,250,252,0.7)", strokeWidth: 2 }))
  shapes.push(line(center, bottomY, center - prong, bottomY - prong, { stroke: "rgba(248,250,252,0.7)", strokeWidth: 2 }))
  shapes.push(line(center, bottomY, center + prong, bottomY - prong, { stroke: "rgba(248,250,252,0.7)", strokeWidth: 2 }))
  shapes.push(line(leftX, center, leftX + prong, center - prong, { stroke: "rgba(248,250,252,0.7)", strokeWidth: 2 }))
  shapes.push(line(leftX, center, leftX + prong, center + prong, { stroke: "rgba(248,250,252,0.7)", strokeWidth: 2 }))
  shapes.push(line(rightX, center, rightX - prong, center - prong, { stroke: "rgba(248,250,252,0.7)", strokeWidth: 2 }))
  shapes.push(line(rightX, center, rightX - prong, center + prong, { stroke: "rgba(248,250,252,0.7)", strokeWidth: 2 }))

  return shapes
}

function buildArchitectMandala(context: VirmanaPatternContext): VirmanaBackdropShape[] {
  const { center } = context
  const outer = center - 42
  const mid = outer * 0.78
  const inner = outer * 0.56
  const core = inner * 0.62
  const shapes: VirmanaBackdropShape[] = []

  shapes.push(circle(center, center, outer, { stroke: "rgba(234,179,8,0.5)", strokeWidth: 2.6 }))
  shapes.push(polygon(squarePoints(center, outer * 1.35, 45), { stroke: "rgba(250,204,21,0.35)", strokeWidth: 1.8 }))
  shapes.push(polygon(squarePoints(center, outer * 1.05), { stroke: "rgba(253,224,71,0.45)", strokeWidth: 1.9 }))
  shapes.push(polygon(squarePoints(center, mid, 45), { stroke: "rgba(250,250,210,0.55)", strokeWidth: 1.8 }))
  shapes.push(polygon(squarePoints(center, inner), { stroke: "rgba(254,240,138,0.65)", strokeWidth: 1.7 }))
  shapes.push(polygon(squarePoints(center, inner * 0.82, 45), { stroke: "rgba(254,240,138,0.45)", strokeWidth: 1.4 }))
  shapes.push(circle(center, center, core * 0.7, { stroke: "rgba(250,250,250,0.5)", strokeWidth: 1.6 }))

  const spokes = 24
  for (let index = 0; index < spokes; index += 1) {
    const angle = index * (360 / spokes)
    const outerPoint = polarToCartesian({ radius: inner * 0.95, angle }, { x: center, y: center })
    const innerPoint = polarToCartesian({ radius: core * 0.55, angle }, { x: center, y: center })
    shapes.push(line(innerPoint.x, innerPoint.y, outerPoint.x, outerPoint.y, { stroke: "rgba(253,224,71,0.4)", strokeWidth: 1.35 }))
  }

  const starPoints = regularPolygon(center, inner * 0.68, 12)
  shapes.push(polygon(starPoints, { stroke: "rgba(252,211,77,0.5)", strokeWidth: 1.4 }))

  const tickCount = 36
  const tickRadius = inner * 1.12
  const tickLength = 12
  for (let index = 0; index < tickCount; index += 1) {
    const angle = index * (360 / tickCount)
    const start = polarToCartesian({ radius: tickRadius - tickLength, angle }, { x: center, y: center })
    const end = polarToCartesian({ radius: tickRadius, angle }, { x: center, y: center })
    shapes.push(line(start.x, start.y, end.x, end.y, { stroke: "rgba(234,179,8,0.35)", strokeWidth: 1.1 }))
  }

  const squarePointsSet = squarePoints(center, core, 45)
  shapes.push(polygon(squarePointsSet, { stroke: "rgba(255,255,255,0.55)", strokeWidth: 1.4 }))
  shapes.push(circle(center, center, core * 0.5, { stroke: "rgba(255,255,255,0.45)", strokeWidth: 1.2 }))

  const anchorRadius = core * 0.68
  for (let index = 0; index < 4; index += 1) {
    const angle = index * 90 - 45
    const { x, y } = polarToCartesian({ radius: anchorRadius, angle }, { x: center, y: center })
    shapes.push(rect(x - 6, y - 6, 12, 12, { fill: "rgba(253,224,71,0.75)", stroke: "rgba(250,250,250,0.6)", strokeWidth: 1 }))
  }

  return shapes
}

const navDurgaCells = [
  { row: 0, col: 0, number: "EIGHT", title: "Mahagori" },
  { row: 0, col: 1, number: "ONE", title: "Shelputri" },
  { row: 0, col: 2, number: "SIX", title: "Katyayani" },
  { row: 1, col: 0, number: "THREE", title: "Chandraghanta" },
  { row: 1, col: 1, number: "FIVE", title: "Skandamata" },
  { row: 1, col: 2, number: "SEVEN", title: "Kalaratri" },
  { row: 2, col: 0, number: "FOUR", title: "Kushmanda" },
  { row: 2, col: 1, number: "NINE", title: "Siddhidatri" },
  { row: 2, col: 2, number: "TWO", title: "Brahmacharini" },
]

function buildNavDurgaGrid(context: VirmanaPatternContext): VirmanaBackdropShape[] {
  const { center } = context
  const board = VIRMANA_CANVAS_SIZE * 0.55
  const cell = board / 3
  const originX = center - board / 2
  const originY = center - board / 2
  const shapes: VirmanaBackdropShape[] = []

  shapes.push(rect(originX - 12, originY - 12, board + 24, board + 24, { stroke: "rgba(226,232,240,0.35)", strokeWidth: 2.2, fill: "rgba(15,15,19,0.55)" }))
  shapes.push(rect(originX, originY, board, board, { stroke: "rgba(241,245,249,0.65)", strokeWidth: 2.2 }))

  for (let index = 1; index < 3; index += 1) {
    const offset = cell * index
    shapes.push(line(originX + offset, originY, originX + offset, originY + board, { stroke: "rgba(148,163,184,0.35)", strokeWidth: 1.4 }))
    shapes.push(line(originX, originY + offset, originX + board, originY + offset, { stroke: "rgba(148,163,184,0.35)", strokeWidth: 1.4 }))
  }

  navDurgaCells.forEach((cellDef) => {
    const cx = originX + cell * cellDef.col + cell / 2
    const cy = originY + cell * cellDef.row + cell / 2
    shapes.push(text(cx, cy - 12, cellDef.number, { align: "middle", baseline: "middle", fontSize: 15, fontWeight: "600", letterSpacing: 0.8 }))
    shapes.push(text(cx, cy + 14, cellDef.title, { align: "middle", baseline: "middle", fontSize: 13, opacity: 0.9 }))
  })

  return shapes
}

interface GridPattern {
  name: string
  numbers: number[][]
}

const navagrahaGrids: GridPattern[] = [
  {
    name: "JUPITER",
    numbers: [
      [10, 5, 11, 8],
      [7, 9, 6, 12],
      [13, 16, 14, 15],
      [4, 3, 1, 2],
    ],
  },
  {
    name: "MOON",
    numbers: [
      [7, 2, 9, 6],
      [13, 8, 11, 4],
      [10, 15, 12, 5],
      [3, 14, 1, 16],
    ],
  },
  {
    name: "MARS",
    numbers: [
      [8, 3, 10, 5],
      [11, 6, 13, 4],
      [14, 9, 16, 7],
      [1, 12, 2, 15],
    ],
  },
  {
    name: "MERCURY",
    numbers: [
      [9, 4, 11, 6],
      [12, 7, 14, 5],
      [15, 10, 16, 8],
      [2, 13, 3, 1],
    ],
  },
  {
    name: "SUN",
    numbers: [
      [6, 1, 8, 3],
      [11, 16, 9, 14],
      [10, 15, 12, 5],
      [7, 4, 13, 2],
    ],
  },
  {
    name: "VENUS",
    numbers: [
      [8, 3, 12, 5],
      [11, 6, 15, 2],
      [10, 7, 14, 1],
      [13, 4, 9, 16],
    ],
  },
  {
    name: "SATURN",
    numbers: [
      [12, 7, 14, 9],
      [1, 10, 3, 16],
      [8, 15, 6, 13],
      [5, 4, 11, 2],
    ],
  },
  {
    name: "RAHU",
    numbers: [
      [7, 2, 13, 4],
      [10, 15, 6, 11],
      [9, 14, 5, 12],
      [8, 3, 16, 1],
    ],
  },
  {
    name: "KETU",
    numbers: [
      [6, 11, 8, 13],
      [1, 16, 3, 14],
      [10, 5, 12, 7],
      [15, 4, 9, 2],
    ],
  },
]

function buildNavagraha(context: VirmanaPatternContext): VirmanaBackdropShape[] {
  const { center } = context
  const gridSize = VIRMANA_CANVAS_SIZE * 0.22
  const cell = gridSize / 4
  const gap = 24
  const totalWidth = gridSize * 3 + gap * 2
  const startX = center - totalWidth / 2
  const startY = center - totalWidth / 2
  const shapes: VirmanaBackdropShape[] = []

  navagrahaGrids.forEach((grid, index) => {
    const col = index % 3
    const row = Math.floor(index / 3)
    const originX = startX + col * (gridSize + gap)
    const originY = startY + row * (gridSize + gap)
    shapes.push(rect(originX, originY, gridSize, gridSize, { stroke: "rgba(226,232,240,0.4)", strokeWidth: 1.8, fill: "rgba(12,15,20,0.65)", rx: 10, ry: 10 }))

    for (let step = 1; step < 4; step += 1) {
      shapes.push(line(originX + cell * step, originY, originX + cell * step, originY + gridSize, { stroke: "rgba(148,163,184,0.35)", strokeWidth: 1.1 }))
      shapes.push(line(originX, originY + cell * step, originX + gridSize, originY + cell * step, { stroke: "rgba(148,163,184,0.35)", strokeWidth: 1.1 }))
    }

    grid.numbers.forEach((rowValues, rowIndex) => {
      rowValues.forEach((value, colIndex) => {
        const cx = originX + cell * colIndex + cell / 2
        const cy = originY + cell * rowIndex + cell / 2
        shapes.push(text(cx, cy, String(value), { align: "middle", baseline: "middle", fontSize: 14, fontWeight: "600" }))
      })
    })

    shapes.push(text(originX + gridSize / 2, originY + gridSize + 20, grid.name, { align: "middle", baseline: "hanging", fontSize: 13, opacity: 0.85, letterSpacing: 0.6 }))
  })

  return shapes
}

const weaveBase = [
  [0, 1, 2, 1, 0, 3, 0, 1],
  [1, 2, 3, 2, 1, 2, 1, 2],
  [2, 3, 0, 3, 2, 1, 2, 3],
  [1, 2, 3, 2, 1, 2, 1, 2],
  [0, 1, 2, 1, 0, 3, 0, 1],
  [3, 2, 1, 2, 3, 0, 3, 2],
  [0, 1, 2, 1, 0, 3, 0, 1],
  [1, 2, 3, 2, 1, 2, 1, 2],
]

const weavePalette = ["#0f0f16", "#ef4444", "#facc15", "#2563eb"]

function buildColorWeave(context: VirmanaPatternContext): VirmanaBackdropShape[] {
  const { center } = context
  const baseSize = weaveBase.length
  const cells = baseSize * 2
  const gridSize = VIRMANA_CANVAS_SIZE * 0.56
  const cell = gridSize / cells
  const originX = center - gridSize / 2
  const originY = center - gridSize / 2
  const shapes: VirmanaBackdropShape[] = []

  shapes.push(rect(originX - 12, originY - 12, gridSize + 24, gridSize + 24, { stroke: "rgba(255,255,255,0.15)", strokeWidth: 2, fill: "rgba(15,15,19,0.65)" }))

  for (let row = 0; row < cells; row += 1) {
    const mirroredRow = row < baseSize ? row : baseSize * 2 - 1 - row
    for (let col = 0; col < cells; col += 1) {
      const mirroredCol = col < baseSize ? col : baseSize * 2 - 1 - col
      const colorIndex = weaveBase[mirroredRow][mirroredCol]
      const fillColor = weavePalette[colorIndex]
      const x = originX + col * cell
      const y = originY + row * cell
      shapes.push(rect(x, y, cell, cell, { fill: fillColor, stroke: "rgba(15,15,19,0.2)", strokeWidth: 0.6 }))
    }
  }

  shapes.push(rect(originX, originY, gridSize, gridSize, { stroke: "rgba(244,63,94,0.8)", strokeWidth: 2.4 }))

  return shapes
}

export const VIRMANA_PATTERNS: VirmanaPattern[] = [
  {
    id: "flower-of-life",
    label: "Flower of Life lattice",
    description: "Nineteen interlocking petals mapped to a classical Flower of Life grid for harmonic rune spacing.",
    defaults: {
      rings: 3,
      spokes: 12,
      rotation: 0,
      deduplicate: true,
      traceSequence: true,
      weaveRings: true,
      mirror: true,
      axis: false,
    },
    showGrid: false,
    accent: "#38bdf8",
    build: buildFlowerOfLife,
  },
  {
    id: "metatrons-cube",
    label: "Metatron cube",
    description: "Hexahedral light frame weaving seven circles and star tetrahedron lines for transport harmonics.",
    defaults: {
      rings: 4,
      spokes: 12,
      rotation: 0,
      deduplicate: true,
      traceSequence: true,
      weaveRings: true,
      mirror: true,
      axis: true,
    },
    showGrid: false,
    accent: "#60a5fa",
    build: buildMetatronCube,
  },
  {
    id: "trident-yantra",
    label: "Trident yantra",
    description: "Square mandala with trishula sentries and devanagari digits guarding an Om core.",
    defaults: {
      rings: 3,
      spokes: 8,
      rotation: 0,
      deduplicate: true,
      traceSequence: true,
      weaveRings: false,
      mirror: false,
      axis: true,
    },
    showGrid: false,
    accent: "#f8fafc",
    build: buildTridentYantra,
  },
  {
    id: "architect-mandala",
    label: "Architect mandala",
    description: "Nested squares, rotated diamonds, and solar ticks referencing blueprint yantras.",
    defaults: {
      rings: 4,
      spokes: 16,
      rotation: 0,
      deduplicate: true,
      traceSequence: true,
      weaveRings: true,
      mirror: true,
      axis: false,
    },
    showGrid: false,
    accent: "#facc15",
    build: buildArchitectMandala,
  },
  {
    id: "nav-durga-grid",
    label: "Nav Durga grid",
    description: "Nine goddess squares translating syllables into Nav Durga focus points.",
    defaults: {
      rings: 3,
      spokes: 9,
      rotation: 0,
      deduplicate: false,
      traceSequence: false,
      weaveRings: false,
      mirror: false,
      axis: false,
    },
    showGrid: false,
    accent: "#facc15",
    build: buildNavDurgaGrid,
  },
  {
    id: "navagraha-squares",
    label: "Navagraha squares",
    description: "Planetary magic squares for the nine grahas with embedded 4×4 charge matrices.",
    defaults: {
      rings: 4,
      spokes: 12,
      rotation: 0,
      deduplicate: true,
      traceSequence: true,
      weaveRings: false,
      mirror: true,
      axis: false,
    },
    showGrid: false,
    accent: "#93c5fd",
    build: buildNavagraha,
  },
  {
    id: "color-weave",
    label: "Rangoli weave",
    description: "Symmetric rangoli mosaic inspired by temple floor bindings for energy balancing.",
    defaults: {
      rings: 4,
      spokes: 16,
      rotation: 0,
      deduplicate: false,
      traceSequence: true,
      weaveRings: true,
      mirror: true,
      axis: false,
    },
    showGrid: false,
    accent: "#ef4444",
    build: buildColorWeave,
  },
]


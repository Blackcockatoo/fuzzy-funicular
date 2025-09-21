import type { RuneDef } from "@/lib/data/runes"
import { polarToCartesian } from "@/lib/glyph/mandala"
import { renderRune } from "@/lib/glyph/render"

export const VIRMANA_CANVAS_SIZE = 640

export interface VirmanaPlacement {
  rune: RuneDef
  angle: number
  radius: number
  ringIndex: number
  spokeIndex: number
}

export interface VirmanaOptions {
  rings: number
  spokes: number
  rotation: number
}

export interface VirmanaConnectionOptions {
  traceSequence: boolean
  weaveRings: boolean
  mirror: boolean
  axis: boolean
}

export interface VirmanaPoint {
  x: number
  y: number
}

interface BackdropBase {
  stroke?: string
  fill?: string
  strokeWidth?: number
  opacity?: number
  dashArray?: string
  strokeLinecap?: "round" | "square" | "butt"
}

export interface VirmanaBackdropCircle extends BackdropBase {
  type: "circle"
  cx: number
  cy: number
  r: number
}

export interface VirmanaBackdropLine extends BackdropBase {
  type: "line"
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface VirmanaBackdropPolygon extends BackdropBase {
  type: "polygon"
  points: VirmanaPoint[]
}

export interface VirmanaBackdropRect extends BackdropBase {
  type: "rect"
  x: number
  y: number
  width: number
  height: number
  rx?: number
  ry?: number
}

export interface VirmanaBackdropPath extends BackdropBase {
  type: "path"
  d: string
}

export interface VirmanaBackdropText {
  type: "text"
  x: number
  y: number
  text: string
  fill?: string
  opacity?: number
  fontSize?: number
  fontWeight?: string
  letterSpacing?: number
  align?: "start" | "middle" | "end"
  baseline?: "hanging" | "middle" | "baseline" | "alphabetic"
  fontFamily?: string
}

export type VirmanaBackdropShape =
  | VirmanaBackdropCircle
  | VirmanaBackdropLine
  | VirmanaBackdropPolygon
  | VirmanaBackdropRect
  | VirmanaBackdropPath
  | VirmanaBackdropText

export interface VirmanaSvgConfig {
  canvas?: number
  backdrop?: VirmanaBackdropShape[]
  includeGrid?: boolean
}

export interface CartesianPoint {
  x: number
  y: number
}

export interface VirmanaLayout {
  placements: VirmanaPlacement[]
  center: number
}

export type VirmanaConnection = {
  start: CartesianPoint
  end: CartesianPoint
}

function clampOptions(options: VirmanaOptions): VirmanaOptions {
  return {
    rings: Math.max(1, Math.min(5, Math.round(options.rings))),
    spokes: Math.max(3, Math.round(options.spokes)),
    rotation: ((options.rotation % 360) + 360) % 360,
  }
}

export function computeRingRadii(rings: number, canvas: number = VIRMANA_CANVAS_SIZE) {
  const center = canvas / 2
  if (rings <= 0) {
    return []
  }
  const maxRadius = center - 56
  const step = maxRadius / rings
  return Array.from({ length: rings }, (_, index) => +(step * (index + 1)).toFixed(2))
}

interface Spot {
  angle: number
  radius: number
  ringIndex: number
  spokeIndex: number
}

function generateSpots(options: VirmanaOptions, canvas: number = VIRMANA_CANVAS_SIZE): Spot[] {
  const { rings, spokes, rotation } = clampOptions(options)
  const radii = computeRingRadii(rings, canvas)
  const angleStep = 360 / spokes
  const angles = Array.from({ length: spokes }, (_, index) => rotation + index * angleStep)
  const spots: Spot[] = []

  radii.forEach((radius, ringIndex) => {
    angles.forEach((angle, spokeIndex) => {
      spots.push({ angle: +angle.toFixed(2), radius, ringIndex, spokeIndex })
    })
  })

  return spots
}

export function buildPlacements(
  runes: RuneDef[],
  options: VirmanaOptions,
  canvas: number = VIRMANA_CANVAS_SIZE,
): VirmanaLayout {
  const spots = generateSpots(options, canvas)
  const center = canvas / 2
  if (runes.length === 0) {
    return { placements: [], center }
  }

  if (spots.length === 0) {
    throw new Error("Virmana requires at least one ring and one spoke")
  }

  const placements: VirmanaPlacement[] = []

  if (runes.length <= spots.length) {
    const available = [...spots]
    runes.forEach((rune, index) => {
      const pickIndex = (rune.numericMap + index) % available.length
      const [spot] = available.splice(pickIndex, 1)
      placements.push({ rune, ...spot })
    })
  } else {
    runes.forEach((rune, index) => {
      const spot = spots[(rune.numericMap + index) % spots.length]
      placements.push({ rune, ...spot })
    })
  }

  return { placements, center }
}

function mirrorPoint(point: CartesianPoint, center: number): CartesianPoint {
  return { x: +(center * 2 - point.x).toFixed(2), y: point.y }
}

export function computeConnections(
  layout: VirmanaLayout,
  options: VirmanaConnectionOptions,
): VirmanaConnection[] {
  const { placements, center } = layout
  if (placements.length === 0) {
    return []
  }

  const points = placements.map((placement) =>
    polarToCartesian({ radius: placement.radius, angle: placement.angle }, { x: center, y: center }),
  )

  const lines: VirmanaConnection[] = []

  if (options.traceSequence && placements.length > 1) {
    for (let index = 0; index < placements.length; index += 1) {
      const start = points[index]
      const end = points[(index + 1) % placements.length]
      lines.push({ start, end })
    }
  }

  if (options.weaveRings) {
    const byRing = new Map<number, { point: CartesianPoint; angle: number }[]>()
    placements.forEach((placement, index) => {
      const bucket = byRing.get(placement.ringIndex) ?? []
      bucket.push({ point: points[index], angle: placement.angle })
      byRing.set(placement.ringIndex, bucket)
    })
    byRing.forEach((bucket) => {
      if (bucket.length < 2) return
      const sorted = bucket.sort((a, b) => a.angle - b.angle)
      for (let index = 0; index < sorted.length; index += 1) {
        const start = sorted[index].point
        const end = sorted[(index + 1) % sorted.length].point
        lines.push({ start, end })
      }
    })
  }

  if (options.axis) {
    points.forEach((point) => {
      lines.push({ start: point, end: { x: center, y: center } })
    })
  }

  if (options.mirror) {
    const mirrored = lines.map((line) => ({
      start: mirrorPoint(line.start, center),
      end: mirrorPoint(line.end, center),
    }))
    return [...lines, ...mirrored]
  }

  return lines
}

function renderCommonAttributes(shape: BackdropBase) {
  const stroke = shape.stroke ? ` stroke="${shape.stroke}"` : ""
  const fill = shape.fill ? ` fill="${shape.fill}"` : " fill="none"`
  const strokeWidth = shape.strokeWidth ? ` stroke-width="${shape.strokeWidth}"` : ""
  const opacity = typeof shape.opacity === "number" ? ` opacity="${shape.opacity}"` : ""
  const dashArray = shape.dashArray ? ` stroke-dasharray="${shape.dashArray}"` : ""
  const linecap = shape.strokeLinecap ? ` stroke-linecap="${shape.strokeLinecap}"` : ""
  return `${stroke}${fill}${strokeWidth}${opacity}${dashArray}${linecap}`
}

function escapeText(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function pointListToString(points: VirmanaPoint[]) {
  return points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ")
}

function convertBackdropToSvg(shapes: VirmanaBackdropShape[]): string {
  return shapes
    .map((shape) => {
      switch (shape.type) {
        case "circle":
          return `<circle cx="${shape.cx.toFixed(2)}" cy="${shape.cy.toFixed(2)}" r="${shape.r.toFixed(2)}"${renderCommonAttributes(shape)} />`
        case "line":
          return `<line x1="${shape.x1.toFixed(2)}" y1="${shape.y1.toFixed(2)}" x2="${shape.x2.toFixed(2)}" y2="${shape.y2.toFixed(2)}"${renderCommonAttributes(shape)} />`
        case "polygon":
          return `<polygon points="${pointListToString(shape.points)}"${renderCommonAttributes(shape)} />`
        case "rect": {
          const rx = shape.rx ? ` rx="${shape.rx.toFixed(2)}"` : ""
          const ry = shape.ry ? ` ry="${shape.ry.toFixed(2)}"` : ""
          return `<rect x="${shape.x.toFixed(2)}" y="${shape.y.toFixed(2)}" width="${shape.width.toFixed(2)}" height="${shape.height.toFixed(2)}"${rx}${ry}${renderCommonAttributes(shape)} />`
        }
        case "path":
          return `<path d="${shape.d}"${renderCommonAttributes(shape)} />`
        case "text": {
          const fill = shape.fill ? ` fill="${shape.fill}"` : " fill="rgba(226,232,240,0.85)"`
          const opacity = typeof shape.opacity === "number" ? ` opacity="${shape.opacity}"` : ""
          const fontSize = shape.fontSize ? ` font-size="${shape.fontSize}"` : ""
          const fontWeight = shape.fontWeight ? ` font-weight="${shape.fontWeight}"` : ""
          const letterSpacing = typeof shape.letterSpacing === "number" ? ` letter-spacing="${shape.letterSpacing}"` : ""
          const textAnchor = shape.align ? ` text-anchor="${shape.align}"` : ""
          const baseline = shape.baseline ? ` dominant-baseline="${shape.baseline}"` : ""
          const fontFamily = shape.fontFamily ? ` font-family="${shape.fontFamily}"` : ""
          return `<text x="${shape.x.toFixed(2)}" y="${shape.y.toFixed(2)}"${fill}${opacity}${fontSize}${fontWeight}${letterSpacing}${textAnchor}${baseline}${fontFamily}>${escapeText(shape.text)}</text>`
        }
        default:
          return ""
      }
    })
    .join("\n")
}

export function buildVirmanaSvg(
  layout: VirmanaLayout,
  options: VirmanaOptions,
  connections: VirmanaConnection[],
  config: VirmanaSvgConfig = {},
): string {
  const canvas = config.canvas ?? VIRMANA_CANVAS_SIZE
  const center = canvas / 2
  const runes = layout.placements
  const includeGrid = config.includeGrid ?? true

  const circles = includeGrid
    ? computeRingRadii(options.rings, canvas)
        .map(
          (radius) =>
            `<circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="rgba(148,163,184,0.28)" stroke-dasharray="14 12" />`,
        )
        .join("\n")
    : ""

  const angleStep = 360 / Math.max(1, options.spokes)
  const spokes = includeGrid
    ? Array.from({ length: options.spokes }, (_, index) => options.rotation + index * angleStep)
        .map((angle) => {
          const { x, y } = polarToCartesian({ radius: center - 40, angle }, { x: center, y: center })
          return `<line x1="${center}" y1="${center}" x2="${x}" y2="${y}" stroke="rgba(148,163,184,0.24)" stroke-dasharray="12 10" />`
        })
        .join("\n")
    : ""

  const connectionLines = connections
    .map((connection) =>
      `<line x1="${connection.start.x}" y1="${connection.start.y}" x2="${connection.end.x}" y2="${connection.end.y}" stroke="#38bdf8" stroke-width="6" stroke-linecap="round" stroke-opacity="0.65" />`,
    )
    .join("\n")

  const backdrop = config.backdrop ? convertBackdropToSvg(config.backdrop) : ""

  const runeGroups = runes
    .map((placement) => {
      const { x, y } = polarToCartesian({ radius: placement.radius, angle: placement.angle }, { x: center, y: center })
      const svg = layoutPlacementsRune(placement.rune)
      const offsetX = x - 60
      const offsetY = y - 60
      return `<g transform="translate(${offsetX},${offsetY})">${svg}</g>`
    })
    .join("\n")

  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvas} ${canvas}" width="${canvas}" height="${canvas}" role="img">\n<rect x="0" y="0" width="${canvas}" height="${canvas}" fill="rgb(15,15,19)" />\n${backdrop}\n${circles}\n${spokes}\n${connectionLines}\n${runeGroups}\n</svg>`
}

function layoutPlacementsRune(rune: RuneDef) {
  const svg = renderRune(rune, { size: 120, strokeWidth: 10, strokeColor: "#f8fafc" })
  const match = svg.match(/<g[\s\S]*<\/g>/)
  return match ? match[0] : svg
}

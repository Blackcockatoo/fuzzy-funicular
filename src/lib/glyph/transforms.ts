import { deriveAngle } from "@/lib/glyph/angles"
import type { Stroke } from "@/lib/data/runes"

export type Rotation = 0 | 90 | 180 | 270

interface TransformOptions {
  size?: number
  center?: { x: number; y: number }
}

const DEFAULT_CENTER = { x: 50, y: 50 }

function resolveCenter(options?: TransformOptions) {
  if (options?.center) return options.center
  if (options?.size !== undefined) {
    const half = options.size / 2
    return { x: half, y: half }
  }
  return DEFAULT_CENTER
}

export function rotatePoint(x: number, y: number, angle: Rotation, options?: TransformOptions) {
  const { x: cx, y: cy } = resolveCenter(options)
  const radians = (angle * Math.PI) / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  const tx = x - cx
  const ty = y - cy
  const rx = tx * cos - ty * sin
  const ry = tx * sin + ty * cos
  return { x: +(rx + cx).toFixed(4), y: +(ry + cy).toFixed(4) }
}

export function rotateStroke(stroke: Stroke, angle: Rotation, options?: TransformOptions): Stroke {
  const start = rotatePoint(stroke.x1, stroke.y1, angle, options)
  const end = rotatePoint(stroke.x2, stroke.y2, angle, options)
  const base = { x1: start.x, y1: start.y, x2: end.x, y2: end.y }
  return { ...stroke, ...base, angle: deriveAngle(base) }
}

export function mirrorStrokeX(stroke: Stroke, options?: TransformOptions): Stroke {
  const { x: cx } = resolveCenter(options)
  const mirror = (value: number) => +(2 * cx - value).toFixed(4)
  const base = {
    x1: mirror(stroke.x1),
    y1: stroke.y1,
    x2: mirror(stroke.x2),
    y2: stroke.y2,
  }
  return { ...stroke, ...base, angle: deriveAngle(base) }
}

export function applyTransforms(
  strokes: Stroke[],
  transforms: { rotate?: Rotation; mirrorX?: boolean },
  options?: TransformOptions,
): Stroke[] {
  return strokes.map((stroke) => {
    let transformed = { ...stroke }
    if (transforms.rotate !== undefined) {
      transformed = rotateStroke(transformed, transforms.rotate, options)
    }
    if (transforms.mirrorX) {
      transformed = mirrorStrokeX(transformed, options)
    }
    return transformed
  })
}

import type { Stroke } from "@/lib/data/runes"

const EPSILON = 1e-6

export type ChiselAngle = 0 | 45 | 90

export function deriveAngle(stroke: { x1: number; y1: number; x2: number; y2: number }): ChiselAngle {
  const dx = stroke.x2 - stroke.x1
  const dy = stroke.y2 - stroke.y1
  if (Math.abs(dx) < EPSILON && Math.abs(dy) < EPSILON) {
    throw new Error("Stroke cannot have zero length")
  }
  if (Math.abs(dy) < EPSILON) {
    return 0
  }
  if (Math.abs(dx) < EPSILON) {
    return 90
  }
  if (Math.abs(Math.abs(dx) - Math.abs(dy)) < EPSILON) {
    return 45
  }
  throw new Error(`Illegal stroke angle dx=${dx} dy=${dy}`)
}

export function isChiselStroke(stroke: Stroke): boolean {
  try {
    const angle = deriveAngle(stroke)
    return angle === stroke.angle
  } catch (error) {
    return false
  }
}

export function normalizeStroke(stroke: Stroke): Stroke {
  const angle = deriveAngle(stroke)
  return { ...stroke, angle }
}

export function assertChiselStrokes(strokes: Stroke[]): void {
  strokes.forEach((stroke) => {
    const angle = deriveAngle(stroke)
    if (angle !== stroke.angle) {
      throw new Error(`Stroke angle mismatch: expected ${angle} but received ${stroke.angle}`)
    }
  })
}

export function snapAngle(angle: number): number {
  const normalized = ((angle % 360) + 360) % 360
  const snapped = Math.round(normalized / 45) * 45
  return ((snapped % 360) + 360) % 360
}

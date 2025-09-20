import { describe, expect, it } from "vitest"

import type { Stroke } from "@/lib/data/runes"
import { applyTransforms, mirrorStrokeX, rotatePoint, rotateStroke } from "@/lib/glyph/transforms"

const baseStroke: Stroke = { x1: 10, y1: 10, x2: 10, y2: 50, angle: 90 }

describe("transforms", () => {
  it("rotates strokes around the center", () => {
    const rotated = rotateStroke(baseStroke, 90)
    expect(rotated.x1).toBeCloseTo(90)
    expect(rotated.y1).toBeCloseTo(10)
    expect(rotated.angle).toBe(0)
  })

  it("mirrors strokes across the vertical axis", () => {
    const mirrored = mirrorStrokeX(baseStroke)
    expect(mirrored.x1).toBe(90)
    expect(mirrored.x2).toBe(90)
    expect(mirrored.angle).toBe(90)
  })

  it("keeps length invariant under rotation and mirror", () => {
    const rotated = applyTransforms([baseStroke], { rotate: 90, mirrorX: true })[0]
    const lengthBefore = Math.hypot(baseStroke.x2 - baseStroke.x1, baseStroke.y2 - baseStroke.y1)
    const lengthAfter = Math.hypot(rotated.x2 - rotated.x1, rotated.y2 - rotated.y1)
    expect(lengthAfter).toBeCloseTo(lengthBefore)
  })

  it("rotates arbitrary point correctly", () => {
    const point = rotatePoint(10, 50, 180)
    expect(point.x).toBeCloseTo(90)
    expect(point.y).toBeCloseTo(50)
  })
})

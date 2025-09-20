import { describe, expect, it } from "vitest"

import { deriveAngle } from "@/lib/glyph/angles"

describe("deriveAngle", () => {
  it("returns 0 for horizontal strokes", () => {
    expect(deriveAngle({ x1: 0, y1: 10, x2: 20, y2: 10 })).toBe(0)
  })

  it("returns 90 for vertical strokes", () => {
    expect(deriveAngle({ x1: 10, y1: 0, x2: 10, y2: 20 })).toBe(90)
  })

  it("returns 45 for diagonals", () => {
    expect(deriveAngle({ x1: 0, y1: 0, x2: 20, y2: 20 })).toBe(45)
    expect(deriveAngle({ x1: 20, y1: 0, x2: 0, y2: 20 })).toBe(45)
  })

  it("throws for illegal angles", () => {
    expect(() => deriveAngle({ x1: 0, y1: 0, x2: 10, y2: 13 })).toThrow(/Illegal stroke angle/)
  })
})

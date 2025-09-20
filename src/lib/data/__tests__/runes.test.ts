import { describe, expect, it } from "vitest"

import { RUNES, findRuneByLatin } from "@/lib/data/runes"

describe("rune dataset", () => {
  it("includes all letters and specials", () => {
    const latinSet = new Set(RUNES.map((rune) => rune.latin))
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ—⟦⟧◇".split("").forEach((symbol) => {
      expect(latinSet.has(symbol)).toBe(true)
    })
  })

  it("sums gematria correctly", () => {
    const word = "CAB"
    const total = word
      .split("")
      .map((letter) => findRuneByLatin(letter)?.numericMap ?? 0)
      .reduce((acc, value) => acc + value, 0)
    expect(total).toBe(1 + 3 + 2)
  })

  it("respects modifier slots and hooks", () => {
    const rune = findRuneByLatin("O")
    expect(rune?.modifierSlots).toEqual(["all"])
    expect(rune?.sequenceHooks.length).toBeGreaterThan(0)
  })
})

import type { RuneDef, Stroke } from "@/lib/data/runes"
import { assertChiselStrokes, deriveAngle } from "@/lib/glyph/angles"
import { applyTransforms, type Rotation } from "@/lib/glyph/transforms"

const VIEWBOX_SIZE = 100

export interface RenderOptions {
  size?: number
  strokeWidth?: number
  variant?: {
    rotate?: Rotation
    mirrorX?: boolean
    modifiers?: string[]
  }
  strokeColor?: string
}

type ModifierFactory = (slot: string) => Stroke[]

type ModifierLibrary = Record<string, ModifierFactory>

const SLOT_ANCHORS: Record<string, { x: number; y: number }> = {
  top: { x: 50, y: 20 },
  bottom: { x: 50, y: 80 },
  left: { x: 20, y: 50 },
  right: { x: 80, y: 50 },
  center: { x: 50, y: 50 },
  all: { x: 50, y: 50 },
}

function createHook(slot: string): Stroke[] {
  const anchor = SLOT_ANCHORS[slot] ?? SLOT_ANCHORS.center
  const offset = 10
  return [
    { x1: anchor.x - offset, y1: anchor.y + offset, x2: anchor.x, y2: anchor.y, angle: 45 },
    { x1: anchor.x, y1: anchor.y, x2: anchor.x + offset, y2: anchor.y + offset, angle: 45 },
  ]
}

function createBar(slot: string): Stroke[] {
  const anchor = SLOT_ANCHORS[slot] ?? SLOT_ANCHORS.center
  if (slot === "left" || slot === "right") {
    return [
      {
        x1: anchor.x,
        y1: anchor.y - 12,
        x2: anchor.x,
        y2: anchor.y + 12,
        angle: 90,
      },
    ]
  }
  return [
    {
      x1: anchor.x - 12,
      y1: anchor.y,
      x2: anchor.x + 12,
      y2: anchor.y,
      angle: 0,
    },
  ]
}

function createBreak(slot: string): Stroke[] {
  const anchor = SLOT_ANCHORS[slot] ?? SLOT_ANCHORS.center
  const delta = 12
  return [
    {
      x1: anchor.x - delta,
      y1: anchor.y - delta,
      x2: anchor.x + delta,
      y2: anchor.y + delta,
      angle: 45,
    },
  ]
}

const MODIFIER_LIBRARY: ModifierLibrary = {
  hook: createHook,
  bar: createBar,
  break: createBreak,
}

function parseModifier(modifier: string): { name: string; slot: string } {
  const [name, slot = "center"] = modifier.split(":")
  return { name, slot }
}

function applyModifiers(rune: RuneDef, modifiers: string[] | undefined): Stroke[] {
  if (!modifiers?.length) return rune.strokes

  const additional: Stroke[] = []
  for (const modifier of modifiers) {
    const { name, slot } = parseModifier(modifier)
    if (!rune.modifierSlots.includes(slot as any) && !rune.modifierSlots.includes("all")) {
      continue
    }
    const factory = MODIFIER_LIBRARY[name]
    if (!factory) continue
    const strokes = factory(slot)
    strokes.forEach((stroke) => additional.push({ ...stroke, angle: deriveAngle(stroke) }))
  }
  return [...rune.strokes, ...additional]
}

function format(num: number) {
  return Number(num.toFixed(2))
}

export function renderRune(rune: RuneDef, options: RenderOptions = {}): string {
  const { size = 256, strokeWidth = 8, variant, strokeColor = "currentColor" } = options
  const variantStrokes = applyModifiers(rune, variant?.modifiers)
  assertChiselStrokes(variantStrokes)

  const transformed = applyTransforms(variantStrokes, {
    rotate: variant?.rotate,
    mirrorX: variant?.mirrorX,
  })

  const lines = transformed
    .map((stroke) =>
      `<line x1="${format(stroke.x1)}" y1="${format(stroke.y1)}" x2="${format(stroke.x2)}" y2="${format(stroke.y2)}" />`,
    )
    .join("")

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}" role="img" aria-label="Rune ${rune.latin}"
    >
      <g fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
        ${lines}
      </g>
    </svg>`

  return svg
}

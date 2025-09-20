export type Stroke = { x1: number; y1: number; x2: number; y2: number; angle: 0 | 45 | 90 }
export type ModifierSlot = "top" | "bottom" | "left" | "right" | "center" | "all"
export type RotationSet = 0 | 90 | 180 | 270

export interface RuneDef {
  id: string
  latin: string
  number: number
  phoneme: string[]
  baseShape: string
  strokeAngles: (0 | 45 | 90)[]
  rotationSet: RotationSet[]
  mirrorAllowed: boolean
  modifierSlots: ModifierSlot[]
  numericMap: number
  sequenceHooks: string[]
  description: string
  ligatures: string[]
  strokes: Stroke[]
  special?: "NULL" | "BIND_START" | "BIND_END" | "FRAME_DIAMOND"
}

const EPSILON = 1e-6

const columnMap: Record<string, number> = { A: 10, B: 30, C: 50, D: 70, E: 90 }
const rowMap: Record<string, number> = { "1": 10, "2": 30, "3": 50, "4": 70, "5": 90 }

function getPoint(code: string) {
  const [column, row] = [code[0], code[1]]
  const x = columnMap[column]
  const y = rowMap[row]
  if (x === undefined || y === undefined) {
    throw new Error(`Unknown grid point: ${code}`)
  }
  return { x, y }
}

function calcAngle(x1: number, y1: number, x2: number, y2: number): 0 | 45 | 90 {
  const dx = x2 - x1
  const dy = y2 - y1
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
  throw new Error(`Illegal chisel angle dx=${dx} dy=${dy}`)
}

function createStrokeFromCodes(start: string, end: string): Stroke {
  const { x: x1, y: y1 } = getPoint(start)
  const { x: x2, y: y2 } = getPoint(end)
  const angle = calcAngle(x1, y1, x2, y2)
  return { x1, y1, x2, y2, angle }
}

function collectAngles(strokes: Stroke[]): (0 | 45 | 90)[] {
  return Array.from(new Set(strokes.map((stroke) => stroke.angle)))
}

const hooks = {
  vowel: ["Blue:1", "Lukus:1"],
  pillar: ["Red:2"],
  flow: ["Black:3"],
  weave: ["Blue:2"],
  spark: ["Red:1"],
  null: ["Silence"],
  bind: ["Frame"],
}

const basePhonemes: Record<string, string[]> = {
  A: ["a", "ɑ", "æ"],
  B: ["b"],
  C: ["k", "s"],
  D: ["d", "ð"],
  E: ["e", "ɛ", "ə"],
  F: ["f"],
  G: ["g", "ɡ"],
  H: ["h"],
  I: ["i", "ɪ"],
  J: ["j", "dʒ"],
  K: ["k"],
  L: ["l"],
  M: ["m"],
  N: ["n"],
  O: ["o", "ɔ"],
  P: ["p"],
  Q: ["q", "kw"],
  R: ["r", "ɹ"],
  S: ["s", "ʃ"],
  T: ["t"],
  U: ["u", "ʊ"],
  V: ["v"],
  W: ["w"],
  X: ["ks", "gz"],
  Y: ["y", "ɪ"],
  Z: ["z"],
  "—": ["pause"],
}

const vowelSet = new Set(["A", "E", "I", "O", "U", "Y"])
const pillarSet = new Set(["H", "M", "N", "T" ])

interface RuneInit {
  latin: string
  strokes: [string, string][]
  baseShape?: string
  rotationSet?: RotationSet[]
  mirrorAllowed?: boolean
  modifierSlots?: ModifierSlot[]
  sequenceHooks?: string[]
  description: string
  ligatures?: string[]
}

function makeRune(init: RuneInit, index: number): RuneDef {
  const number = index + 1
  const strokes = init.strokes.map(([start, end]) => createStrokeFromCodes(start, end))
  const phoneme = basePhonemes[init.latin] ?? [init.latin.toLowerCase()]
  const sequenceHooks = init.sequenceHooks
    ? [...init.sequenceHooks]
    : vowelSet.has(init.latin)
      ? [...hooks.vowel]
      : pillarSet.has(init.latin)
        ? [...hooks.pillar]
        : [...hooks.weave]
  const modifierSlots = init.modifierSlots ?? ["top", "bottom", "center"]
  const rotationSet = init.rotationSet ?? ([0, 90, 180, 270] as RotationSet[])
  const baseShape =
    init.baseShape ??
    (vowelSet.has(init.latin)
      ? "Tri-truss"
      : pillarSet.has(init.latin)
        ? "Twin spine"
        : "Segment weave")

  return {
    id: `MRA-${init.latin}${number.toString().padStart(3, "0")}`,
    latin: init.latin,
    number,
    phoneme,
    baseShape,
    strokeAngles: collectAngles(strokes),
    rotationSet,
    mirrorAllowed: init.mirrorAllowed ?? true,
    modifierSlots,
    numericMap: number,
    sequenceHooks,
    description: init.description,
    ligatures: init.ligatures ?? [],
    strokes,
  }
}

const baseRunes: RuneInit[] = [
  {
    latin: "A",
    baseShape: "Tri-truss",
    strokes: [
      ["A5", "B4"],
      ["B4", "C3"],
      ["C3", "D4"],
      ["D4", "E5"],
      ["B4", "D4"],
      ["C3", "C1"],
    ],
    modifierSlots: ["top", "left", "right", "center"],
    description: "Triangular ascent with crowned spine; holds hooks at crown and both wings.",
    ligatures: ["AE", "AN"],
  },
  {
    latin: "B",
    baseShape: "Twin chambers",
    strokes: [
      ["A1", "A5"],
      ["A1", "B2"],
      ["B2", "C2"],
      ["C2", "D3"],
      ["D3", "C3"],
      ["C3", "A3"],
      ["C3", "D4"],
      ["D4", "C5"],
      ["C5", "A5"],
    ],
    modifierSlots: ["top", "center", "bottom"],
    description: "Double resonance vessel bound to a single spine; balanced chambers for breath and force.",
    sequenceHooks: ["Red:2", "Blue:1"],
    ligatures: ["BR", "BL"],
  },
  {
    latin: "C",
    baseShape: "Open arc",
    strokes: [
      ["E2", "D1"],
      ["D1", "B1"],
      ["B1", "A2"],
      ["A2", "A4"],
      ["A4", "B5"],
      ["B5", "D5"],
      ["D5", "E4"],
    ],
    modifierSlots: ["top", "bottom", "right"],
    description: "Open arc welcoming sound; favors forward hooks for softening or brightening the tone.",
    sequenceHooks: ["Blue:2", "Black:1"],
  },
  {
    latin: "D",
    baseShape: "Half mandorla",
    strokes: [
      ["A1", "A5"],
      ["A1", "B1"],
      ["B1", "C2"],
      ["C2", "D3"],
      ["D3", "C4"],
      ["C4", "B5"],
      ["B5", "A5"],
    ],
    modifierSlots: ["top", "bottom", "center"],
    description: "Resonant gate with single return stroke; sturdy base for protective binds.",
    sequenceHooks: ["Red:2", "Black:2"],
  },
  {
    latin: "E",
    baseShape: "Trident beam",
    strokes: [
      ["A1", "E1"],
      ["A1", "A5"],
      ["A3", "D3"],
      ["A5", "E5"],
    ],
    modifierSlots: ["top", "center", "bottom"],
    description: "Threefold breath rune with central balance bar; articulates vowels cleanly in script mode.",
    sequenceHooks: hooks.vowel,
  },
  {
    latin: "F",
    strokes: [
      ["A1", "E1"],
      ["A1", "A5"],
      ["A3", "D3"],
    ],
    modifierSlots: ["top", "center"],
    description: "Cantilever spine projecting eastward; lower opening invites binding overlays.",
    sequenceHooks: hooks.spark,
  },
  {
    latin: "G",
    baseShape: "Guarded spiral",
    strokes: [
      ["E2", "D1"],
      ["D1", "B1"],
      ["B1", "A2"],
      ["A2", "A4"],
      ["A4", "B5"],
      ["B5", "D5"],
      ["D5", "E4"],
      ["E4", "E3"],
      ["E3", "C3"],
      ["C3", "C4"],
    ],
    modifierSlots: ["bottom", "right", "center"],
    description: "Closed spiral with a guarded notch; keeps energy looped until released via modifiers.",
    sequenceHooks: ["Blue:2", "Red:1"],
  },
  {
    latin: "H",
    baseShape: "Bridge",
    strokes: [
      ["A1", "A5"],
      ["E1", "E5"],
      ["A3", "E3"],
    ],
    description: "Twin pillars joined by a resonant bridge; ideal for binding sequences with silence marks.",
    modifierSlots: ["top", "bottom", "center"],
    sequenceHooks: hooks.flow,
  },
  {
    latin: "I",
    baseShape: "Single spine",
    strokes: [
      ["C1", "C5"],
      ["B1", "D1"],
      ["B5", "D5"],
    ],
    modifierSlots: ["top", "bottom", "center"],
    description: "Solitary pillar rune with capped ends; stacks elegantly for numerical ladders.",
    sequenceHooks: hooks.vowel,
    ligatures: ["TI", "HI"],
  },
  {
    latin: "J",
    baseShape: "Hooked staff",
    strokes: [
      ["D1", "B1"],
      ["D1", "D4"],
      ["D4", "C5"],
      ["C5", "B5"],
    ],
    modifierSlots: ["top", "bottom"],
    description: "Descending hook capturing breath; brightens when mirrored for echo runes.",
    sequenceHooks: ["Red:1", "Blue:1"],
  },
  {
    latin: "K",
    baseShape: "Forked pillar",
    strokes: [
      ["A1", "A5"],
      ["A3", "C1"],
      ["A3", "C5"],
      ["C1", "E3"],
      ["C5", "E3"],
    ],
    modifierSlots: ["top", "bottom", "center"],
    description: "Pillar splitting into twin wings; channels decisive motion.",
    sequenceHooks: ["Red:2", "Black:2"],
  },
  {
    latin: "L",
    baseShape: "Corner",
    strokes: [
      ["A1", "A5"],
      ["A5", "E5"],
    ],
    modifierSlots: ["top", "bottom", "right"],
    description: "Grounding corner rune; binds phrases to earth when framed.",
    sequenceHooks: hooks.weave,
  },
  {
    latin: "M",
    baseShape: "Twin mountain",
    strokes: [
      ["A5", "A1"],
      ["A1", "C3"],
      ["C3", "E1"],
      ["E1", "E5"],
    ],
    modifierSlots: ["top", "bottom", "center"],
    description: "Twin peaks sharing a single heart; foundational rune for mandala mandrels.",
    sequenceHooks: hooks.pillar,
    ligatures: ["MN", "ME"],
  },
  {
    latin: "N",
    baseShape: "Lightning bridge",
    strokes: [
      ["A5", "A1"],
      ["A1", "E5"],
      ["E5", "E1"],
    ],
    modifierSlots: ["top", "bottom", "center"],
    description: "Diagonal current between anchors; powers travel charms and swift phrases.",
    sequenceHooks: hooks.pillar,
  },
  {
    latin: "O",
    baseShape: "Diamond frame",
    strokes: [
      ["C1", "E3"],
      ["E3", "C5"],
      ["C5", "A3"],
      ["A3", "C1"],
    ],
    modifierSlots: ["all"],
    description: "Balanced diamond accepting full rotations; central for mandala mode.",
    sequenceHooks: hooks.vowel,
    ligatures: ["ON", "OO"],
  },
  {
    latin: "P",
    baseShape: "Cantilever",
    strokes: [
      ["A1", "A5"],
      ["A1", "C1"],
      ["C1", "E3"],
      ["E3", "C3"],
      ["C3", "A3"],
    ],
    modifierSlots: ["top", "center"],
    description: "High chamber rune releasing downward; invites soft explosive sounds.",
    sequenceHooks: hooks.spark,
  },
  {
    latin: "Q",
    baseShape: "Diamond tail",
    strokes: [
      ["C1", "E3"],
      ["E3", "C5"],
      ["C5", "A3"],
      ["A3", "C1"],
      ["E3", "E4"],
      ["E4", "D5"],
    ],
    modifierSlots: ["right", "bottom", "center"],
    description: "Diamond frame with south-east tail; binds consonant clusters to vowels.",
    sequenceHooks: ["Blue:1", "Red:2"],
  },
  {
    latin: "R",
    baseShape: "Cantilever",
    strokes: [
      ["A1", "A5"],
      ["A1", "C1"],
      ["C1", "E3"],
      ["E3", "C3"],
      ["C3", "A3"],
      ["C3", "E5"],
    ],
    modifierSlots: ["top", "center", "bottom"],
    description: "Cantilevered spine with forward stride; expresses momentum.",
    sequenceHooks: ["Red:2", "Blue:2"],
  },
  {
    latin: "S",
    baseShape: "Serpentine",
    strokes: [
      ["D1", "B1"],
      ["B1", "A2"],
      ["A2", "B3"],
      ["B3", "D3"],
      ["D3", "E4"],
      ["E4", "D5"],
      ["D5", "B5"],
    ],
    modifierSlots: ["top", "bottom", "center"],
    description: "Sinuous path balancing two bends; a favourite for weaving charms.",
    sequenceHooks: hooks.flow,
  },
  {
    latin: "T",
    baseShape: "Hammer",
    strokes: [
      ["A1", "E1"],
      ["C1", "C5"],
    ],
    modifierSlots: ["top", "center"],
    description: "Hammer rune delivering downward force; structural keystone in script mode.",
    sequenceHooks: hooks.pillar,
  },
  {
    latin: "U",
    baseShape: "Cup",
    strokes: [
      ["A1", "A5"],
      ["E1", "E5"],
      ["A5", "E5"],
    ],
    modifierSlots: ["bottom", "left", "right"],
    description: "Open vessel capturing resonance; responds well to mirrored rotations.",
    sequenceHooks: hooks.vowel,
  },
  {
    latin: "V",
    baseShape: "Chevron",
    strokes: [
      ["A1", "B2"],
      ["B2", "C3"],
      ["C3", "C5"],
      ["C5", "D4"],
      ["D4", "E3"],
      ["E3", "E1"],
    ],
    modifierSlots: ["top", "bottom", "center"],
    description: "Descending chevron; anchors sigils focused on clarity and directness.",
    sequenceHooks: ["Red:1", "Blue:1"],
  },
  {
    latin: "W",
    baseShape: "Double chevron",
    strokes: [
      ["A1", "B2"],
      ["B2", "B4"],
      ["B4", "C5"],
      ["C5", "D4"],
      ["D4", "D2"],
      ["D2", "E1"],
    ],
    modifierSlots: ["top", "bottom", "center"],
    description: "Twin chevrons joined by inner pillars; excellent for echo runes and layered binds.",
    sequenceHooks: ["Red:1", "Blue:2"],
  },
  {
    latin: "X",
    baseShape: "Cross",
    strokes: [
      ["A1", "E5"],
      ["E1", "A5"],
    ],
    modifierSlots: ["all"],
    description: "Crossed currents in perfect balance; mirror-friendly and rotation neutral.",
    sequenceHooks: ["Black:2", "Blue:2"],
  },
  {
    latin: "Y",
    baseShape: "Forked spine",
    strokes: [
      ["A1", "C3"],
      ["E1", "C3"],
      ["C3", "C5"],
    ],
    modifierSlots: ["top", "center", "bottom"],
    description: "Forked spine descending to a single root; useful for decision sigils.",
    sequenceHooks: ["Blue:1", "Black:2"],
  },
  {
    latin: "Z",
    baseShape: "Zig",
    strokes: [
      ["A1", "E1"],
      ["E1", "D2"],
      ["D2", "C3"],
      ["C3", "B4"],
      ["B4", "A5"],
      ["A5", "E5"],
    ],
    modifierSlots: ["top", "bottom", "center"],
    description: "Zig rune of swift traversal; thrives in mirrored rotations and rapid scripts.",
    sequenceHooks: ["Red:2", "Black:1"],
  },
]

const letterRunes = baseRunes.map(makeRune)

const specialRunes: RuneDef[] = [
  {
    id: "MRA-NULL000",
    latin: "—",
    number: 0,
    phoneme: basePhonemes["—"],
    baseShape: "Silence dash",
    strokeAngles: [0],
    rotationSet: [0, 90, 180, 270],
    mirrorAllowed: true,
    modifierSlots: ["center", "all"],
    numericMap: 0,
    sequenceHooks: hooks.null,
    description: "Null rune signifying pause, recursion, or breath between sigils.",
    ligatures: [],
    strokes: [createStrokeFromCodes("B3", "D3")],
    special: "NULL",
  },
  {
    id: "MRA-BIND001",
    latin: "⟦",
    number: 27,
    phoneme: ["bind-start"],
    baseShape: "Square frame",
    strokeAngles: [0, 90],
    rotationSet: [0, 90, 180, 270],
    mirrorAllowed: false,
    modifierSlots: ["top", "bottom", "center"],
    numericMap: 27,
    sequenceHooks: hooks.bind,
    description: "Opening binder; wraps script lines inside a protective square form.",
    ligatures: [],
    strokes: [
      createStrokeFromCodes("A1", "A5"),
      createStrokeFromCodes("A1", "B1"),
      createStrokeFromCodes("A5", "B5"),
    ],
    special: "BIND_START",
  },
  {
    id: "MRA-BIND002",
    latin: "⟧",
    number: 28,
    phoneme: ["bind-end"],
    baseShape: "Square frame",
    strokeAngles: [0, 90],
    rotationSet: [0, 90, 180, 270],
    mirrorAllowed: false,
    modifierSlots: ["top", "bottom", "center"],
    numericMap: 28,
    sequenceHooks: hooks.bind,
    description: "Closing binder; seals sigils and enables diagonal breaks for unbinding.",
    ligatures: [],
    strokes: [
      createStrokeFromCodes("E1", "E5"),
      createStrokeFromCodes("D1", "E1"),
      createStrokeFromCodes("D5", "E5"),
    ],
    special: "BIND_END",
  },
  {
    id: "MRA-FRM029",
    latin: "◇",
    number: 29,
    phoneme: ["frame"],
    baseShape: "Diamond frame",
    strokeAngles: [45],
    rotationSet: [0, 90, 180, 270],
    mirrorAllowed: true,
    modifierSlots: ["all"],
    numericMap: 29,
    sequenceHooks: hooks.bind,
    description: "Diamond mandala frame; used for radial sigils and mandala bindings.",
    ligatures: [],
    strokes: [
      createStrokeFromCodes("B2", "D2"),
      createStrokeFromCodes("D2", "D4"),
      createStrokeFromCodes("D4", "B4"),
      createStrokeFromCodes("B4", "B2"),
    ],
    special: "FRAME_DIAMOND",
  },
]

export const RUNES: RuneDef[] = [...letterRunes, ...specialRunes]

export const RUNE_MAP: Record<string, RuneDef> = RUNES.reduce((acc, rune) => {
  acc[rune.latin] = rune
  return acc
}, {} as Record<string, RuneDef>)

export function findRuneByLatin(latin: string): RuneDef | undefined {
  return RUNES.find((rune) => rune.latin.toUpperCase() === latin.toUpperCase())
}

import { useEffect, useMemo, useState } from "react"
import { RotateCcw, Sparkles } from "lucide-react"

import { ExportBar } from "@/components/ExportBar"
import { RuneCanvas } from "@/components/RuneCanvas"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { RuneDef } from "@/lib/data/runes"
import { findRuneByLatin } from "@/lib/data/runes"
import {
  VIRMANA_CANVAS_SIZE,
  buildPlacements,
  buildVirmanaSvg,
  computeConnections,
  computeRingRadii,
  type VirmanaBackdropShape,
  type VirmanaConnectionOptions,
} from "@/lib/glyph/virmana"
import { VIRMANA_PATTERNS } from "@/lib/glyph/virmana-patterns"
import { polarToCartesian } from "@/lib/glyph/mandala"
import { downloadAsFile, svgToPng } from "@/lib/utils"

const SPOKE_OPTIONS = [6, 8, 10, 12, 16]
const RING_OPTIONS = [2, 3, 4]
const BASE_PATTERN = VIRMANA_PATTERNS[0]

function sanitizeText(value: string) {
  return value.toUpperCase().replace(/[^A-Z—]/g, "")
}

function uniqueById(runes: RuneDef[]): RuneDef[] {
  const seen = new Set<string>()
  return runes.filter((rune) => {
    if (seen.has(rune.id)) {
      return false
    }
    seen.add(rune.id)
    return true
  })
}

function renderBackdropShape(shape: VirmanaBackdropShape, key: string) {
  switch (shape.type) {
    case "circle":
      return (
        <circle
          key={key}
          cx={shape.cx}
          cy={shape.cy}
          r={shape.r}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          strokeDasharray={shape.dashArray}
          strokeLinecap={shape.strokeLinecap}
          fill={shape.fill ?? "none"}
          opacity={shape.opacity}
        />
      )
    case "line":
      return (
        <line
          key={key}
          x1={shape.x1}
          y1={shape.y1}
          x2={shape.x2}
          y2={shape.y2}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          strokeDasharray={shape.dashArray}
          strokeLinecap={shape.strokeLinecap}
          opacity={shape.opacity}
        />
      )
    case "polygon":
      return (
        <polygon
          key={key}
          points={shape.points.map((point) => `${point.x},${point.y}`).join(" ")}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          strokeDasharray={shape.dashArray}
          strokeLinecap={shape.strokeLinecap}
          fill={shape.fill ?? "none"}
          opacity={shape.opacity}
        />
      )
    case "rect":
      return (
        <rect
          key={key}
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          strokeDasharray={shape.dashArray}
          strokeLinecap={shape.strokeLinecap}
          fill={shape.fill ?? "none"}
          opacity={shape.opacity}
          rx={shape.rx}
          ry={shape.ry}
        />
      )
    case "path":
      return (
        <path
          key={key}
          d={shape.d}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          strokeDasharray={shape.dashArray}
          strokeLinecap={shape.strokeLinecap}
          fill={shape.fill ?? "none"}
          opacity={shape.opacity}
        />
      )
    case "text":
      return (
        <text
          key={key}
          x={shape.x}
          y={shape.y}
          fill={shape.fill ?? "rgba(226,232,240,0.85)"}
          opacity={shape.opacity}
          fontSize={shape.fontSize}
          fontWeight={shape.fontWeight}
          letterSpacing={shape.letterSpacing}
          textAnchor={shape.align}
          dominantBaseline={shape.baseline}
          fontFamily={shape.fontFamily}
        >
          {shape.text}
        </text>
      )
    default:
      return null
  }
}

export function VirmanaForge() {
  const patternDefaults = BASE_PATTERN.defaults ?? {}
  const [patternId, setPatternId] = useState(BASE_PATTERN.id)
  const [phrase, setPhrase] = useState("VIRMANA")
  const [spokes, setSpokes] = useState<number>(patternDefaults.spokes ?? 12)
  const [rings, setRings] = useState<number>(patternDefaults.rings ?? 3)
  const [rotation, setRotation] = useState<number>(patternDefaults.rotation ?? 0)
  const [deduplicate, setDeduplicate] = useState(patternDefaults.deduplicate ?? true)
  const [traceSequence, setTraceSequence] = useState(patternDefaults.traceSequence ?? true)
  const [weaveRings, setWeaveRings] = useState(patternDefaults.weaveRings ?? true)
  const [mirror, setMirror] = useState(patternDefaults.mirror ?? true)
  const [axis, setAxis] = useState(patternDefaults.axis ?? false)

  const sanitized = useMemo(() => sanitizeText(phrase), [phrase])

  const pattern = useMemo(
    () => VIRMANA_PATTERNS.find((item) => item.id === patternId) ?? BASE_PATTERN,
    [patternId],
  )

  useEffect(() => {
    const defaults = pattern.defaults ?? {}
    if (defaults.spokes !== undefined) setSpokes(defaults.spokes)
    if (defaults.rings !== undefined) setRings(defaults.rings)
    if (defaults.rotation !== undefined) setRotation(defaults.rotation)
    if (defaults.deduplicate !== undefined) setDeduplicate(defaults.deduplicate)
    if (defaults.traceSequence !== undefined) setTraceSequence(defaults.traceSequence)
    if (defaults.weaveRings !== undefined) setWeaveRings(defaults.weaveRings)
    if (defaults.mirror !== undefined) setMirror(defaults.mirror)
    if (defaults.axis !== undefined) setAxis(defaults.axis)
  }, [pattern])

  const runeList = useMemo(() => {
    const runes = sanitized
      .split("")
      .map((char) => findRuneByLatin(char))
      .filter((rune): rune is RuneDef => Boolean(rune))
    return deduplicate ? uniqueById(runes) : runes
  }, [sanitized, deduplicate])

  const layout = useMemo(() => buildPlacements(runeList, { rings, spokes, rotation }), [runeList, rings, spokes, rotation])

  const connectionOptions = useMemo<VirmanaConnectionOptions>(
    () => ({ traceSequence, weaveRings, mirror, axis }),
    [traceSequence, weaveRings, mirror, axis],
  )

  const connections = useMemo(() => computeConnections(layout, connectionOptions), [layout, connectionOptions])

  const ringRadii = useMemo(() => computeRingRadii(rings, VIRMANA_CANVAS_SIZE), [rings])
  const center = layout.center
  const includeGrid = pattern.showGrid ?? true
  const accentColor = pattern.accent ?? "hsl(var(--primary))"

  const patternShapes = useMemo(
    () =>
      pattern.build({
        canvas: VIRMANA_CANVAS_SIZE,
        center,
        ringRadii,
        options: { rings, spokes, rotation },
      }),
    [pattern, center, ringRadii, rings, spokes, rotation],
  )

  const backdropElements = useMemo(
    () => patternShapes.map((shape, index) => renderBackdropShape(shape, `${pattern.id}-${index}`)),
    [patternShapes, pattern.id],
  )

  const handleExportSvg = () => {
    const svg = buildVirmanaSvg(layout, { rings, spokes, rotation }, connections, {
      backdrop: patternShapes,
      includeGrid,
    })
    downloadAsFile(`virmana-${sanitized || "silence"}.svg`, svg)
  }

  const handleExportPng = async () => {
    const svg = buildVirmanaSvg(layout, { rings, spokes, rotation }, connections, {
      backdrop: patternShapes,
      includeGrid,
    })
    const png = await svgToPng(svg, VIRMANA_CANVAS_SIZE, VIRMANA_CANVAS_SIZE)
    const link = document.createElement("a")
    link.href = png
    link.download = `virmana-${sanitized || "silence"}.png`
    link.click()
  }

  const reset = () => {
    const defaults = BASE_PATTERN.defaults ?? {}
    setPatternId(BASE_PATTERN.id)
    setPhrase("VIRMANA")
    setSpokes(defaults.spokes ?? 12)
    setRings(defaults.rings ?? 3)
    setRotation(defaults.rotation ?? 0)
    setDeduplicate(defaults.deduplicate ?? true)
    setTraceSequence(defaults.traceSequence ?? true)
    setWeaveRings(defaults.weaveRings ?? true)
    setMirror(defaults.mirror ?? true)
    setAxis(defaults.axis ?? false)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base">Glyph seed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="virmana-phrase">Seed phrase</Label>
            <Input
              id="virmana-phrase"
              value={phrase}
              onChange={(event) => setPhrase(event.target.value.toUpperCase())}
              placeholder="Enter word or mantra"
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              Characters map to runes automatically. Unknown symbols are ignored.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="virmana-pattern">Sacred frame</Label>
            <Select value={patternId} onValueChange={setPatternId}>
              <SelectTrigger id="virmana-pattern">
                <SelectValue placeholder="Choose a lattice" />
              </SelectTrigger>
              <SelectContent>
                {VIRMANA_PATTERNS.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Swap between Flower of Life petals, Metatron cubes, yantras, graha squares, and temple mosaics.
            </p>
          </div>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="virmana-spokes">Spokes</Label>
                <Select value={String(spokes)} onValueChange={(value) => setSpokes(Number(value))}>
                  <SelectTrigger id="virmana-spokes">
                    <SelectValue placeholder="Spokes" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPOKE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={String(option)}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="virmana-rings">Rings</Label>
                <Select value={String(rings)} onValueChange={(value) => setRings(Number(value))}>
                  <SelectTrigger id="virmana-rings">
                    <SelectValue placeholder="Rings" />
                  </SelectTrigger>
                  <SelectContent>
                    {RING_OPTIONS.map((option) => (
                      <SelectItem key={option} value={String(option)}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="virmana-rotation">Rotation {rotation.toFixed(0)}°</Label>
              <input
                id="virmana-rotation"
                type="range"
                min={0}
                max={60}
                step={1}
                value={rotation}
                onChange={(event) => setRotation(Number(event.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3">
              <div>
                <Label htmlFor="virmana-dedup" className="text-sm font-medium">
                  Collapse duplicates
                </Label>
                <p className="text-xs text-muted-foreground">Keep only the first occurrence of each rune.</p>
              </div>
              <Switch
                id="virmana-dedup"
                checked={deduplicate}
                onCheckedChange={setDeduplicate}
                aria-label="Collapse duplicate runes"
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3">
              <div>
                <Label htmlFor="virmana-trace" className="text-sm font-medium">
                  Trace sequence
                </Label>
                <p className="text-xs text-muted-foreground">Connect nodes in the order typed.</p>
              </div>
              <Switch
                id="virmana-trace"
                checked={traceSequence}
                onCheckedChange={setTraceSequence}
                aria-label="Trace rune sequence"
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3">
              <div>
                <Label htmlFor="virmana-ringweave" className="text-sm font-medium">
                  Weave rings
                </Label>
                <p className="text-xs text-muted-foreground">Link runes sharing the same radius.</p>
              </div>
              <Switch
                id="virmana-ringweave"
                checked={weaveRings}
                onCheckedChange={setWeaveRings}
                aria-label="Weave ring connections"
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3">
              <div>
                <Label htmlFor="virmana-mirror" className="text-sm font-medium">
                  Mirror network
                </Label>
                <p className="text-xs text-muted-foreground">Reflect lines across the vertical axis.</p>
              </div>
              <Switch
                id="virmana-mirror"
                checked={mirror}
                onCheckedChange={setMirror}
                aria-label="Mirror the network"
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-3">
              <div>
                <Label htmlFor="virmana-axis" className="text-sm font-medium">
                  Radiate to center
                </Label>
                <p className="text-xs text-muted-foreground">Anchor every rune back into the core.</p>
              </div>
              <Switch
                id="virmana-axis"
                checked={axis}
                onCheckedChange={setAxis}
                aria-label="Radiate to center"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" size="sm" onClick={reset} className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
            <Badge variant="outline" className="flex items-center gap-1 text-xs">
              <Sparkles className="h-3 w-3" /> Nodes {runeList.length}
            </Badge>
          </div>
        </CardContent>
      </Card>
      <div className="space-y-6">
        <Card className="bg-muted/20">
          <CardHeader>
            <CardTitle className="text-base">Virmana lattice</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The lattice projects each rune onto sacred rings and spokes. Sequenced links and mirrored traces condense a mantra
              into a transport sigil.
            </p>
            <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">{pattern.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{pattern.description}</p>
            </div>
          </CardContent>
        </Card>
        <div
          className="relative mx-auto w-full max-w-[720px] overflow-hidden rounded-[2.5rem] border border-border/60 bg-stone-soft/30 p-6"
          style={{ height: VIRMANA_CANVAS_SIZE + 48 }}
        >
          <svg width={VIRMANA_CANVAS_SIZE} height={VIRMANA_CANVAS_SIZE} className="rounded-[2rem] bg-gradient-to-br from-stone-soft/30 to-transparent">
            <rect x={0} y={0} width={VIRMANA_CANVAS_SIZE} height={VIRMANA_CANVAS_SIZE} fill="rgba(12,12,16,0.78)" />
            <circle cx={center} cy={center} r={center - 18} fill="rgba(15,15,19,0.78)" />
            {backdropElements}
            {includeGrid &&
              ringRadii.map((radius) => (
                <circle key={radius} cx={center} cy={center} r={radius} stroke="rgba(148,163,184,0.28)" strokeDasharray="14 12" fill="none" />
              ))}
            {includeGrid &&
              Array.from({ length: spokes }, (_, index) => rotation + (index * 360) / spokes).map((angle) => {
                const { x, y } = polarToCartesian({ radius: center - 48, angle }, { x: center, y: center })
                return <line key={angle} x1={center} y1={center} x2={x} y2={y} stroke="rgba(148,163,184,0.25)" strokeDasharray="12 10" />
              })}
            {connections.map((connection, index) => (
              <line
                key={`${connection.start.x}-${connection.start.y}-${index}`}
                x1={connection.start.x}
                y1={connection.start.y}
                x2={connection.end.x}
                y2={connection.end.y}
                stroke={accentColor}
                strokeWidth={6}
                strokeLinecap="round"
                strokeOpacity={0.7}
              />
            ))}
            <circle cx={center} cy={center} r={8} fill={accentColor} />
          </svg>
          <div className="absolute left-6 top-6" style={{ width: VIRMANA_CANVAS_SIZE, height: VIRMANA_CANVAS_SIZE }}>
            {layout.placements.map((placement, index) => {
              const { x, y } = polarToCartesian({ radius: placement.radius, angle: placement.angle }, { x: center, y: center })
              const left = x - 60
              const top = y - 60
              return (
                <div key={`${placement.rune.id}-${index}`} className="absolute" style={{ left, top }}>
                  <RuneCanvas
                    rune={placement.rune}
                    size={120}
                    strokeWidth={10}
                    className="border-transparent bg-background/80"
                    strokeColor={accentColor}
                  />
                </div>
              )
            })}
            {layout.placements.length === 0 && (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Add runes by typing a seed phrase.
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Badge variant="outline">{pattern.label}</Badge>
          <Badge variant="holo">Spokes ×{spokes}</Badge>
          <Badge variant="outline">Rings ×{rings}</Badge>
          <Badge variant="outline">Rotation {rotation.toFixed(0)}°</Badge>
          <Badge variant="outline">Connections {connections.length}</Badge>
        </div>
        <div className="flex items-center gap-3">
          <ExportBar
            onExportSvg={handleExportSvg}
            onExportPng={handleExportPng}
            disabled={layout.placements.length === 0}
          />
          <Button type="button" variant="ghost" onClick={reset}>
            Reset layout
          </Button>
        </div>
      </div>
    </div>
  )
}

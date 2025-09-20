import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Grip, Layers3, PlusCircle, Trash2 } from "lucide-react"

import { BinderPanel, type FrameMode } from "@/components/BinderPanel"
import { ExportBar } from "@/components/ExportBar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RuneCanvas } from "@/components/RuneCanvas"
import { RuneControls } from "@/components/RuneControls"
import { Badge } from "@/components/ui/badge"
import { RUNES, type RuneDef } from "@/lib/data/runes"
import { mandalaGuides, polarToCartesian, snapAngle, snapRadius, DEFAULT_CANVAS_SIZE } from "@/lib/glyph/mandala"
import { renderRune } from "@/lib/glyph/render"
import type { Rotation } from "@/lib/glyph/transforms"
import { downloadAsFile, svgToPng } from "@/lib/utils"

interface MandalaPlacement {
  id: string
  rune: RuneDef
  angle: number
  radius: number
  rotate: Rotation
  mirrorX: boolean
  modifiers: string[]
}

const CANVAS_SIZE = DEFAULT_CANVAS_SIZE
const RUNE_SIZE = 140

const paletteRunes = RUNES.filter((rune) => !rune.special)
const guides = mandalaGuides(CANVAS_SIZE)

function toId() {
  return Math.random().toString(36).slice(2, 9)
}

function buildMandalaSvg(placements: MandalaPlacement[], frame: FrameMode, broken: boolean): string {
  const center = CANVAS_SIZE / 2
  const groups = placements
    .map((placement) => {
      const svg = renderRune(placement.rune, {
        size: RUNE_SIZE,
        strokeWidth: 10,
        variant: {
          rotate: placement.rotate,
          mirrorX: placement.mirrorX,
          modifiers: placement.modifiers,
        },
      })
      const group = svg.match(/<g[\s\S]*<\/g>/)?.[0] ?? svg
      const { x, y } = polarToCartesian({ radius: placement.radius, angle: placement.angle }, { x: center, y: center })
      const offsetX = x - RUNE_SIZE / 2
      const offsetY = y - RUNE_SIZE / 2
      return `<g transform="translate(${offsetX},${offsetY})">${group}</g>`
    })
    .join("\n")

  const overlay = frame === "diamond" && !broken
    ? `<polygon points="${center},40 ${CANVAS_SIZE - 40},${center} ${center},${CANVAS_SIZE - 40} 40,${center}" fill="none" stroke="#38bdf8" stroke-width="14" stroke-dasharray="18 16" />`
    : frame === "circle" && !broken
      ? `<circle cx="${center}" cy="${center}" r="${center - 40}" stroke="#38bdf8" stroke-width="14" fill="none" />`
      : frame === "square" && !broken
        ? `<rect x="40" y="40" width="${CANVAS_SIZE - 80}" height="${CANVAS_SIZE - 80}" fill="none" stroke="#38bdf8" stroke-width="14" stroke-dasharray="20 18" />`
        : ""

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" role="img">${overlay}${groups}</svg>`
}

export function MandalaEditor() {
  const [placements, setPlacements] = useState<MandalaPlacement[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [frame, setFrame] = useState<FrameMode>("none")
  const [broken, setBroken] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }
  }, [])

  const selectedPlacement = placements.find((placement) => placement.id === selectedId) ?? null

  const addPlacement = (rune: RuneDef) => {
    const newPlacement: MandalaPlacement = {
      id: toId(),
      rune,
      angle: 0,
      radius: guides.rings[Math.floor(guides.rings.length / 2)] ?? 160,
      rotate: 0,
      mirrorX: false,
      modifiers: [],
    }
    setPlacements((current) => [...current, newPlacement])
    setSelectedId(newPlacement.id)
  }

  const removePlacement = (id: string) => {
    setPlacements((current) => current.filter((item) => item.id !== id))
    if (selectedId === id) {
      setSelectedId(null)
    }
  }

  const updatePlacement = (id: string, updater: (placement: MandalaPlacement) => MandalaPlacement) => {
    setPlacements((current) => current.map((placement) => (placement.id === id ? updater(placement) : placement)))
  }

  const handlePointerMove = (event: PointerEvent) => {
    if (!draggingId || !canvasRef.current) return
    const bounds = canvasRef.current.getBoundingClientRect()
    const x = event.clientX - bounds.left
    const y = event.clientY - bounds.top
    const center = CANVAS_SIZE / 2
    const dx = x - center
    const dy = center - y
    const angle = snapAngle((Math.atan2(dx, dy) * 180) / Math.PI)
    const distance = Math.sqrt(dx * dx + dy * dy)
    const radius = snapRadius(distance, guides.rings)
    updatePlacement(draggingId, (placement) => ({ ...placement, angle, radius }))
  }

  const handlePointerUp = () => {
    setDraggingId(null)
    window.removeEventListener("pointermove", handlePointerMove)
    window.removeEventListener("pointerup", handlePointerUp)
  }

  const beginDrag = (id: string) => {
    setDraggingId(id)
    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)
  }

  const handleExportSvg = () => {
    const svg = buildMandalaSvg(placements, frame, broken)
    downloadAsFile(`mandala-${placements.length}.svg`, svg)
  }

  const handleExportPng = async () => {
    const svg = buildMandalaSvg(placements, frame, broken)
    const png = await svgToPng(svg, CANVAS_SIZE, CANVAS_SIZE)
    const link = document.createElement("a")
    link.href = png
    link.download = `mandala-${placements.length}.png`
    link.click()
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers3 className="h-4 w-4" /> Palette
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="all">
            <TabsList className="w-full">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="vowels">Vowels</TabsTrigger>
              <TabsTrigger value="special">Special</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="pt-4">
              <ScrollArea className="h-[420px] pr-4">
                <div className="grid grid-cols-2 gap-3">
                  {paletteRunes.map((rune) => (
                    <Button
                      key={rune.id}
                      type="button"
                      variant="outline"
                      className="flex flex-col items-center gap-2 border-dashed"
                      onClick={() => addPlacement(rune)}
                    >
                      <PlusCircle className="h-4 w-4 text-primary" />
                      {rune.latin}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="vowels" className="pt-4">
              <ScrollArea className="h-[420px] pr-4">
                <div className="grid grid-cols-2 gap-3">
                  {paletteRunes
                    .filter((rune) => /[AEIOUY]/.test(rune.latin))
                    .map((rune) => (
                      <Button
                        key={rune.id}
                        variant="outline"
                        type="button"
                        onClick={() => addPlacement(rune)}
                      >
                        {rune.latin}
                      </Button>
                    ))}
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="special" className="pt-4">
              <ScrollArea className="h-[420px] pr-4">
                <div className="grid grid-cols-2 gap-3">
                  {RUNES.filter((rune) => rune.special).map((rune) => (
                    <Button
                      key={rune.id}
                      variant="outline"
                      type="button"
                      onClick={() => addPlacement(rune)}
                    >
                      {rune.latin}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
          <ExportBar onExportSvg={handleExportSvg} onExportPng={handleExportPng} disabled={placements.length === 0} />
        </CardContent>
      </Card>
      <div className="space-y-6">
        <BinderPanel frame={frame} broken={broken} onFrameChange={setFrame} onBrokenChange={setBroken}>
          <p className="text-sm text-muted-foreground">
            Mandala frames respect the chisel law via polygonal guides. Use Break to remove the global frame while keeping placements.
          </p>
        </BinderPanel>
        <div
          className="relative mx-auto w-full max-w-[640px] overflow-hidden rounded-[2.5rem] border border-border/60 bg-stone-soft/30 p-6"
          style={{ height: CANVAS_SIZE + 48 }}
        >
          <svg width={CANVAS_SIZE} height={CANVAS_SIZE} className="rounded-[2rem] bg-gradient-to-br from-stone-soft/30 to-transparent">
            <circle cx={guides.center} cy={guides.center} r={guides.center - 12} fill="rgba(20,20,22,0.35)" />
            {guides.rings.map((radius) => (
              <circle key={radius} cx={guides.center} cy={guides.center} r={radius} stroke="rgba(148,163,184,0.25)" strokeDasharray="12 12" fill="none" />
            ))}
            {guides.spokes.map((angle) => {
              const { x, y } = polarToCartesian({ radius: guides.center - 12, angle }, { x: guides.center, y: guides.center })
              return <line key={angle} x1={guides.center} y1={guides.center} x2={x} y2={y} stroke="rgba(148,163,184,0.3)" strokeDasharray="14 14" />
            })}
            <circle cx={guides.center} cy={guides.center} r={6} fill="hsl(var(--primary))" />
          </svg>
          <div className="pointer-events-none absolute inset-6">
            {frame === "diamond" && !broken && (
              <svg className="h-full w-full" viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}>
                <polygon
                  points={`${guides.center},48 ${CANVAS_SIZE - 48},${guides.center} ${guides.center},${CANVAS_SIZE - 48} 48,${guides.center}`}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth={10}
                  strokeDasharray="20 18"
                  opacity={0.45}
                />
              </svg>
            )}
            {frame === "square" && !broken && (
              <svg className="h-full w-full" viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}>
                <rect
                  x={48}
                  y={48}
                  width={CANVAS_SIZE - 96}
                  height={CANVAS_SIZE - 96}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth={10}
                  strokeDasharray="18 16"
                  opacity={0.45}
                />
              </svg>
            )}
            {frame === "circle" && !broken && (
              <svg className="h-full w-full" viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}>
                <circle
                  cx={guides.center}
                  cy={guides.center}
                  r={guides.center - 48}
                  stroke="hsl(var(--primary))"
                  strokeWidth={10}
                  strokeDasharray="14 12"
                  fill="none"
                  opacity={0.45}
                />
              </svg>
            )}
          </div>
          <div
            ref={canvasRef}
            className="absolute left-6 top-6"
            style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
          >
            <AnimatePresence>
              {placements.map((placement) => {
                const { x, y } = polarToCartesian({ radius: placement.radius, angle: placement.angle }, { x: guides.center, y: guides.center })
                const left = x - RUNE_SIZE / 2
                const top = y - RUNE_SIZE / 2
                const isSelected = placement.id === selectedId
                return (
                  <motion.button
                    key={placement.id}
                    className={`absolute rounded-2xl border ${isSelected ? "border-primary shadow-digital-glow" : "border-transparent"}`}
                    style={{ left, top }}
                    type="button"
                    onPointerDown={(event) => {
                      event.stopPropagation()
                      beginDrag(placement.id)
                    }}
                    onClick={(event) => {
                      event.stopPropagation()
                      setSelectedId(placement.id)
                    }}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                  >
                    <RuneCanvas
                      rune={placement.rune}
                      variant={{ rotate: placement.rotate, mirrorX: placement.mirrorX, modifiers: placement.modifiers }}
                      size={RUNE_SIZE}
                      strokeWidth={10}
                      className="bg-background/70"
                    />
                  </motion.button>
                )
              })}
            </AnimatePresence>
          </div>
        </div>
        {selectedPlacement ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Grip className="h-4 w-4" /> {selectedPlacement.rune.latin} placement
              </CardTitle>
              <Button variant="destructive" size="sm" onClick={() => removePlacement(selectedPlacement.id)}>
                <Trash2 className="mr-2 h-4 w-4" /> Remove
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <Badge variant="outline">Angle {selectedPlacement.angle}°</Badge>
                <Badge variant="outline">Ring {selectedPlacement.radius.toFixed(0)}</Badge>
                <Badge variant="outline">Rune {selectedPlacement.rune.latin}</Badge>
              </div>
              <RuneControls
                rune={selectedPlacement.rune}
                value={{
                  rotate: selectedPlacement.rotate,
                  mirrorX: selectedPlacement.mirrorX,
                  modifiers: selectedPlacement.modifiers,
                }}
                onChange={(value) => updatePlacement(selectedPlacement.id, (placement) => ({ ...placement, ...value }))}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-6 text-sm text-muted-foreground">
            Select a rune on the mandala to adjust rotation, mirroring, and modifiers.
          </div>
        )}
      </div>
    </div>
  )
}

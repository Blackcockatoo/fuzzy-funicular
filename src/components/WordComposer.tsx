import { useMemo, useState } from "react"

import { BinderPanel, type FrameMode } from "@/components/BinderPanel"
import { ExportBar } from "@/components/ExportBar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { RuneCanvas } from "@/components/RuneCanvas"
import { RUNES, type RuneDef, findRuneByLatin } from "@/lib/data/runes"
import { renderRune } from "@/lib/glyph/render"
import { downloadAsFile, svgToPng } from "@/lib/utils"

interface ScriptRune {
  char: string
  rune: RuneDef | null
}

const CELL_SIZE = 140

const nullRune = RUNES.find((r) => r.special === "NULL")
const bindStart = RUNES.find((r) => r.special === "BIND_START")
const bindEnd = RUNES.find((r) => r.special === "BIND_END")
const diamondFrame = RUNES.find((r) => r.special === "FRAME_DIAMOND")

function normalizeChar(char: string) {
  if (char === "—") return "—"
  return char.toUpperCase()
}

function extractGroup(svg: string) {
  const match = svg.match(/<g[\s\S]*<\/g>/)
  return match ? match[0] : svg
}

function buildScriptSvg(runes: RuneDef[], frame: FrameMode): string {
  const width = Math.max(runes.length, 1) * CELL_SIZE
  const height = CELL_SIZE
  const groups = runes
    .map((rune, index) => {
      const svg = renderRune(rune, { size: CELL_SIZE - 20, strokeWidth: 8 })
      const group = extractGroup(svg)
      const offset = index * CELL_SIZE
      return `<g transform="translate(${offset + 10},10)">${group}</g>`
    })
    .join("\n")
  const overlay = frame === "diamond" && diamondFrame
    ? `<g transform="translate(${width / 2 - CELL_SIZE / 2},0)">${extractGroup(
        renderRune(diamondFrame, { size: CELL_SIZE, strokeWidth: 6, strokeColor: "#7dd3fc" }),
      )}</g>`
    : frame === "circle"
      ? `<circle cx="${width / 2}" cy="${height / 2}" r="${height / 2 - 16}" stroke="#38bdf8" stroke-width="8" fill="none" stroke-dasharray="6 12" />`
      : ""

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img">${overlay}${groups}</svg>`
}

export function WordComposer() {
  const [text, setText] = useState("ARCANE")
  const [frame, setFrame] = useState<FrameMode>("none")
  const [broken, setBroken] = useState(false)

  const scriptRunes = useMemo<ScriptRune[]>(() => {
    const chars = text.split("")
    if (chars.length === 0) {
      return []
    }
    return chars.map((char) => {
      const normalized = normalizeChar(char)
      if (normalized.trim() === "") {
        return { char, rune: nullRune ?? null }
      }
      const rune = findRuneByLatin(normalized) ?? nullRune ?? null
      return { char, rune }
    })
  }, [text])

  const resolvedRunes = useMemo(() => {
    const base = scriptRunes.flatMap((entry) => (entry.rune ? [entry.rune] : []))
    if (broken || frame === "none") {
      return base
    }
    if (frame === "square" && bindStart && bindEnd) {
      return [bindStart, ...base, bindEnd]
    }
    return base
  }, [scriptRunes, frame, broken])

  const numericTotal = resolvedRunes.reduce((total, rune) => total + rune.numericMap, 0)

  const hookSummary = useMemo(() => {
    const map = new Map<string, number>()
    resolvedRunes.forEach((rune) => {
      rune.sequenceHooks.forEach((hook) => {
        map.set(hook, (map.get(hook) ?? 0) + 1)
      })
    })
    return Array.from(map.entries())
  }, [resolvedRunes])

  const handleExportSvg = () => {
    const svg = buildScriptSvg(resolvedRunes, frame)
    downloadAsFile(`word-${text || "silence"}.svg`, svg)
  }

  const handleExportPng = async () => {
    const svg = buildScriptSvg(resolvedRunes, frame)
    const width = Math.max(resolvedRunes.length, 1) * CELL_SIZE
    const png = await svgToPng(svg, width, CELL_SIZE)
    const link = document.createElement("a")
    link.href = png
    link.download = `word-${text || "silence"}.png`
    link.click()
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3">
        <Label htmlFor="rune-text">Script input</Label>
        <Input
          id="rune-text"
          value={text}
          onChange={(event) => setText(event.target.value.toUpperCase())}
          placeholder="Type your word or mantra"
          aria-describedby="rune-text-description"
        />
        <p id="rune-text-description" className="text-sm text-muted-foreground">
          Characters map automatically to the New Runes alphabet. Unknown symbols fall back to the Null rune.
        </p>
      </div>
      <BinderPanel frame={frame} broken={broken} onFrameChange={setFrame} onBrokenChange={setBroken}>
        <p className="text-sm text-muted-foreground">
          Frames elevate the script into a sigil. Break to release bindings without deleting the word.
        </p>
      </BinderPanel>
      <div className="relative overflow-x-auto rounded-3xl border border-border/60 bg-muted/20 p-6">
        {frame === "diamond" && !broken && diamondFrame && (
          <div className="pointer-events-none absolute inset-y-6 left-1/2 -translate-x-1/2 opacity-50">
            <RuneCanvas rune={diamondFrame} size={resolvedRunes.length * CELL_SIZE} strokeWidth={10} className="bg-transparent" />
          </div>
        )}
        {frame === "circle" && !broken && (
          <svg
            className="pointer-events-none absolute inset-6 h-[calc(100%-3rem)] w-[calc(100%-3rem)]"
            viewBox="0 0 200 200"
          >
            <polygon
              points="100,10 160,40 190,100 160,160 100,190 40,160 10,100 40,40"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth={6}
              strokeDasharray="12 10"
              opacity={0.5}
            />
          </svg>
        )}
        <div className="relative flex flex-wrap items-end gap-6">
          {resolvedRunes.map((rune, index) => (
            <div key={`${rune.id}-${index}`} className="flex flex-col items-center gap-3">
              <RuneCanvas
                rune={rune}
                size={110}
                strokeWidth={6}
                className="bg-background/80"
                ariaLabel={`Rune ${rune.latin}`}
              />
              <Badge variant="outline" className="text-xs uppercase tracking-wide">
                {rune.numericMap}
              </Badge>
            </div>
          ))}
          {resolvedRunes.length === 0 && (
            <div className="text-sm text-muted-foreground">Type a word to render runes.</div>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Badge variant="holo" className="text-sm">
          Total Gematria: {numericTotal}
        </Badge>
        {hookSummary.map(([hook, count]) => (
          <Badge key={hook} variant="outline">
            {hook} × {count}
          </Badge>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <ExportBar onExportSvg={handleExportSvg} onExportPng={handleExportPng} disabled={resolvedRunes.length === 0} />
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setText("")
            setBroken(false)
            setFrame("none")
          }}
        >
          Clear
        </Button>
      </div>
    </div>
  )
}

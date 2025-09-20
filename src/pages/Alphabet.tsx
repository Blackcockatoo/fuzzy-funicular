import { useMemo, useState } from "react"
import { motion } from "framer-motion"

import { RuneCard } from "@/components/RuneCard"
import { RuneCanvas } from "@/components/RuneCanvas"
import { RuneControls } from "@/components/RuneControls"
import { ExportBar } from "@/components/ExportBar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { RuneDef } from "@/lib/data/runes"
import { RUNES } from "@/lib/data/runes"
import { renderRune } from "@/lib/glyph/render"
import { downloadAsFile, svgToPng } from "@/lib/utils"

const vowels = new Set(["A", "E", "I", "O", "U", "Y"])
const pillars = new Set(["H", "M", "N", "T"])

interface RuneDialogState {
  rune: RuneDef
  rotate: 0 | 90 | 180 | 270
  mirrorX: boolean
  modifiers: string[]
}

type SortKey = "latin" | "number"

type FilterState = {
  vowels: boolean
  pillars: boolean
  specials: boolean
}

export default function AlphabetPage() {
  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("latin")
  const [filters, setFilters] = useState<FilterState>({ vowels: false, pillars: false, specials: false })
  const [dialog, setDialog] = useState<RuneDialogState | null>(null)

  const filteredRunes = useMemo(() => {
    return RUNES.filter((rune) => {
      const matchesSearch = `${rune.latin} ${rune.phoneme.join(" ")} ${rune.baseShape}`
        .toLowerCase()
        .includes(search.toLowerCase())
      if (!matchesSearch) return false
      if (filters.specials && !rune.special) return false
      if (filters.vowels && !vowels.has(rune.latin)) return false
      if (filters.pillars && !pillars.has(rune.latin)) return false
      return true
    }).sort((a, b) => {
      if (sortKey === "latin") {
        return a.latin.localeCompare(b.latin)
      }
      return a.number - b.number
    })
  }, [filters, search, sortKey])

  const handleExport = async (type: "svg" | "png") => {
    if (!dialog) return
    const svg = renderRune(dialog.rune, {
      size: 320,
      strokeWidth: 12,
      variant: { rotate: dialog.rotate, mirrorX: dialog.mirrorX, modifiers: dialog.modifiers },
    })
    if (type === "svg") {
      downloadAsFile(`rune-${dialog.rune.latin}.svg`, svg)
      return
    }
    const png = await svgToPng(svg, 320, 320)
    const link = document.createElement("a")
    link.href = png
    link.download = `rune-${dialog.rune.latin}.png`
    link.click()
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 rounded-3xl border border-border/60 bg-card/80 p-6 shadow-lg shadow-black/20">
        <div className="grid gap-3 md:grid-cols-4 md:items-end">
          <div className="md:col-span-2">
            <Label htmlFor="alphabet-search">Search</Label>
            <Input
              id="alphabet-search"
              placeholder="Search by letter, phoneme, or shape"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div>
            <Label>Sort by</Label>
            <Select value={sortKey} onValueChange={(value: SortKey) => setSortKey(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latin">Latin</SelectItem>
                <SelectItem value="number">Number</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3 pt-6">
            <button
              type="button"
              className={`rounded-full border px-3 py-1 text-sm transition ${filters.vowels ? "border-primary text-primary" : "border-border/60 text-muted-foreground"}`}
              onClick={() => setFilters((prev) => ({ ...prev, vowels: !prev.vowels }))}
            >
              Vowels
            </button>
            <button
              type="button"
              className={`rounded-full border px-3 py-1 text-sm transition ${filters.pillars ? "border-primary text-primary" : "border-border/60 text-muted-foreground"}`}
              onClick={() => setFilters((prev) => ({ ...prev, pillars: !prev.pillars }))}
            >
              Pillars
            </button>
            <button
              type="button"
              className={`rounded-full border px-3 py-1 text-sm transition ${filters.specials ? "border-primary text-primary" : "border-border/60 text-muted-foreground"}`}
              onClick={() => setFilters((prev) => ({ ...prev, specials: !prev.specials }))}
            >
              Specials
            </button>
            <Button variant="ghost" size="sm" onClick={() => setFilters({ vowels: false, pillars: false, specials: false })}>
              Reset
            </Button>
          </div>
        </div>
      </section>
      <motion.div layout className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {filteredRunes.map((rune) => (
          <RuneCard
            key={rune.id}
            rune={rune}
            onSelect={(selected) =>
              setDialog({ rune: selected, rotate: 0, mirrorX: false, modifiers: [] })
            }
          />
        ))}
      </motion.div>
      <Dialog open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="max-w-4xl">
          {dialog && (
            <ScrollArea className="max-h-[80vh] pr-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-2xl font-semibold">
                  {dialog.rune.latin}
                  <Badge variant="holo">{dialog.rune.number}</Badge>
                </DialogTitle>
                <DialogDescription>{dialog.rune.description}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4 md:grid-cols-[minmax(0,360px)_1fr]">
                <RuneCanvas
                  rune={dialog.rune}
                  size={320}
                  strokeWidth={12}
                  variant={{ rotate: dialog.rotate, mirrorX: dialog.mirrorX, modifiers: dialog.modifiers }}
                  className="mx-auto bg-background/90"
                />
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <Badge variant="outline">Angles {dialog.rune.strokeAngles.join("° ") + "°"}</Badge>
                    <Badge variant="outline">Hooks {dialog.rune.sequenceHooks.join(", ")}</Badge>
                    {dialog.rune.ligatures.length > 0 && (
                      <Badge variant="outline">Ligatures {dialog.rune.ligatures.join(", ")}</Badge>
                    )}
                  </div>
                  <RuneControls
                    rune={dialog.rune}
                    value={{
                      rotate: dialog.rotate,
                      mirrorX: dialog.mirrorX,
                      modifiers: dialog.modifiers,
                    }}
                    onChange={(value) => setDialog((current) => (current ? { ...current, ...value } : current))}
                  />
                  <ExportBar
                    onExportSvg={() => handleExport("svg")}
                    onExportPng={() => handleExport("png")}
                  />
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

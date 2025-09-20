import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { RuneDef } from "@/lib/data/runes"
import { RuneCanvas } from "@/components/RuneCanvas"

interface RuneCardProps {
  rune: RuneDef
  onSelect?: (rune: RuneDef) => void
}

export function RuneCard({ rune, onSelect }: RuneCardProps) {
  return (
    <motion.button
      layout
      whileHover={{ scale: 1.02 }}
      whileFocus={{ scale: 1.02 }}
      className="text-left"
      onClick={() => onSelect?.(rune)}
      type="button"
    >
      <Card className="h-full bg-card/90 transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              {rune.latin}
              <Badge variant="holo" className="text-xs font-medium tracking-wider">
                {rune.number}
              </Badge>
            </CardTitle>
            <CardDescription className="mt-1 text-sm text-muted-foreground">
              {rune.baseShape}
            </CardDescription>
          </div>
          <Badge variant="outline" className="uppercase">
            {rune.phoneme.join(" · ")}
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-3">
          <RuneCanvas
            rune={rune}
            size={120}
            strokeWidth={6}
            className="mx-auto aspect-square w-full max-w-[140px] bg-stone-soft/50"
          />
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-muted/30 px-2 py-1">Angles: {rune.strokeAngles.join("° ") + "°"}</span>
            <span className="rounded-full bg-muted/30 px-2 py-1">Hooks: {rune.sequenceHooks.join(", ")}</span>
          </div>
        </CardContent>
      </Card>
    </motion.button>
  )
}

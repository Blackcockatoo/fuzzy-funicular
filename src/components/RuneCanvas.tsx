import { useMemo, useRef } from "react"

import type { RuneDef } from "@/lib/data/runes"
import { renderRune, type RenderOptions } from "@/lib/glyph/render"
import { cn } from "@/lib/utils"

interface RuneCanvasProps {
  rune: RuneDef
  className?: string
  size?: number
  strokeWidth?: number
  variant?: RenderOptions["variant"]
  strokeColor?: string
  background?: string
  ariaLabel?: string
}

export function RuneCanvas({
  rune,
  className,
  size = 160,
  strokeWidth = 6,
  variant,
  strokeColor = "currentColor",
  background = "bg-stone-soft/60",
  ariaLabel,
}: RuneCanvasProps) {
  const svg = useMemo(() => {
    return renderRune(rune, { size, strokeWidth, variant, strokeColor })
  }, [rune, size, strokeWidth, variant, strokeColor])

  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex items-center justify-center rounded-2xl border border-border/60 shadow-inner shadow-black/30",
        background,
        className,
      )}
      aria-label={ariaLabel ?? `Rune ${rune.latin}`}
      role="img"
    >
      <div
        className="pointer-events-none select-none"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  )
}

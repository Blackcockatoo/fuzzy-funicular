import { Download, ImageDown } from "lucide-react"

import { Button } from "@/components/ui/button"

interface ExportBarProps {
  onExportSvg?: () => void
  onExportPng?: () => void
  disabled?: boolean
}

export function ExportBar({ onExportPng, onExportSvg, disabled }: ExportBarProps) {
  return (
    <div className="flex flex-wrap gap-3 rounded-xl border border-border/60 bg-muted/20 p-3">
      <Button
        type="button"
        onClick={onExportSvg}
        variant="secondary"
        disabled={disabled}
        className="flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        Export SVG
      </Button>
      <Button
        type="button"
        onClick={onExportPng}
        variant="ghost"
        glow
        disabled={disabled}
        className="flex items-center gap-2"
      >
        <ImageDown className="h-4 w-4" />
        Export PNG
      </Button>
    </div>
  )
}

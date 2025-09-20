import { ReactNode } from "react"
import { AlertTriangle, Circle, Frame, Octagon, Square } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Toggle } from "@/components/ui/toggle"

export type FrameMode = "none" | "square" | "diamond" | "circle"

interface BinderPanelProps {
  frame: FrameMode
  onFrameChange: (frame: FrameMode) => void
  broken: boolean
  onBrokenChange: (broken: boolean) => void
  children?: ReactNode
}

const frames: { value: FrameMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "none", label: "None", icon: Frame },
  { value: "square", label: "Square", icon: Square },
  { value: "diamond", label: "Diamond", icon: Octagon },
  { value: "circle", label: "Circle", icon: Circle },
]

export function BinderPanel({ frame, onFrameChange, broken, onBrokenChange, children }: BinderPanelProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-border/60 bg-card/80 p-4">
      <div className="flex flex-wrap items-center gap-3">
        {frames.map(({ value, label, icon: Icon }) => (
          <Toggle
            key={value}
            pressed={frame === value}
            onPressedChange={() => onFrameChange(value)}
            aria-label={`Set frame ${label}`}
          >
            <Icon className="h-4 w-4" />
            <span className="ml-2 hidden text-sm md:inline">{label}</span>
          </Toggle>
        ))}
        <Button
          type="button"
          variant={broken ? "destructive" : "outline"}
          onClick={() => onBrokenChange(!broken)}
          className="ml-auto flex items-center gap-2"
        >
          <AlertTriangle className="h-4 w-4" />
          {broken ? "Unbound" : "Break"}
        </Button>
      </div>
      {children}
    </div>
  )
}

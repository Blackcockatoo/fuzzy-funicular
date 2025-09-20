import { RotateCw, SparklesIcon } from "lucide-react"
import { Fragment } from "react"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Toggle } from "@/components/ui/toggle"
import type { ModifierSlot, RuneDef } from "@/lib/data/runes"
import type { Rotation } from "@/lib/glyph/transforms"

interface RuneControlsProps {
  rune: RuneDef
  value: {
    rotate: Rotation
    mirrorX: boolean
    modifiers: string[]
  }
  onChange: (value: RuneControlsProps["value"]) => void
}

const rotations: Rotation[] = [0, 90, 180, 270]

function modifierOptionsForSlot(slot: ModifierSlot) {
  const base = ["hook", "bar"]
  if (slot === "center" || slot === "all") {
    base.push("break")
  }
  return base
}

export function RuneControls({ rune, value, onChange }: RuneControlsProps) {
  const toggleModifier = (modifier: string) => {
    const next = value.modifiers.includes(modifier)
      ? value.modifiers.filter((item) => item !== modifier)
      : [...value.modifiers, modifier]
    onChange({ ...value, modifiers: next })
  }

  const modifierSlots = rune.modifierSlots.includes("all")
    ? ["top", "right", "bottom", "left", "center"]
    : rune.modifierSlots

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-2 block text-xs uppercase tracking-wide text-muted-foreground">Rotation</Label>
        <div className="flex flex-wrap gap-2">
          {rotations.map((rotation) => (
            <Toggle
              key={rotation}
              pressed={value.rotate === rotation}
              onPressedChange={() => onChange({ ...value, rotate: rotation })}
              aria-label={`Rotate ${rotation} degrees`}
            >
              {rotation === 0 ? <RotateCw className="h-4 w-4" /> : `${rotation}°`}
            </Toggle>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-3 py-2">
        <div>
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Mirror</Label>
          <p className="text-sm text-muted-foreground">Flip along the vertical axis</p>
        </div>
        <Switch
          checked={value.mirrorX}
          onCheckedChange={(checked) => onChange({ ...value, mirrorX: checked })}
          aria-label="Toggle mirror"
        />
      </div>
      <div className="space-y-3">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Modifiers</Label>
        {modifierSlots.length === 0 && (
          <p className="text-sm text-muted-foreground">This rune is closed to modifiers.</p>
        )}
        {modifierSlots.map((slot) => (
          <Fragment key={slot}>
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <SparklesIcon className="h-4 w-4 text-primary" />
              {slot.toUpperCase()}
            </div>
            <div className="flex flex-wrap gap-3 pl-6">
              {modifierOptionsForSlot(slot).map((name) => {
                const modifierKey = `${name}:${slot === "center" ? "center" : slot}`
                return (
                  <label key={modifierKey} className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={value.modifiers.includes(modifierKey)}
                      onCheckedChange={() => toggleModifier(modifierKey)}
                    />
                    {name}
                  </label>
                )
              })}
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  )
}

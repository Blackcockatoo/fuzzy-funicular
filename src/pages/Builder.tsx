import { WordComposer } from "@/components/WordComposer"
import { Separator } from "@/components/ui/separator"

export default function BuilderPage() {
  return (
    <div className="space-y-10">
      <section className="grid gap-4 rounded-3xl border border-border/60 bg-card/80 p-6 shadow-lg shadow-black/20">
        <h1 className="text-3xl font-semibold">Script Builder</h1>
        <p className="text-muted-foreground">
          Type any word to translate it into New Runes. Gematria totals update in real time and bindings can wrap the entire word into a sigil-ready form.
        </p>
      </section>
      <WordComposer />
      <Separator />
      <section id="laws" className="space-y-3 rounded-3xl border border-border/40 bg-muted/20 p-6">
        <h2 className="text-2xl font-semibold">Glyph Laws Recap</h2>
        <ul className="list-disc space-y-2 pl-6 text-sm text-muted-foreground">
          <li>Chisel law: strokes remain locked to 0°, 45°, or 90° even after rotation, mirroring, or modifier hooks.</li>
          <li>Rotation sets: every rune supports lawful quarter turns plus echo mirrors; use the controls to explore variants.</li>
          <li>Dual identity: numeric values mirror Latin ordering and roll up into gematria totals shown beneath the script.</li>
          <li>Binding: square, diamond, and circle frames obey the silence axis. Break a binding to release energy without discarding the word.</li>
        </ul>
      </section>
    </div>
  )
}

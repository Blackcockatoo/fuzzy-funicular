import { MandalaEditor } from "@/components/MandalaEditor"

export default function MandalaPage() {
  return (
    <div className="space-y-8">
      <section className="grid gap-3 rounded-3xl border border-border/60 bg-card/80 p-6 shadow-lg shadow-black/20">
        <h1 className="text-3xl font-semibold">Mandala Mode</h1>
        <p className="text-muted-foreground">
          Arrange runes on polar guides. Every drag snaps to 45° spokes and calibrated rings, preserving chisel geometry. Export bindings for sigil work or reuse them in script mode.
        </p>
      </section>
      <MandalaEditor />
    </div>
  )
}

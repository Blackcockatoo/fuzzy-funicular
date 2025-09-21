import { VirmanaForge } from "@/components/VirmanaForge"

export default function VirmanaPage() {
  return (
    <div className="space-y-8">
      <section className="grid gap-3 rounded-3xl border border-border/60 bg-card/80 p-6 shadow-lg shadow-black/20">
        <h1 className="text-3xl font-semibold">Virmana Forge</h1>
        <p className="text-muted-foreground">
          Translate a mantra into a transport lattice. Choose from Flower of Life petals, Metatron cubes, trident yantras,
          Navagraha squares, and rangoli mosaics, then project each rune onto the geometry for exportable SVG or PNG sigils.
        </p>
      </section>
      <VirmanaForge />
    </div>
  )
}

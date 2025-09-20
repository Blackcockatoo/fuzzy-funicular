import { ArrowRight, Compass, PenTool, Sparkles } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="grid gap-8 rounded-3xl border border-border/60 bg-card/80 p-8 text-center shadow-lg shadow-black/20">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/60 bg-primary/10 text-primary shadow-digital-glow">
          <PenTool className="h-7 w-7" />
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold">New Runes Glyph Laboratory</h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Explore the full 29-rune alphabet, compose script lines with live gematria sums, and assemble radial sigils that obey the chisel law. Everything renders to lawful SVG that you can export instantly.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild variant="secondary" glow>
            <Link to="/alphabet" className="flex items-center gap-2">
              Browse alphabet <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/builder" className="flex items-center gap-2">
              Build a word <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/mandala" className="flex items-center gap-2">
              Craft a mandala <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
      <section className="grid gap-6 md:grid-cols-3">
        {[
          {
            title: "Chisel Law Engine",
            icon: <Sparkles className="h-5 w-5" />,
            body: "0° · 45° · 90° enforcement across rotations, mirrors, and modifiers. Illegal strokes simply cannot be created.",
          },
          {
            title: "Dual Identity",
            icon: <Compass className="h-5 w-5" />,
            body: "Every rune carries a Latin face and numeric map. Script Builder keeps running totals like a digital abacus.",
          },
          {
            title: "Sigil Binding",
            icon: <ArrowRight className="h-5 w-5" />,
            body: "Square, diamond, and octagonal circle frames wrap compositions. Break to release energy without deleting work.",
          },
        ].map((feature) => (
          <Card key={feature.title} className="bg-muted/30">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                {feature.icon}
              </div>
              <CardTitle>{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{feature.body}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </section>
      <section className="space-y-4 rounded-3xl border border-border/40 bg-muted/20 p-6">
        <Badge variant="outline" className="text-xs uppercase tracking-wide">Pipeline</Badge>
        <h2 className="text-2xl font-semibold">How to extend the alphabet</h2>
        <ol className="list-decimal space-y-2 pl-6 text-sm text-muted-foreground">
          <li>Add a new entry to <code>src/lib/data/runes.ts</code>. Strokes snap to the 5×5 grid and the helper checks enforce chisel angles.</li>
          <li>Attach phonemes, sequence hooks, and permitted modifier slots. The UI will automatically surface filters and ligatures.</li>
          <li>Run <code>npm run test</code> to ensure angles, transforms, numeric sums, and binding behaviour stay lawful.</li>
        </ol>
      </section>
    </div>
  )
}

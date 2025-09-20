import { Flame, PenTool, Spline } from "lucide-react"
import { NavLink, Route, Routes } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/ThemeToggle"
import AlphabetPage from "@/pages/Alphabet"
import BuilderPage from "@/pages/Builder"
import HomePage from "@/pages/Home"
import MandalaPage from "@/pages/Mandala"

const links = [
  { to: "/", label: "Home" },
  { to: "/alphabet", label: "Alphabet" },
  { to: "/builder", label: "Script Builder" },
  { to: "/mandala", label: "Mandala" },
]

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <NavLink to="/" className="flex items-center gap-2 text-lg font-semibold">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/50 bg-primary/10 text-primary shadow-digital-glow">
              <PenTool className="h-5 w-5" aria-hidden />
            </span>
            New Runes Lab
          </NavLink>
          <nav className="hidden items-center gap-2 md:flex">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-sm font-medium transition hover:text-primary ${isActive ? "bg-primary/10 text-primary shadow-digital-glow" : "text-muted-foreground"}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="ghost"
              className="hidden items-center gap-2 text-sm md:flex"
            >
              <a
                href="#laws"
                className="flex items-center gap-2"
                aria-label="Jump to rune laws documentation"
              >
                <Flame className="h-4 w-4" aria-hidden />
                Laws
              </a>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/alphabet" element={<AlphabetPage />} />
          <Route path="/builder" element={<BuilderPage />} />
          <Route path="/mandala" element={<MandalaPage />} />
        </Routes>
      </main>
      <Separator className="mt-12" />
      <footer className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Spline className="h-4 w-4" aria-hidden />
          Crafted with lawful strokes.
        </div>
        <p>
          Need more runic power? Extend <code>src/lib/data/runes.ts</code> and the engine will comply.
        </p>
      </footer>
    </div>
  )
}

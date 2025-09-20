import { createContext, useContext, useEffect, useMemo, useState } from "react"

type ThemeName = "stone" | "digital"

interface ThemeContextValue {
  theme: ThemeName
  setTheme: (theme: ThemeName) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const prefersDark = () =>
  window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches

function getInitialTheme(): ThemeName {
  if (typeof window === "undefined") return "stone"
  const stored = window.localStorage.getItem("new-runes-theme") as ThemeName | null
  if (stored === "stone" || stored === "digital") {
    return stored
  }
  return prefersDark() ? "digital" : "stone"
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(() => getInitialTheme())

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = theme
    root.classList.add("theme-transition")
    const timeout = window.setTimeout(() => root.classList.remove("theme-transition"), 220)
    window.localStorage.setItem("new-runes-theme", theme)
    return () => window.clearTimeout(timeout)
  }, [theme])

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme: setThemeState,
      toggleTheme: () => setThemeState((prev) => (prev === "stone" ? "digital" : "stone")),
    }),
    [theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}

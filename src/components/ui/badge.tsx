import * as React from "react"

import { cn } from "@/lib/utils"

const Badge = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement> & { variant?: "default" | "outline" | "holo" }>(
  ({ className, variant = "default", ...props }, ref) => {
    const styles = {
      default: "border-transparent bg-primary/10 text-primary shadow-digital-glow",
      outline: "border border-border/60 bg-transparent text-muted-foreground",
      holo: "border border-primary/40 bg-primary/5 text-primary",
    } as const
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
          styles[variant],
          className,
        )}
        {...props}
      />
    )
  },
)
Badge.displayName = "Badge"

export { Badge }

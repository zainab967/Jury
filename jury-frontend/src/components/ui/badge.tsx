import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-[2.5px] text-[13px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-h-[22px] min-w-[22px]", // small and round for chip use
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-muted text-muted-foreground hover:bg-muted/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        success: "border-transparent bg-[hsl(142,71%,92%)] text-[hsl(142,71%,35%)]",
        info: "border-transparent bg-[hsl(199,89%,92%)] text-[hsl(199,89%,35%)]",
        warning: "border-transparent bg-[hsl(38,92%,92%)] text-[hsl(38,92%,50%)]",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div data-status={variant} className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

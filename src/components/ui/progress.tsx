import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/shared/utils"
import { cva, type VariantProps } from "class-variance-authority"

const progressVariants = cva(
  "relative h-2 w-full overflow-hidden rounded-full bg-muted",
  {
    variants: {
      variant: {
        default: "",
        success: "bg-success/20",
        primary: "bg-primary/20",
      },
      size: {
        default: "h-2",
        sm: "h-1.5",
        lg: "h-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const progressIndicatorVariants = cva(
  "h-full w-full flex-1 transition-all duration-700 ease-in-out",
  {
    variants: {
      variant: {
        default: "bg-primary",
        success: "bg-gradient-to-r from-success to-success/80",
        primary: "bg-gradient-to-r from-primary to-primary-glow",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants> {
  indicatorVariant?: VariantProps<typeof progressIndicatorVariants>["variant"]
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, variant, size, indicatorVariant, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(progressVariants({ variant, size, className }))}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(progressIndicatorVariants({ variant: indicatorVariant || variant }))}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }

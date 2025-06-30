import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-normal disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background",
  {
    variants: {
      variant: {
        primary:
          "bg-primary hover:bg-primary-hover text-white focus:ring-primary hover:shadow-glow hover:scale-105",
        secondary:
          "bg-secondary hover:bg-secondary-hover text-white focus:ring-secondary hover:shadow-glow hover:scale-105",
        tertiary:
          "bg-transparent border border-primary text-primary hover:bg-primary/10 focus:ring-primary",
        danger:
          "bg-error hover:bg-error-dark text-white focus:ring-error hover:shadow-glow hover:scale-105",
        ghost:
          "bg-transparent text-text-secondary hover:bg-text-secondary/10 focus:ring-text-secondary",
        gradient:
          "bg-primary-gradient hover:opacity-90 text-white focus:ring-primary hover:shadow-glow hover:scale-105",
        // Legacy variants for compatibility
        default:
          "bg-primary hover:bg-primary-hover text-white focus:ring-primary hover:shadow-glow hover:scale-105",
        destructive:
          "bg-error hover:bg-error-dark text-white focus:ring-error hover:shadow-glow hover:scale-105",
        outline:
          "bg-transparent border border-primary text-primary hover:bg-primary/10 focus:ring-primary",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary-hover",
      },
      size: {
        sm: "h-8 px-3 py-1.5 text-sm rounded-md",
        default: "h-10 px-4 py-2 text-base rounded-lg",
        lg: "h-12 px-6 py-3 text-lg rounded-lg",
        xl: "h-14 px-8 py-4 text-xl rounded-xl",
        icon: "size-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "button"

  return (
    (<Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props} />)
  );
}

export { Button, buttonVariants }

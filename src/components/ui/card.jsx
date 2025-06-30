import * as React from "react"

import { cn } from "@/lib/utils"

function Card({
  className,
  variant = "default",
  hover = false,
  ...props
}) {
  const variants = {
    default: "bg-surface border-border shadow-lg",
    glassmorphism: "glassmorphism shadow-xl",
    elevated: "bg-surface border-border shadow-xl hover:shadow-2xl",
    flat: "bg-surface border-border",
  };

  const hoverStyles = hover ? "hover:scale-102 hover:shadow-glow animate-hover" : "";

  return (
    (<div
      data-slot="card"
      className={cn(
        "text-text-primary flex flex-col gap-6 rounded-lg border py-6 transition-all duration-normal",
        variants[variant],
        hoverStyles,
        className
      )}
      {...props} />)
  );
}

function CardHeader({
  className,
  ...props
}) {
  return (
    (<div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props} />)
  );
}

function CardTitle({
  className,
  ...props
}) {
  return (
    (<h3
      data-slot="card-title"
      className={cn("leading-none font-display font-semibold text-text-primary", className)}
      {...props} />)
  );
}

function CardDescription({
  className,
  ...props
}) {
  return (
    (<p
      data-slot="card-description"
      className={cn("text-text-secondary text-sm", className)}
      {...props} />)
  );
}

function CardAction({
  className,
  ...props
}) {
  return (
    (<div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props} />)
  );
}

function CardContent({
  className,
  ...props
}) {
  return (<div data-slot="card-content" className={cn("px-6", className)} {...props} />);
}

function CardFooter({
  className,
  ...props
}) {
  return (
    (<div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props} />)
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}

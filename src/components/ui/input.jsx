import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef(({
  className,
  type = "text",
  variant = "default",
  size = "md",
  error = false,
  ...props
}, ref) => {
  const baseStyles = "flex w-full font-medium transition-all duration-normal file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-secondary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50";

  const variants = {
    default: "bg-background border border-border text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/25",
    filled: "bg-surface border border-border text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/25",
    ghost: "bg-transparent border-0 text-text-primary focus:bg-surface/50",
  };

  const sizes = {
    sm: "h-8 px-3 py-1 text-sm rounded-md",
    md: "h-10 px-3 py-2 text-base rounded-lg",
    lg: "h-12 px-4 py-3 text-lg rounded-lg",
  };

  const errorStyles = error ? "border-error focus:border-error focus:ring-error/25" : "";

  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        errorStyles,
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = "Input";

const Textarea = React.forwardRef(({
  className,
  variant = "default",
  error = false,
  ...props
}, ref) => {
  const baseStyles = "flex min-h-[80px] w-full font-medium transition-all duration-normal placeholder:text-text-secondary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-none";

  const variants = {
    default: "bg-background border border-border text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/25 rounded-lg px-3 py-2",
    filled: "bg-surface border border-border text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/25 rounded-lg px-3 py-2",
    ghost: "bg-transparent border-0 text-text-primary focus:bg-surface/50 rounded-lg px-3 py-2",
  };

  const errorStyles = error ? "border-error focus:border-error focus:ring-error/25" : "";

  return (
    <textarea
      data-slot="textarea"
      className={cn(
        baseStyles,
        variants[variant],
        errorStyles,
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";

export { Input, Textarea }

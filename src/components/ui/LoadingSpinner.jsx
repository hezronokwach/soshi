"use client";

import { cn } from "@/lib/utils";

export default function LoadingSpinner({ 
  size = "md", 
  className,
  variant = "primary",
  ...props 
}) {
  const sizes = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8",
    xl: "h-12 w-12"
  };
  
  const variants = {
    primary: "border-primary border-t-transparent",
    secondary: "border-secondary border-t-transparent",
    white: "border-white border-t-transparent",
    muted: "border-text-secondary border-t-transparent"
  };
  
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2",
        sizes[size],
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export function LoadingDots({ className, ...props }) {
  return (
    <div className={cn("flex space-x-1", className)} {...props}>
      <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="h-2 w-2 bg-primary rounded-full animate-bounce"></div>
    </div>
  );
}

export function LoadingPulse({ className, ...props }) {
  return (
    <div className={cn("flex space-x-2", className)} {...props}>
      <div className="h-3 w-3 bg-primary rounded-full animate-pulse"></div>
      <div className="h-3 w-3 bg-primary rounded-full animate-pulse [animation-delay:0.2s]"></div>
      <div className="h-3 w-3 bg-primary rounded-full animate-pulse [animation-delay:0.4s]"></div>
    </div>
  );
}

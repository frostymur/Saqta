import React from "react";
import { cn } from "./button";

export function Badge({ className, variant = "default", children, ...props }) {
  const variants = {
    default: "bg-sky-100 text-sky-800 border-sky-300",
    secondary: "bg-slate-100 text-slate-700 border-slate-300",
    outline: "bg-transparent text-slate-700 border-slate-300",
    gold: "bg-amber-100 text-amber-900 border-amber-300",
    // МЧС РК light theme standards
    low: "text-green-700 bg-green-100 border-green-300",
    medium: "text-amber-800 bg-amber-100 border-amber-300",
    high: "text-red-800 bg-red-100 border-red-300 animate-pulse font-bold",
    offline: "text-slate-700 bg-slate-100 border-slate-300"
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors leading-normal",
        variants[variant] || variants.default,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

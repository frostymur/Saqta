import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const Button = React.forwardRef(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none";

    const variants = {
      default: "bg-sky-600 text-white hover:bg-sky-700 active:bg-sky-800 shadow-sm",
      govPrimary: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm",
      govNavy: "bg-[#0F2942] text-white hover:bg-[#1E3A8A] active:bg-blue-900 shadow-sm",
      gold: "bg-amber-500 text-slate-900 hover:bg-amber-400 font-semibold shadow-sm",
      secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200",
      outline: "border border-slate-300 bg-white hover:bg-slate-50 text-slate-700",
      ghost: "hover:bg-slate-100 text-slate-700",
      destructive: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
      link: "text-sky-600 underline-offset-4 hover:underline"
    };

    const sizes = {
      default: "h-9 px-4 py-2",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-11 rounded-lg px-6 text-base font-semibold",
      icon: "h-9 w-9 p-0"
    };

    return (
      <button
        className={cn(baseStyles, variants[variant] || variants.default, sizes[size] || sizes.default, className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

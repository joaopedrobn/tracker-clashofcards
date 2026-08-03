import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
}

const variants = {
  primary: "border-amber-300/50 bg-gradient-to-b from-amber-300 to-amber-500 text-stone-950 shadow-[0_4px_0_#9a5b0a] hover:brightness-110",
  secondary: "border-white/10 bg-white/7 text-stone-100 shadow-[0_3px_0_rgba(0,0,0,.35)] hover:bg-white/12",
  ghost: "border-transparent bg-transparent text-stone-300 hover:bg-white/8 hover:text-white",
  danger: "border-red-400/30 bg-red-500/12 text-red-200 hover:bg-red-500/20",
};

export function Button({ children, variant = "primary", size = "md", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl border font-black transition active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 ${size === "sm" ? "min-h-9 px-3 text-xs" : "min-h-11 px-4 text-sm"} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

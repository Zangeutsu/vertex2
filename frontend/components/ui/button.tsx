import { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline";
  children: ReactNode;
};

export function Button({ variant = "primary", className, children, ...rest }: Props) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400";
  const variants: Record<string, string> = {
    primary: "bg-emerald-700 text-white hover:bg-emerald-800 shadow-card",
    ghost: "text-emerald-800 hover:bg-emerald-50",
    outline: "border border-emerald-200 text-emerald-800 hover:bg-emerald-50",
  };
  return (
    <button className={clsx(base, variants[variant], className)} {...rest}>
      {children}
    </button>
  );
}

import { ReactNode } from "react";
import clsx from "clsx";

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx("overflow-hidden rounded-xl border border-emerald-50 shadow-card", className)}>
      <table className="min-w-full bg-white text-sm">{children}</table>
    </div>
  );
}

export function THead({ children, className }: { children: ReactNode; className?: string }) {
  return <thead className={clsx("bg-emerald-50/60 text-left text-xs uppercase text-emerald-900", className)}>{children}</thead>;
}

export function TBody({ children, className }: { children: ReactNode; className?: string }) {
  return <tbody className={clsx("divide-y divide-emerald-50", className)}>{children}</tbody>;
}

export function TR({ children, className }: { children: ReactNode; className?: string }) {
  return <tr className={clsx("hover:bg-emerald-50/50", className)}>{children}</tr>;
}

export function TH({ children, className }: { children: ReactNode; className?: string }) {
  return <th className={clsx("px-4 py-3 font-semibold", className)}>{children}</th>;
}

export function TD({ children, className, colSpan }: { children: ReactNode; className?: string; colSpan?: number }) {
  return <td className={clsx("px-4 py-3 text-slate-700", className)} colSpan={colSpan}>{children}</td>;
}

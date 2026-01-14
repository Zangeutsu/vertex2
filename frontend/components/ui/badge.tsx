import { ReactNode } from "react";
import clsx from "clsx";

type Props = {
  children: ReactNode;
  tone?: "success" | "warning" | "info";
};

export function Badge({ children, tone = "info" }: Props) {
  const styles: Record<string, string> = {
    success: "bg-emerald-100 text-emerald-800",
    warning: "bg-amber-100 text-amber-800",
    info: "bg-slate-100 text-slate-700",
  };
  return <span className={clsx("rounded-full px-3 py-1 text-xs font-semibold", styles[tone])}>{children}</span>;
}

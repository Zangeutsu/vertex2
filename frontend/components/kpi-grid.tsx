import { Activity, Clock, ShieldCheck, TrendingUp } from "lucide-react";
import { Card } from "./ui/card";
import clsx from "clsx";

type Kpi = {
  label: string;
  value: number | string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: "emerald" | "amber" | "indigo";
};

export function KpiGrid({ kpis }: { kpis: { active_workers: number; contracts_expiring_7d: number; compliance_pending: number } }) {
  const items: Kpi[] = [
    {
      label: "Missões Ativas",
      value: kpis.active_workers,
      description: "Colaboradores em campo",
      icon: Activity,
      color: "emerald",
    },
    {
      label: "Alertas de Risco",
      value: kpis.contracts_expiring_7d,
      description: "Expirações em 7 dias",
      icon: Clock,
      color: "amber",
    },
    {
      label: "Compliance Status",
      value: kpis.compliance_pending,
      description: "Pendentes de validação",
      icon: ShieldCheck,
      color: "indigo",
    },
  ];

  const colorStyles = {
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    amber: "bg-amber-50 text-amber-600 ring-amber-100",
    indigo: "bg-indigo-50 text-indigo-600 ring-indigo-100",
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {items.map((item) => (
        <Card key={item.label} className="group relative overflow-hidden transition-all hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-1">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className={clsx("inline-flex rounded-2xl p-3 ring-1", colorStyles[item.color])}>
                <item.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-4xl font-black text-slate-900 tracking-tight">{item.value}</p>
                  <span className="text-xs font-bold text-slate-400">total</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-slate-50 pt-4">
            <p className="text-xs font-semibold text-slate-400">{item.description}</p>
            <TrendingUp className="h-4 w-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className={clsx("absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-[0.03] transition-all group-hover:scale-150",
            item.color === "emerald" && "bg-emerald-600",
            item.color === "amber" && "bg-amber-600",
            item.color === "indigo" && "bg-indigo-600"
          )} />
        </Card>
      ))}
    </div>
  );
}

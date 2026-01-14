import { AlertTriangle, ChevronRight } from "lucide-react";
import { Card, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert } from "../lib/types";
import Link from "next/link";

export function AlertList({ alerts }: { alerts: Alert[] }) {
  const getHref = (alert: Alert) => {
    switch (alert.entity) {
      case "contract":
        return "/contracts";
      case "compliance":
        return "/compliance";
      default:
        return "/";
    }
  };

  return (
    <Card className="h-full">
      <CardHeader title="Alertas Prioritários" />
      <div className="space-y-4">
        {alerts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-slate-50 p-3 text-slate-400 mb-2">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <p className="text-sm text-slate-500 font-medium">Sem alertas críticos</p>
            <p className="text-xs text-slate-400">Tudo está em conformidade.</p>
          </div>
        )}
        {alerts.map((alert) => (
          <Link
            key={`${alert.entity}-${alert.reference_id}`}
            href={getHref(alert) as any}
            className="group flex items-start gap-3 rounded-xl border border-transparent p-3 hover:border-emerald-100 hover:bg-emerald-50/30 transition-all active:scale-[0.98]"
          >
            <div className="mt-1 rounded-full bg-amber-50 p-2 text-amber-600 group-hover:bg-amber-100 transition-colors">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <Badge tone={alert.priority >= 10 ? "warning" : "info"}>Prioridade {alert.priority}</Badge>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
              </div>
              <p className="text-sm font-semibold text-slate-800 line-clamp-2 leading-tight">
                {alert.title}
              </p>
              {alert.due_date && (
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-2">
                  Limite: {new Date(alert.due_date).toLocaleDateString()}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}

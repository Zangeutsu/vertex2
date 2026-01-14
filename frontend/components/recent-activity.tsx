"use client";

import { Activity, ActivityType } from "../lib/types";
import { UserPlus, FileSignature, Receipt, AlertCircle, CheckCircle2, Clock, ShieldCheck } from "lucide-react";
import clsx from "clsx";

interface Props {
    activities: Activity[];
}

export function RecentActivity({ activities }: Props) {
    const getIcon = (type: ActivityType) => {
        switch (type) {
            case "worker_created": return <UserPlus className="h-4 w-4" />;
            case "contract_signed": return <FileSignature className="h-4 w-4" />;
            case "invoice_generated": return <Receipt className="h-4 w-4" />;
            case "invoice_paid": return <CheckCircle2 className="h-4 w-4" />;
            case "compliance_overdue": return <AlertCircle className="h-4 w-4 text-rose-500" />;
            case "compliance_updated": return <ShieldCheck className="h-4 w-4" />;
            default: return <Clock className="h-4 w-4" />;
        }
    };

    const getColors = (type: ActivityType) => {
        switch (type) {
            case "worker_created": return "bg-blue-50 text-blue-600";
            case "contract_signed": return "bg-emerald-50 text-emerald-600";
            case "invoice_generated": return "bg-amber-50 text-amber-600";
            case "invoice_paid": return "bg-emerald-50 text-emerald-600";
            case "compliance_overdue": return "bg-rose-50 text-rose-600";
            case "compliance_updated": return "bg-indigo-50 text-indigo-600";
            default: return "bg-slate-50 text-slate-600";
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider px-2">Atividade Recente</h3>
            <div className="space-y-3">
                {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-3 group">
                        <div className={clsx("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ring-slate-200/10", getColors(activity.type))}>
                            {getIcon(activity.type)}
                        </div>
                        <div className="flex flex-col border-b border-slate-50 pb-3 w-full group-last:border-0">
                            <p className="text-sm font-medium text-slate-900 leading-tight">
                                {activity.description}
                            </p>
                            <span className="text-[10px] text-slate-400 font-medium">
                                {new Date(activity.created_at).toLocaleString()}
                            </span>
                        </div>
                    </div>
                ))}
                {activities.length === 0 && (
                    <p className="text-xs text-slate-400 italic px-2">Sem atividade registada.</p>
                )}
            </div>
        </div>
    );
}

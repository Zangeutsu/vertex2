"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { cn } from "../../lib/utils";
import { Briefcase, Users, Building2, CheckCircle2, Loader2, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { SkeletonKPIGrid } from "../../components/ui/skeleton";

export default function Dashboard() {
  const [stats, setStats] = useState({
    workers: 0,
    clients: 0,
    jobs: 0,
    assignments: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const [w, c, j, a] = await Promise.all([
        supabase.from('workers').select('id', { count: 'exact', head: true }),
        supabase.from('clients').select('id', { count: 'exact', head: true }),
        supabase.from('job_orders').select('id', { count: 'exact', head: true }),
        supabase.from('assignments').select('id', { count: 'exact', head: true })
      ]);
      setStats({
        workers: w.count || 0,
        clients: c.count || 0,
        jobs: j.count || 0,
        assignments: a.count || 0
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6 pb-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
          <LayoutGrid className="h-2.5 w-2.5" />
          <span>Consola de Comando</span>
        </div>
        <h1 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-0.5">
          Vertex <span className="text-emerald-600">Workforce</span>
        </h1>
        <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-medium max-w-2xl leading-none">
          Coordenação inteligente de recursos e alocação de equipas.
        </p>
      </div>

      {loading ? (
        <SkeletonKPIGrid />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatCard title="Total Staff" value={stats.workers} icon={<Users />} color="bg-slate-900 dark:bg-white" textColor="text-white dark:text-slate-900" />
          <StatCard title="Clientes" value={stats.clients} icon={<Building2 />} color="bg-emerald-500" textColor="text-white" />
          <StatCard title="Pedidos" value={stats.jobs} icon={<Briefcase />} color="bg-amber-500" textColor="text-white" />
          <StatCard title="Alocações" value={stats.assignments} icon={<CheckCircle2 />} color="bg-indigo-500" textColor="text-white" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-md md:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Atalhos Operacionais
            </h2>
            <div className="h-px flex-1 mx-4 bg-slate-100 dark:bg-slate-800" />
          </div>
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            <QuickLink href="/workers" title="Staff" subtitle="Perfis" />
            <QuickLink href="/job-orders" title="Pedidos" subtitle="Procura" />
            <QuickLink href="/dispatch" title="Dispatch" subtitle="Operação" />
            <QuickLink href="/clients" title="Clientes" subtitle="Unidades" />
          </div>
        </div>

        <div className="relative overflow-hidden bg-slate-900 dark:bg-slate-950 rounded-2xl p-4 md:p-6 text-white space-y-4 flex flex-col justify-center border border-white/5 shadow-xl">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <CheckCircle2 size={120} className="text-white" />
          </div>
          <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-lg w-fit border border-white/10">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="space-y-1 relative z-10">
            <h2 className="text-xl md:text-2xl font-black tracking-tight leading-tight">Infraestrutura</h2>
            <p className="text-slate-400 font-bold uppercase text-[8px] tracking-[0.2em]">Supabase & PostgreSQL</p>
          </div>
          <p className="text-slate-300 text-[10px] leading-relaxed max-w-sm relative z-10 font-medium">
            Sistema MVP operacional com RLS e integridade garantida.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, textColor }: any) {
  return (
    <div className="group bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-300">
      <div className={cn("p-2.5 rounded-xl w-fit mb-4 shadow-md", color, textColor)}>
        {React.cloneElement(icon, { size: 18, className: "w-4.5 h-4.5" })}
      </div>
      <div className="space-y-1">
        <div className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white leading-none tracking-tight">{value}</div>
        <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">{title}</div>
      </div>
    </div>
  );
}

function QuickLink({ href, title, subtitle }: any) {
  return (
    <Link href={href} className="group p-4 md:p-5 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-xl hover:bg-slate-900 dark:hover:bg-white transition-colors">
      <div className="font-black text-slate-900 dark:text-white group-hover:text-white dark:group-hover:text-slate-900 uppercase tracking-tight leading-none mb-1 text-sm transition-colors">{title}</div>
      <div className="text-[9px] font-bold text-slate-400 group-hover:text-white/60 dark:group-hover:text-slate-500 uppercase tracking-widest transition-colors">{subtitle}</div>
    </Link>
  );
}

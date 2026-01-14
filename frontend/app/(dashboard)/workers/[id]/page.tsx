"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import { Worker, Assignment } from "../../../../lib/types";
import { useParams, useRouter } from "next/navigation";
import {
    ChevronLeft,
    Calendar,
    Globe,
    Mail,
    FileText,
    ExternalLink,
    Clock,
    MapPin,
    AlertCircle
} from "lucide-react";
import { cn } from "../../../../lib/utils";

export default function WorkerDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [worker, setWorker] = useState<Worker | null>(null);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchWorkerData = async () => {
        setLoading(true);
        const { data: workerData } = await supabase
            .from('workers')
            .select('*, profiles(*)')
            .eq('id', id)
            .single();

        const { data: assignmentsData } = await supabase
            .from('assignments')
            .select('*, job_order:job_orders(*, site:sites(*), client:clients(*))')
            .eq('worker_id', id)
            .order('created_at', { ascending: false });

        setWorker(workerData as any);
        setAssignments(assignmentsData as any || []);
        setLoading(false);
    };

    useEffect(() => {
        if (id) fetchWorkerData();
    }, [id]);

    if (loading) return <div className="p-12 text-center text-slate-400 font-black uppercase text-xs tracking-widest">Carregando...</div>;
    if (!worker) return <div className="p-12 text-center text-red-500 font-black uppercase text-xs tracking-widest">Colaborador não encontrado</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="bg-white p-3 rounded-2xl border border-slate-200 text-slate-400 hover:text-slate-900 transition-all shadow-sm active:scale-95"
                        aria-label="Voltar"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Ficha de Funcionário</h1>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">ID: {worker.id}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className={cn(
                        "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm",
                        worker.status === 'active' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                    )}>
                        {worker.status}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-2xl shadow-slate-200/50">
                        <div className="h-48 bg-slate-900 relative">
                            <div className="absolute -bottom-12 left-8 h-24 w-24 rounded-3xl bg-white p-1 shadow-xl">
                                <div className="h-full w-full rounded-[1.25rem] bg-slate-100 flex items-center justify-center font-black text-slate-500 text-2xl border border-slate-100 overflow-hidden">
                                    {worker.profiles?.avatar_url ? (
                                        <img src={worker.profiles.avatar_url} className="w-full h-full object-cover" alt="Profile" />
                                    ) : (
                                        worker.first_name[0]
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="px-8 pt-16 pb-8 space-y-6">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">{worker.first_name} {worker.last_name}</h2>
                                <p className="text-slate-500 font-medium">{worker.profiles?.email}</p>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                                        <Calendar className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Data Nasc.</div>
                                        <div className="text-sm font-bold text-slate-700">{worker.date_of_birth || 'Não definida'}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                                        <MapPin className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Cidade</div>
                                        <div className="text-sm font-bold text-slate-700">{worker.city || 'Transversal'}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                                        <Globe className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Línguas</div>
                                        <div className="text-sm font-bold text-slate-700">{(worker.languages || []).join(", ") || 'Nenhuma'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Documents Panel */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
                        <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-slate-400" /> Documentação
                        </h3>
                        <div className="space-y-3">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-slate-300 transition-all cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <FileText className="h-4 w-4 text-slate-400" />
                                    <span className="text-sm font-bold text-slate-700">Identificação</span>
                                </div>
                                <ExternalLink className="h-4 w-4 text-slate-300 group-hover:text-slate-900" />
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-slate-300 transition-all cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <FileText className="h-4 w-4 text-slate-400" />
                                    <span className="text-sm font-bold text-slate-700">Contrato</span>
                                </div>
                                <ExternalLink className="h-4 w-4 text-slate-300 group-hover:text-slate-900" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Assignments History */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
                        <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-8 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-slate-400" /> Histórico de Alocações
                        </h3>

                        <div className="space-y-4">
                            {assignments.map((assignment) => (
                                <div key={assignment.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-slate-200 transition-all">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <div className="font-black text-slate-900 text-lg">{(assignment as any).job_order?.title}</div>
                                            <div className="flex items-center gap-2 text-slate-400 mt-1">
                                                <MapPin className="h-3 w-3" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">{(assignment as any).job_order?.site?.name}</span>
                                            </div>
                                        </div>
                                        <span className={cn(
                                            "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shrink-0",
                                            assignment.status === 'confirmed' ? "bg-emerald-100 text-emerald-700" :
                                                assignment.status === 'proposed' ? "bg-amber-100 text-amber-700" : "bg-slate-200 text-slate-500"
                                        )}>
                                            {assignment.status}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                                        <div>
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Início</div>
                                            <div className="text-xs font-bold text-slate-700">{new Date((assignment as any).job_order?.start_at).toLocaleDateString()}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cliente</div>
                                            <div className="text-xs font-bold text-slate-700">{(assignment as any).job_order?.client?.name}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {assignments.length === 0 && (
                                <div className="text-center py-12 text-slate-300">
                                    <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                    <p className="font-black uppercase text-[10px] tracking-widest">Sem alocações registadas</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

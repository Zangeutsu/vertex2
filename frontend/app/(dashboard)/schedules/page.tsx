"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { Assignment, Client, JobOrder } from "../../../lib/types";
import { cn } from "../../../lib/utils";
import {
    CalendarDays,
    Download,
    Search,
    Filter,
    Users,
    Building2,
    Clock,
    CheckCircle2,
    Circle,
    XCircle,
    Loader2,
    FileSpreadsheet
} from "lucide-react";
import { format, startOfWeek, endOfWeek, addDays, isWithinInterval, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import * as XLSX from "xlsx";

interface EnrichedAssignment {
    id: string;
    job_order_id: string;
    worker_id: string;
    status: string;
    created_at: string;
    job_order: {
        id: string;
        client_id: string;
        title: string;
        start_at: string;
        end_at: string;
        needed_count: number;
        client: { name: string };
        site: { name: string };
        role: { name: string };
    };
    worker: {
        id: string;
        first_name: string;
        last_name: string;
        languages: string[];
        profiles?: { avatar_url: string | null };
    };
}

export default function SchedulesPage() {
    const [assignments, setAssignments] = useState<EnrichedAssignment[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedClient, setSelectedClient] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");
    const [dateRange, setDateRange] = useState({
        start: format(startOfWeek(new Date(), { locale: pt }), "yyyy-MM-dd"),
        end: format(endOfWeek(new Date(), { locale: pt }), "yyyy-MM-dd"),
    });
    const [exporting, setExporting] = useState(false);

    const fetchAssignments = async () => {
        setLoading(true);

        const { data, error } = await supabase
            .from("assignments")
            .select(`
        *,
        worker:workers(id, first_name, last_name, languages, profiles(avatar_url)),
        job_order:job_orders(
          *,
          client:clients(name),
          site:sites(name),
          role:roles(name)
        )
      `)
            .order("created_at", { ascending: false });

        if (!error && data) {
            setAssignments(data as any);
        }
        setLoading(false);
    };

    const fetchClients = async () => {
        const { data } = await supabase.from("clients").select("*");
        if (data) setClients(data as any);
    };

    useEffect(() => {
        fetchAssignments();
        fetchClients();
    }, []);

    // Filter assignments
    const filteredAssignments = assignments.filter((a) => {
        // Search filter
        const workerName = `${a.worker?.first_name} ${a.worker?.last_name}`.toLowerCase();
        const clientName = a.job_order?.client?.name?.toLowerCase() || "";
        const matchesSearch =
            workerName.includes(searchQuery.toLowerCase()) ||
            clientName.includes(searchQuery.toLowerCase());

        // Client filter
        const matchesClient = !selectedClient || a.job_order?.client_id === selectedClient;

        // Status filter
        const matchesStatus = !selectedStatus || a.status === selectedStatus;

        // Date range filter
        const jobStart = a.job_order?.start_at ? parseISO(a.job_order.start_at) : null;
        const jobEnd = a.job_order?.end_at ? parseISO(a.job_order.end_at) : null;
        const rangeStart = parseISO(dateRange.start);
        const rangeEnd = parseISO(dateRange.end);

        // Se não tiver fim, consideramos que continua (ex: 2099)
        const effectiveJobEnd = jobEnd || new Date(2099, 11, 31);

        const matchesDate = jobStart && (
            jobStart <= rangeEnd && effectiveJobEnd >= rangeStart
        );

        return matchesSearch && matchesClient && matchesStatus && matchesDate;
    });

    // Group by job order
    const groupedByJob: Record<string, EnrichedAssignment[]> = {};
    filteredAssignments.forEach((a) => {
        const jobId = a.job_order_id;
        if (!groupedByJob[jobId]) groupedByJob[jobId] = [];
        groupedByJob[jobId].push(a);
    });

    // Export to Excel
    const exportToExcel = () => {
        setExporting(true);

        const data = filteredAssignments.map((a) => ({
            "Trabalhador": `${a.worker?.first_name} ${a.worker?.last_name}`,
            "Cliente": a.job_order?.client?.name || "",
            "Local": a.job_order?.site?.name || "",
            "Função": a.job_order?.role?.name || "",
            "Pedido": a.job_order?.title || "",
            "Início": a.job_order?.start_at ? format(parseISO(a.job_order.start_at), "dd/MM/yyyy HH:mm") : "",
            "Fim": a.job_order?.end_at ? format(parseISO(a.job_order.end_at), "dd/MM/yyyy HH:mm") : "",
            "Estado": getStatusLabel(a.status),
            "Línguas": a.worker?.languages?.join(", ") || "",
            "Data Alocação": format(parseISO(a.created_at), "dd/MM/yyyy HH:mm"),
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Escalas");

        // Auto-size columns
        const colWidths = Object.keys(data[0] || {}).map((key) => ({
            wch: Math.max(key.length, ...data.map((row) => String((row as any)[key]).length)) + 2,
        }));
        ws["!cols"] = colWidths;

        const fileName = `escalas_${format(new Date(), "yyyy-MM-dd_HHmm")}.xlsx`;
        XLSX.writeFile(wb, fileName);

        setExporting(false);
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            proposed: "Proposto",
            confirmed: "Confirmado",
            completed: "Concluído",
            no_show: "Faltou",
            cancelled: "Cancelado",
        };
        return labels[status] || status;
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "confirmed":
                return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
            case "proposed":
                return <Circle className="h-4 w-4 text-amber-500" />;
            case "completed":
                return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
            case "cancelled":
            case "no_show":
                return <XCircle className="h-4 w-4 text-red-500" />;
            default:
                return <Circle className="h-4 w-4 text-slate-400" />;
        }
    };

    const stats = {
        total: filteredAssignments.length,
        confirmed: filteredAssignments.filter((a) => a.status === "confirmed").length,
        proposed: filteredAssignments.filter((a) => a.status === "proposed").length,
        jobs: Object.keys(groupedByJob).length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Escalas & Alocações
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                        Visualize e exporte os trabalhadores escalados
                    </p>
                </div>
                <button
                    onClick={exportToExcel}
                    disabled={exporting || filteredAssignments.length === 0}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 transition-all shadow-sm active:scale-95"
                >
                    {exporting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <FileSpreadsheet className="h-5 w-5" />
                    )}
                    Exportar Excel
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.total}</div>
                            <div className="text-xs font-bold text-slate-400 uppercase">Alocações</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.confirmed}</div>
                            <div className="text-xs font-bold text-slate-400 uppercase">Confirmados</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.proposed}</div>
                            <div className="text-xs font-bold text-slate-400 uppercase">Pendentes</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                            <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.jobs}</div>
                            <div className="text-xs font-bold text-slate-400 uppercase">Pedidos</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Pesquisar trabalhador ou cliente..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-none ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-500 outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Client Filter */}
                    <select
                        className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-none ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-500 outline-none"
                        value={selectedClient}
                        onChange={(e) => setSelectedClient(e.target.value)}
                        title="Filtrar por cliente"
                    >
                        <option value="">Todos os Clientes</option>
                        {clients.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>

                    {/* Status Filter */}
                    <select
                        className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-none ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-500 outline-none"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        title="Filtrar por estado"
                    >
                        <option value="">Todos os Estados</option>
                        <option value="confirmed">Confirmado</option>
                        <option value="proposed">Proposto</option>
                        <option value="completed">Concluído</option>
                        <option value="cancelled">Cancelado</option>
                    </select>

                    {/* Date Range */}
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            className="px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border-none ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-500 outline-none"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            title="Data início"
                        />
                        <span className="text-slate-400">-</span>
                        <input
                            type="date"
                            className="px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border-none ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-500 outline-none"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            title="Data fim"
                        />
                    </div>
                </div>
            </div>

            {/* Assignments List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                    </div>
                ) : Object.keys(groupedByJob).length === 0 ? (
                    <div className="text-center py-20 text-slate-400">
                        <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-40" />
                        <p className="font-bold uppercase text-xs tracking-widest">Sem escalas neste período</p>
                    </div>
                ) : (
                    Object.entries(groupedByJob).map(([jobId, jobAssignments]) => {
                        const job = jobAssignments[0]?.job_order;
                        return (
                            <div key={jobId} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                {/* Job Header */}
                                <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                        <div>
                                            <h3 className="font-black text-slate-900 dark:text-white text-lg">{job?.title}</h3>
                                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                <Building2 className="h-4 w-4" />
                                                <span>{job?.client?.name}</span>
                                                <span>•</span>
                                                <span>{job?.site?.name}</span>
                                                <span>•</span>
                                                <span className="font-bold">{job?.role?.name}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm">
                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                <CalendarDays className="h-4 w-4" />
                                                <span>
                                                    {job?.start_at && format(parseISO(job.start_at), "dd MMM", { locale: pt })}
                                                    {" - "}
                                                    {job?.end_at && format(parseISO(job.end_at), "dd MMM HH:mm", { locale: pt })}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-700 px-3 py-1 rounded-full">
                                                <Users className="h-3.5 w-3.5" />
                                                <span className="font-bold text-xs">{jobAssignments.length}/{job?.needed_count}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Workers */}
                                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {jobAssignments.map((a) => (
                                        <div key={a.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-sm overflow-hidden">
                                                    {a.worker?.profiles?.avatar_url ? (
                                                        <img src={a.worker.profiles.avatar_url} alt="" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <>{a.worker?.first_name?.[0]}{a.worker?.last_name?.[0]}</>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 dark:text-white">
                                                        {a.worker?.first_name} {a.worker?.last_name}
                                                    </div>
                                                    <div className="text-xs text-slate-400">
                                                        {a.worker?.languages?.join(", ")}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(a.status)}
                                                <span className={cn(
                                                    "text-xs font-bold uppercase px-2 py-1 rounded-full",
                                                    a.status === "confirmed" && "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
                                                    a.status === "proposed" && "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
                                                    a.status === "completed" && "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
                                                    (a.status === "cancelled" || a.status === "no_show") && "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                                )}>
                                                    {getStatusLabel(a.status)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

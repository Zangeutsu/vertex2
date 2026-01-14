"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { JobOrder, Client, Site, Role } from "../../../lib/types";
import { cn } from "../../../lib/utils";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Modal } from "@/components/ui/modal";
import Link from "next/link";
import { Building2, Plus, Search, Calendar, ChevronRight, Briefcase, Edit, Trash2, Loader2, MapPin, Users, ChevronDown, ChevronUp } from "lucide-react";
import { AllocationBoard } from "@/components/allocation-board";

import { ALGARVE_CITIES } from "@/lib/constants";

export default function JobOrdersPage() {
    const [jobs, setJobs] = useState<JobOrder[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedJob, setSelectedJob] = useState<JobOrder | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dragOverJob, setDragOverJob] = useState<string | null>(null);
    const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const [formData, setFormData] = useState({
        title: "",
        client_id: "",
        site_id: "",
        role_id: "",
        city: "",
        start_at: "",
        end_at: "",
        needed_count: "1",
        status: "open" as JobOrder["status"],
        notes: "",
        // New scheduling fields
        schedule_type: "one_time" as JobOrder["schedule_type"],
        start_time: "",
        end_time: "",
        duration_hours: "",
        work_days: [] as number[],
        weekdays_only: false,
        weekends_only: false,
    });

    const [assignmentCounts, setAssignmentCounts] = useState<Record<string, { proposed: number; confirmed: number }>>({});

    const [assignmentsList, setAssignmentsList] = useState<Record<string, any[]>>({});

    const fetchJobs = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('job_orders')
            .select(`*, client:clients(name), site:sites(name), role:roles(name)`);
        if (!error) setJobs(data as any || []);

        // Fetch assignments with worker details for the cards
        const { data: assignments } = await supabase
            .from('assignments')
            .select(`
                job_order_id, 
                status,
                worker:workers(first_name, last_name, profiles(avatar_url))
            `);

        const counts: Record<string, { proposed: number; confirmed: number }> = {};
        const list: Record<string, any[]> = {};

        (assignments || []).forEach((a: any) => {
            // Update counts
            if (!counts[a.job_order_id]) counts[a.job_order_id] = { proposed: 0, confirmed: 0 };
            if (a.status === 'proposed') counts[a.job_order_id].proposed++;
            if (a.status === 'confirmed' || a.status === 'completed') counts[a.job_order_id].confirmed++;

            // Update list for avatars/names
            if (!list[a.job_order_id]) list[a.job_order_id] = [];
            list[a.job_order_id].push(a);
        });

        setAssignmentCounts(counts);
        setAssignmentsList(list);
        setLoading(false);
    };

    const fetchDropdownData = async () => {
        const [clientsRes, rolesRes] = await Promise.all([
            supabase.from('clients').select('*'),
            supabase.from('roles').select('*'),
        ]);
        if (clientsRes.data) setClients(clientsRes.data as any);
        if (rolesRes.data) setRoles(rolesRes.data as any);
    };

    const fetchSitesForClient = async (clientId: string) => {
        const { data } = await supabase.from('sites').select('*').eq('client_id', clientId);
        setSites(data as any || []);
    };

    useEffect(() => {
        fetchJobs();
        fetchDropdownData();
    }, []);

    useEffect(() => {
        if (formData.client_id) fetchSitesForClient(formData.client_id);
        else setSites([]);
    }, [formData.client_id]);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const resetForm = () => {
        setFormData({
            title: "", client_id: "", site_id: "", role_id: "", city: "", start_at: "", end_at: "",
            needed_count: "1", status: "open", notes: "",
            schedule_type: "one_time", start_time: "", end_time: "", duration_hours: "",
            work_days: [], weekdays_only: false, weekends_only: false
        });
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('job_orders').insert({
                title: formData.title,
                client_id: formData.client_id,
                site_id: formData.site_id,
                role_id: formData.role_id,
                city: formData.city,
                start_at: new Date(formData.start_at).toISOString(),
                end_at: formData.end_at ? new Date(formData.end_at).toISOString() : null,
                needed_count: parseInt(formData.needed_count),
                status: formData.status,
                notes: formData.notes || null,
                schedule_type: formData.schedule_type,
                start_time: formData.start_time || null,
                end_time: formData.end_time || null,
                duration_hours: formData.duration_hours ? parseFloat(formData.duration_hours) : null,
                work_days: formData.work_days.length > 0 ? formData.work_days : null,
                weekdays_only: formData.weekdays_only,
                weekends_only: formData.weekends_only,
            });
            if (error) throw error;
            setToast({ message: "Pedido criado com sucesso!", type: "success" });
            setIsCreateModalOpen(false);
            resetForm();
            fetchJobs();
        } catch (error: any) {
            setToast({ message: error.message || "Erro ao criar pedido", type: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedJob) return;
        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('job_orders')
                .update({
                    title: formData.title,
                    client_id: formData.client_id,
                    site_id: formData.site_id,
                    role_id: formData.role_id,
                    city: formData.city,
                    start_at: new Date(formData.start_at).toISOString(),
                    end_at: formData.end_at ? new Date(formData.end_at).toISOString() : null,
                    needed_count: parseInt(formData.needed_count),
                    status: formData.status,
                    notes: formData.notes || null,
                    schedule_type: formData.schedule_type,
                    start_time: formData.start_time || null,
                    end_time: formData.end_time || null,
                    duration_hours: formData.duration_hours ? parseFloat(formData.duration_hours) : null,
                    work_days: formData.work_days.length > 0 ? formData.work_days : null,
                    weekdays_only: formData.weekdays_only,
                    weekends_only: formData.weekends_only,
                })
                .eq('id', selectedJob.id);
            if (error) throw error;
            setToast({ message: "Pedido atualizado!", type: "success" });
            setIsEditModalOpen(false);
            setSelectedJob(null);
            resetForm();
            fetchJobs();
        } catch (error: any) {
            setToast({ message: error.message || "Erro ao atualizar", type: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDropOnJob = async (e: React.DragEvent, jobId: string) => {
        e.preventDefault();
        setDragOverJob(null);
        const workerData = e.dataTransfer.getData('worker');
        if (!workerData) return;

        try {
            const worker = JSON.parse(workerData);
            const targetJob = jobs.find(j => j.id === jobId);
            if (!targetJob) return;

            // Check for overlaps
            const currentStart = new Date(targetJob.start_at);
            const currentEnd = targetJob.end_at ? new Date(targetJob.end_at) : new Date(currentStart.getTime() + 4 * 60 * 60 * 1000);

            const { data: assignments } = await supabase
                .from("assignments")
                .select(`id, status, job_order:job_orders(id, title, start_at, end_at)`)
                .eq("worker_id", worker.id)
                .in("status", ["proposed", "confirmed"]);

            if (assignments) {
                for (const a of assignments) {
                    const otherJob = (a as any).job_order;
                    if (!otherJob || otherJob.id === jobId) continue;

                    const otherStart = new Date(otherJob.start_at);
                    const otherEnd = otherJob.end_at ? new Date(otherJob.end_at) : new Date(otherStart.getTime() + 4 * 60 * 60 * 1000);

                    if (currentStart < otherEnd && currentEnd > otherStart) {
                        setToast({
                            message: `Conflito: ${worker.first_name} já está no serviço "${otherJob.title}" neste horário.`,
                            type: "error"
                        });
                        return;
                    }
                }
            }

            const { error } = await supabase
                .from('assignments')
                .insert({
                    job_order_id: jobId,
                    worker_id: worker.id,
                    status: 'proposed',
                    proposed_at: new Date().toISOString(),
                });

            if (error) {
                if (error.code === '23505') {
                    setToast({ message: "Trabalhador já alocado a este pedido!", type: "error" });
                } else {
                    throw error;
                }
            } else {
                setToast({ message: `${worker.first_name} proposto com sucesso!`, type: "success" });
                fetchJobs();
                window.dispatchEvent(new CustomEvent('workforce-update'));
            }
        } catch (err: any) {
            setToast({ message: err.message || "Erro ao alocar", type: "error" });
        }
    };

    const handleDelete = async () => {
        if (!selectedJob) return;
        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('job_orders').delete().eq('id', selectedJob.id);
            if (error) throw error;
            setToast({ message: "Pedido eliminado!", type: "success" });
            setIsDeleteModalOpen(false);
            setSelectedJob(null);
            fetchJobs();
        } catch (error: any) {
            setToast({ message: error.message || "Erro ao eliminar", type: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEditModal = (job: JobOrder) => {
        setSelectedJob(job);
        setFormData({
            title: job.title,
            client_id: job.client_id,
            site_id: job.site_id,
            role_id: job.role_id,
            city: job.city || "",
            start_at: format(new Date(job.start_at), "yyyy-MM-dd'T'HH:mm"),
            end_at: job.end_at ? format(new Date(job.end_at), "yyyy-MM-dd'T'HH:mm") : "",
            needed_count: job.needed_count.toString(),
            status: job.status,
            notes: job.notes || "",
            schedule_type: job.schedule_type || "one_time",
            start_time: job.start_time || "",
            end_time: job.end_time || "",
            duration_hours: job.duration_hours?.toString() || "",
            work_days: job.work_days || [],
            weekdays_only: job.weekdays_only || false,
            weekends_only: job.weekends_only || false,
        });
        setIsEditModalOpen(true);
    };

    const filteredJobs = jobs.filter(j =>
        j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (j as any).client?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.city?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Grouping logic: City -> Client -> Jobs
    const groupedByCity: Record<string, Record<string, JobOrder[]>> = {};
    const demandSummary: Record<string, Record<string, number>> = {};

    filteredJobs.forEach(job => {
        const city = job.city || "Sem Localização";
        const clientName = (job as any).client?.name || "Sem Cliente";
        const roleName = (job as any).role?.name || "Sem Função";

        if (!groupedByCity[city]) groupedByCity[city] = {};
        if (!groupedByCity[city][clientName]) groupedByCity[city][clientName] = [];
        groupedByCity[city][clientName].push(job);

        // Update demand summary
        if (!demandSummary[city]) demandSummary[city] = {};
        demandSummary[city][roleName] = (demandSummary[city][roleName] || 0) + job.needed_count;
    });

    const sortedCities = Object.keys(groupedByCity).sort();


    return (
        <div className="space-y-6 pb-10">
            {/* Header with improved hierarchy */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-0.5">
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                        <Briefcase className="h-2.5 w-2.5" />
                        <span>Gestão Operacional</span>
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                        Pedidos de <span className="text-emerald-600">Trabalho</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] font-medium">
                        Coordenação geográfica e alocação de recursos.
                    </p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsCreateModalOpen(true); }}
                    className="flex items-center justify-center gap-2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-4 py-2.5 rounded-lg font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
                >
                    <Plus className="h-3.5 w-3.5" /> Novo Pedido
                </button>
            </div>

            {/* Demand Summary Section - More compact grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {Object.entries(demandSummary).map(([city, roles]) => (
                    <div key={city} className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-3.5 shadow-sm transition-all cursor-default">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-lg">
                                <MapPin className="h-3 w-3" />
                            </div>
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">{city}</h3>
                        </div>
                        <div className="space-y-1.5">
                            {Object.entries(roles).map(([role, count]) => (
                                <div key={role} className="flex items-center justify-between gap-2">
                                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight truncate flex-1">{role}</span>
                                    <span className="flex items-center justify-center min-w-[1.4rem] h-5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-200 text-[9px] font-black rounded-md border border-slate-100 dark:border-slate-700">
                                        {count}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800/50 overflow-hidden backdrop-blur-sm">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 dark:bg-slate-900/50">
                    <div className="relative flex-1 max-w-md group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Pesquisar..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border-none ring-1 ring-slate-200 dark:ring-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            {filteredJobs.length} Processos
                        </span>
                    </div>
                </div>

                <div className="p-4 md:p-6 space-y-8">
                    {sortedCities.map(city => (
                        <div key={city} className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg">
                                    <MapPin className="h-3 w-3" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.1em]">{city}</span>
                                </div>
                                <div className="h-px flex-1 bg-gradient-to-r from-slate-200 dark:from-slate-800 to-transparent" />
                            </div>

                            <div className="space-y-6">
                                {Object.entries(groupedByCity[city]).map(([clientName, clientJobs]) => (
                                    <div key={clientName} className="space-y-4">
                                        <div className="flex items-center gap-2 px-1">
                                            <div className="h-7 w-7 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700">
                                                <Building2 className="h-3.5 w-3.5 text-emerald-600" />
                                            </div>
                                            <div>
                                                <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">{clientName}</h4>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{clientJobs.length} Pedidos</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {clientJobs.map((job) => (
                                                <div
                                                    key={job.id}
                                                    onDragOver={(e) => {
                                                        e.preventDefault();
                                                        if (dragOverJob !== job.id) setDragOverJob(job.id);
                                                    }}
                                                    onDragLeave={() => setDragOverJob(null)}
                                                    onDrop={(e) => handleDropOnJob(e, job.id)}
                                                    className={cn(
                                                        "group relative flex flex-col bg-white dark:bg-slate-900 border rounded-xl p-4 transition-all",
                                                        dragOverJob === job.id
                                                            ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 scale-[1.01] ring-2 ring-emerald-500/20"
                                                            : "border-slate-100 dark:border-slate-800 hover:border-emerald-500/50",
                                                        expandedJobId === job.id && "md:col-span-2 lg:col-span-3 ring-1 ring-slate-200 dark:ring-slate-700 bg-slate-50/30 dark:bg-slate-800/20"
                                                    )}
                                                >
                                                    {/* Hover Action Overlay */}
                                                    <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                        <button title="Editar Pedido" onClick={() => openEditModal(job)} className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 hover:text-emerald-600 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 transition-all"><Edit className="h-3 w-3" /></button>
                                                        <button title="Eliminar Pedido" onClick={() => { setSelectedJob(job); setIsDeleteModalOpen(true); }} className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 hover:text-red-500 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 transition-all"><Trash2 className="h-3 w-3" /></button>
                                                    </div>

                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 group-hover:bg-slate-900 dark:group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                                            <Briefcase className="h-4 w-4" />
                                                        </div>
                                                        <span className={cn(
                                                            "px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest",
                                                            job.status === 'open'
                                                                ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border border-emerald-100 dark:border-emerald-800/50"
                                                                : "bg-slate-50 dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-700"
                                                        )}>
                                                            {job.status}
                                                        </span>
                                                    </div>

                                                    <div className="flex-1 space-y-4">
                                                        <div>
                                                            <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">{job.title}</h3>
                                                            <div className="mt-1 flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                                                                <div className="flex items-center gap-1">
                                                                    <MapPin className="h-2.5 w-2.5 text-emerald-500" />
                                                                    <span>{job.city}</span>
                                                                </div>
                                                                <span className="text-slate-200">|</span>
                                                                <span>{(job as any).site?.name}</span>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div className="flex items-center gap-2 text-[10px] text-slate-600 dark:text-slate-400 font-bold bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                                                                <Calendar className="h-3 w-3 text-slate-400" />
                                                                <span className="truncate">{format(new Date(job.start_at), "d MMM, HH:mm", { locale: pt })}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-[10px] text-slate-600 dark:text-slate-400 font-bold bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                                                                <Users className="h-3 w-3 text-slate-400" />
                                                                <span>{assignmentCounts[job.id]?.confirmed || 0} / {job.needed_count} Vaga(s)</span>
                                                            </div>
                                                        </div>

                                                        {/* Worker Preview List */}
                                                        <div className="space-y-3 pt-1">
                                                            {/* Confirmed Workers */}
                                                            {assignmentsList[job.id]?.some((a: any) => a.status === 'confirmed' || a.status === 'completed') && (
                                                                <div className="space-y-1.5">
                                                                    <p className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest pl-1 leading-none">Equipa Confirmada</p>
                                                                    <div className="flex flex-wrap gap-1.5">
                                                                        {assignmentsList[job.id]
                                                                            ?.filter((a: any) => a.status === 'confirmed' || a.status === 'completed')
                                                                            .map((a: any, idx: number) => (
                                                                                <div key={idx} className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-md border border-emerald-100 dark:border-emerald-800/50 relative shadow-sm">
                                                                                    <div className="h-4 w-4 rounded-full bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center text-[7px] font-black overflow-hidden ring-1 ring-white dark:ring-slate-900">
                                                                                        {a.worker?.profiles?.avatar_url ? (
                                                                                            <img src={a.worker.profiles.avatar_url} alt="" className="h-full w-full object-cover" />
                                                                                        ) : (
                                                                                            a.worker?.first_name?.[0]
                                                                                        )}
                                                                                    </div>
                                                                                    <span className="text-[9px] font-black uppercase tracking-tighter truncate max-w-[65px]">
                                                                                        {a.worker?.first_name}
                                                                                    </span>
                                                                                </div>
                                                                            ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Proposed Workers */}
                                                            {assignmentsList[job.id]?.some((a: any) => a.status === 'proposed') && (
                                                                <div className="space-y-1.5">
                                                                    <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest pl-1 leading-none">Pipeline / Propostos</p>
                                                                    <div className="flex flex-wrap gap-1.5">
                                                                        {assignmentsList[job.id]
                                                                            ?.filter((a: any) => a.status === 'proposed')
                                                                            .map((a: any, idx: number) => (
                                                                                <div key={idx} className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-md border border-amber-100 dark:border-amber-800/30">
                                                                                    <div className="h-4 w-4 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-[7px] font-black overflow-hidden">
                                                                                        {a.worker?.first_name?.[0]}
                                                                                    </div>
                                                                                    <span className="text-[9px] font-bold uppercase tracking-tighter truncate max-w-[65px]">
                                                                                        {a.worker?.first_name}
                                                                                    </span>
                                                                                </div>
                                                                            ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {!assignmentsList[job.id]?.length && (
                                                                <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                                                                    <Users className="h-3 w-3 text-slate-300" />
                                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Vaga Aberta - Arraste para alocar</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="mt-5 space-y-3">
                                                        <button
                                                            onClick={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)}
                                                            className={cn(
                                                                "group/btn w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                                                expandedJobId === job.id
                                                                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg shadow-slate-200 dark:shadow-none"
                                                                    : "bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-slate-900"
                                                            )}
                                                        >
                                                            {expandedJobId === job.id ? (
                                                                <>Fechar Detalhes <ChevronUp className="h-2.5 w-2.5" /></>
                                                            ) : (
                                                                <>Alocar Equipa <ChevronDown className="h-2.5 w-2.5 group-hover/btn:translate-y-0.5 transition-transform" /></>
                                                            )}
                                                        </button>

                                                        {expandedJobId === job.id && (
                                                            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-300">
                                                                <AllocationBoard
                                                                    jobOrderId={job.id}
                                                                    header="none"
                                                                    onUpdate={fetchJobs}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {filteredJobs.length === 0 && !loading && (
                        <div className="py-32 text-center">
                            <div className="h-24 w-24 bg-slate-50 dark:bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-slate-100 dark:border-slate-800">
                                <Briefcase className="h-10 w-10 text-slate-200" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Sem Pedidos Ativos</h3>
                            <p className="text-slate-400 text-sm max-w-sm mx-auto mt-3">Não foram encontrados pedidos de trabalho para a sua pesquisa atual.</p>
                        </div>
                    )}
                </div>
            </div>

            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Novo Pedido de Trabalho">
                <JobForm
                    onSubmit={handleCreate}
                    submitLabel="Criar Pedido"
                    formData={formData}
                    setFormData={setFormData}
                    clients={clients}
                    sites={sites}
                    roles={roles}
                    isSubmitting={isSubmitting}
                    isEditModalOpen={isEditModalOpen}
                    setIsCreateModalOpen={setIsCreateModalOpen}
                    setIsEditModalOpen={setIsEditModalOpen}
                />
            </Modal>

            <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setSelectedJob(null); }} title="Editar Pedido">
                <JobForm
                    onSubmit={handleEdit}
                    submitLabel="Guardar Alterações"
                    formData={formData}
                    setFormData={setFormData}
                    clients={clients}
                    sites={sites}
                    roles={roles}
                    isSubmitting={isSubmitting}
                    isEditModalOpen={isEditModalOpen}
                    setIsCreateModalOpen={setIsCreateModalOpen}
                    setIsEditModalOpen={setIsEditModalOpen}
                />
            </Modal>

            <Modal isOpen={isDeleteModalOpen} onClose={() => { setIsDeleteModalOpen(false); setSelectedJob(null); }} title="Confirmar Eliminação">
                <div className="space-y-4">
                    <p className="text-slate-600">Tem a certeza que deseja eliminar o pedido <strong>{selectedJob?.title}</strong>?</p>
                    <p className="text-sm text-red-600 font-medium">Todas as alocações associadas serão eliminadas.</p>
                    <div className="flex justify-end gap-3 pt-4">
                        <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-all">Cancelar</button>
                        <button onClick={handleDelete} disabled={isSubmitting} className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:bg-red-300 transition-all flex items-center gap-2">
                            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />} Eliminar
                        </button>
                    </div>
                </div>
            </Modal>
        </div >
    );
}

const JobForm = ({
    onSubmit,
    submitLabel,
    formData,
    setFormData,
    clients,
    sites,
    roles,
    isSubmitting,
    isEditModalOpen,
    setIsCreateModalOpen,
    setIsEditModalOpen
}: {
    onSubmit: (e: React.FormEvent) => void;
    submitLabel: string;
    formData: any;
    setFormData: (data: any) => void;
    clients: Client[];
    sites: Site[];
    roles: Role[];
    isSubmitting: boolean;
    isEditModalOpen: boolean;
    setIsCreateModalOpen: (open: boolean) => void;
    setIsEditModalOpen: (open: boolean) => void;
}) => (
    <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
                <label htmlFor="title" className="text-sm font-bold text-slate-700">Título do Pedido</label>
                <input id="title" type="text" required className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Ex: Evento Corporativo" />
            </div>
            <div className="space-y-1">
                <label htmlFor="city" className="text-sm font-bold text-slate-700">Localidade (Algarve)</label>
                <select id="city" title="Selecionar Cidade" required className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })}>
                    <option value="">Selecionar cidade...</option>
                    {ALGARVE_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
            </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
                <label htmlFor="client" className="text-sm font-bold text-slate-700">Cliente</label>
                <select id="client" title="Selecionar Cliente" required className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none" value={formData.client_id} onChange={(e) => setFormData({ ...formData, client_id: e.target.value, site_id: "" })}>
                    <option value="">Selecionar...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
            <div className="space-y-1">
                <label htmlFor="site" className="text-sm font-bold text-slate-700">Unidade/Local</label>
                <select id="site" title="Selecionar Unidade" required disabled={!formData.client_id} className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none disabled:bg-slate-50" value={formData.site_id} onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}>
                    <option value="">Selecionar...</option>
                    {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
                <label htmlFor="role" className="text-sm font-bold text-slate-700">Função Requerida</label>
                <select id="role" title="Selecionar Função" required className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none" value={formData.role_id} onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}>
                    <option value="">Selecionar...</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
            </div>
            <div className="space-y-1">
                <label htmlFor="needed_count" className="text-sm font-bold text-slate-700">Staff Necessário</label>
                <input id="needed_count" type="number" min="1" required className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none" value={formData.needed_count} onChange={(e) => setFormData({ ...formData, needed_count: e.target.value })} />
            </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
                <label htmlFor="start_at" className="text-sm font-bold text-slate-700">Início do Serviço</label>
                <input id="start_at" type="datetime-local" required className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none" value={formData.start_at} onChange={(e) => setFormData({ ...formData, start_at: e.target.value })} />
            </div>
            <div className="space-y-1">
                <label htmlFor="end_at" className="text-sm font-bold text-slate-700">Fim (Vazio = Indeterminado)</label>
                <input id="end_at" type="datetime-local" className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none" value={formData.end_at} onChange={(e) => setFormData({ ...formData, end_at: e.target.value })} />
            </div>
        </div>

        {/* Schedule Configuration */}
        <div className="border-t border-slate-200 pt-4 mt-4">
            <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Configuração de Horário</div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label htmlFor="schedule_type" className="text-sm font-bold text-slate-700">Tipo de Escala</label>
                    <select id="schedule_type" title="Selecionar Tipo de Escala" className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none" value={formData.schedule_type} onChange={(e) => {
                        const val = e.target.value;
                        let updates: any = { schedule_type: val };
                        if (val === 'weekdays') {
                            updates.work_days = [1, 2, 3, 4, 5];
                            updates.weekdays_only = true;
                            updates.weekends_only = false;
                            updates.schedule_type = 'weekly';
                        } else if (val === 'weekends') {
                            updates.work_days = [0, 6];
                            updates.weekends_only = true;
                            updates.weekdays_only = false;
                            updates.schedule_type = 'weekly';
                        }
                        setFormData({ ...formData, ...updates });
                    }}>
                        <option value="one_time">Pontual (Data Fixa)</option>
                        <option value="daily">Diário (Todos os dias)</option>
                        <option value="weekly">Semanal (Escolher dias)</option>
                        <option value="weekdays">Dias Úteis (Seg-Sex)</option>
                        <option value="weekends">Fins de Semana (Sáb-Dom)</option>
                        <option value="monthly">Mensal (Previsão mensal)</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <label htmlFor="duration_hours" className="text-sm font-bold text-slate-700">Duração (horas)</label>
                    <input id="duration_hours" type="number" step="0.5" min="0.5" placeholder="Ex: 8" className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none" value={formData.duration_hours} onChange={(e) => setFormData({ ...formData, duration_hours: e.target.value })} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-1">
                    <label htmlFor="start_time" className="text-sm font-bold text-slate-700">Hora de Entrada</label>
                    <input id="start_time" type="time" className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none" value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} />
                </div>
                <div className="space-y-1">
                    <label htmlFor="end_time" className="text-sm font-bold text-slate-700">Hora de Saída</label>
                    <input id="end_time" type="time" className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none" value={formData.end_time} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} />
                </div>
            </div>

            {(formData.schedule_type === 'weekly' || formData.schedule_type === 'monthly') && (
                <div className="mt-4 space-y-2">
                    <label className="text-sm font-bold text-slate-700">Dias de Trabalho</label>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { day: 0, label: 'Dom' },
                            { day: 1, label: 'Seg' },
                            { day: 2, label: 'Ter' },
                            { day: 3, label: 'Qua' },
                            { day: 4, label: 'Qui' },
                            { day: 5, label: 'Sex' },
                            { day: 6, label: 'Sáb' },
                        ].map(({ day, label }) => (
                            <button
                                key={day}
                                type="button"
                                onClick={() => {
                                    const newDays = formData.work_days.includes(day)
                                        ? formData.work_days.filter((d: number) => d !== day)
                                        : [...formData.work_days, day].sort();
                                    setFormData({ ...formData, work_days: newDays, weekdays_only: false, weekends_only: false });
                                }}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-xs font-bold transition-all",
                                    formData.work_days.includes(day)
                                        ? "bg-slate-900 text-white"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex gap-4 mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                        checked={formData.weekdays_only}
                        onChange={(e) => setFormData({
                            ...formData,
                            weekdays_only: e.target.checked,
                            weekends_only: false,
                            work_days: e.target.checked ? [1, 2, 3, 4, 5] : []
                        })}
                    />
                    <span className="text-sm font-medium text-slate-700">Só dias úteis (Seg-Sex)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                        checked={formData.weekends_only}
                        onChange={(e) => setFormData({
                            ...formData,
                            weekends_only: e.target.checked,
                            weekdays_only: false,
                            work_days: e.target.checked ? [0, 6] : []
                        })}
                    />
                    <span className="text-sm font-medium text-slate-700">Só fins-de-semana (Sáb-Dom)</span>
                </label>
            </div>
        </div>

        {isEditModalOpen && (
            <div className="space-y-1">
                <label htmlFor="status" className="text-sm font-bold text-slate-700">Estado</label>
                <select id="status" title="Estado do Pedido" className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}>
                    <option value="open">Aberto</option>
                    <option value="in_progress">Em Progresso</option>
                    <option value="completed">Concluído</option>
                    <option value="cancelled">Cancelado</option>
                </select>
            </div>
        )}
        <div className="space-y-1">
            <label htmlFor="notes" className="text-sm font-bold text-slate-700">Notas</label>
            <textarea id="notes" className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none min-h-[60px]" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Instruções ou observações..." />
        </div>
        <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-all">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 disabled:bg-slate-300 transition-all flex items-center gap-2">
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />} {submitLabel}
            </button>
        </div>
    </form>
);

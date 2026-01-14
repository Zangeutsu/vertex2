"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { cn } from "../lib/utils";
import { useAuth } from "../lib/auth-context";
import {
    Users,
    UserCheck,
    UserPlus,
    Clock,
    CheckCircle2,
    GripVertical,
    Loader2,
    AlertCircle,
    XCircle,
    Lock,
    Play,
    MapPin,
} from "lucide-react";

interface Worker {
    id: string;
    first_name: string;
    last_name: string;
    languages: string[];
    city?: string;
    profiles?: { avatar_url: string | null };
}

interface Assignment {
    id: string;
    worker_id: string;
    job_order_id: string;
    status: string;
    proposed_at: string;
    confirmed_at: string | null;
    worker: Worker;
}

interface JobOrder {
    id: string;
    title: string;
    needed_count: number;
    status: string;
    client: { name: string };
    site: { name: string };
    role: { name: string };
    city?: string;
    start_at: string;
    end_at: string | null;
    start_time?: string;
    end_time?: string;
}

interface AllocationBoardProps {
    jobOrderId: string;
    onClose?: () => void;
    onUpdate?: () => void;
    header?: "full" | "none";
}

export function AllocationBoard({ jobOrderId, onClose, onUpdate, header = "full" }: AllocationBoardProps) {
    const { user } = useAuth();
    const [jobOrder, setJobOrder] = useState<JobOrder | null>(null);
    const [proposedAssignments, setProposedAssignments] = useState<Assignment[]>([]);
    const [confirmedAssignments, setConfirmedAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [statusLoading, setStatusLoading] = useState(false);
    const [draggedAssignment, setDraggedAssignment] = useState<Assignment | null>(null);

    const fetchData = async () => {
        setLoading(true);

        // Fetch job order details
        const { data: job } = await supabase
            .from("job_orders")
            .select(`*, client:clients(name), site:sites(name), role:roles(name)`)
            .eq("id", jobOrderId)
            .single();

        if (job) setJobOrder(job as any);

        // Fetch assignments for this job
        const { data: assignments } = await supabase
            .from("assignments")
            .select(`*, worker:workers(id, first_name, last_name, languages, profiles(avatar_url))`)
            .eq("job_order_id", jobOrderId);

        const proposed = (assignments || []).filter((a) => a.status === "proposed");
        const confirmed = (assignments || []).filter((a) => a.status === "confirmed" || a.status === "completed");

        setProposedAssignments(proposed as any);
        setConfirmedAssignments(confirmed as any);
        setLoading(false);
        onUpdate?.();
    };

    // Check for worker availability/overlaps
    const checkWorkerAvailability = async (workerId: string): Promise<{ hasConflict: boolean; jobTitle?: string }> => {
        if (!jobOrder) return { hasConflict: false };

        const currentStart = new Date(jobOrder.start_at);
        // If end_at is missing, assume a minimum block of 4 hours for collision check
        const currentEnd = jobOrder.end_at ? new Date(jobOrder.end_at) : new Date(currentStart.getTime() + 4 * 60 * 60 * 1000);

        const { data: assignments, error } = await supabase
            .from("assignments")
            .select(`
                id,
                status,
                job_order:job_orders (
                    id,
                    title,
                    start_at,
                    end_at
                )
            `)
            .eq("worker_id", workerId)
            .in("status", ["proposed", "confirmed"]);

        if (error || !assignments) return { hasConflict: false };

        for (const a of assignments) {
            const otherJob = (a as any).job_order;
            if (!otherJob || otherJob.id === jobOrderId) continue;

            const otherStart = new Date(otherJob.start_at);
            const otherEnd = otherJob.end_at ? new Date(otherJob.end_at) : new Date(otherStart.getTime() + 4 * 60 * 60 * 1000);

            // Overlap check: (StartA < EndB) and (EndA > StartB)
            if (currentStart < otherEnd && currentEnd > otherStart) {
                return { hasConflict: true, jobTitle: otherJob.title };
            }
        }

        return { hasConflict: false };
    };

    useEffect(() => {
        if (jobOrderId) fetchData();
    }, [jobOrderId]);

    // Propose worker - move from Available to Proposed
    const proposeWorker = async (worker: Worker) => {
        setActionLoading(worker.id);

        const { hasConflict, jobTitle } = await checkWorkerAvailability(worker.id);
        if (hasConflict) {
            alert(`Conflito de Horário: ${worker.first_name} já está escalado para o serviço "${jobTitle}" neste período.`);
            setActionLoading(null);
            return;
        }

        const { error } = await supabase.from("assignments").insert({
            job_order_id: jobOrderId,
            worker_id: worker.id,
            status: "proposed",
            proposed_at: new Date().toISOString(),
        });

        if (!error) {
            await fetchData();
            window.dispatchEvent(new CustomEvent('workforce-update'));
        }
        setActionLoading(null);
    };

    // Confirm assignment - move from Proposed to Confirmed
    const confirmAssignment = async (assignment: Assignment) => {
        setActionLoading(assignment.id);

        const { error } = await supabase
            .from("assignments")
            .update({
                status: "confirmed",
                confirmed_at: new Date().toISOString(),
                confirmed_by: user?.id,
            })
            .eq("id", assignment.id);

        if (!error) {
            await fetchData();
            // Check if job is now fully staffed
            await checkAndUpdateJobStatus();
            window.dispatchEvent(new CustomEvent('workforce-update'));
        }
        setActionLoading(null);
    };

    // Remove assignment (back to available)
    const removeAssignment = async (assignment: Assignment) => {
        setActionLoading(assignment.id);

        await supabase.from("assignments").delete().eq("id", assignment.id);
        await fetchData();
        window.dispatchEvent(new CustomEvent('workforce-update'));
        setActionLoading(null);
    };

    // Check if job order should auto-close
    const checkAndUpdateJobStatus = async () => {
        if (!jobOrder) return;

        const confirmedCount = confirmedAssignments.length + 1; // +1 because we just confirmed one

        if (confirmedCount >= jobOrder.needed_count && jobOrder.status === "open") {
            await supabase
                .from("job_orders")
                .update({ status: "in_progress" })
                .eq("id", jobOrderId);
            await fetchData();
        }
    };

    // Update job order status
    const updateJobStatus = async (newStatus: string) => {
        setStatusLoading(true);
        await supabase
            .from("job_orders")
            .update({ status: newStatus })
            .eq("id", jobOrderId);
        await fetchData();
        setStatusLoading(false);
    };

    // Close job (cancel)
    const closeJob = () => updateJobStatus("cancelled");

    // Complete job - with validation
    const completeJob = () => {
        const confirmed = confirmedAssignments.length;
        const needed = jobOrder?.needed_count || 0;

        // Check if confirmed count matches needed count
        if (confirmed > needed) {
            alert(`Não é possível fechar o pedido: há ${confirmed} confirmados mas apenas ${needed} vagas. Ajuste o número de vagas do pedido ou remova ${confirmed - needed} trabalhador(es).`);
            return;
        }
        if (confirmed < needed) {
            alert(`Não é possível fechar o pedido: apenas ${confirmed} de ${needed} vagas preenchidas.`);
            return;
        }
        updateJobStatus("completed");
    };

    // Start job (in_progress)
    const startJob = () => updateJobStatus("in_progress");

    // Reopen job
    const reopenJob = () => updateJobStatus("open");

    // Drag handlers

    const handleAssignmentDragStart = (assignment: Assignment) => {
        setDraggedAssignment(assignment);
    };

    const handleDragEnd = () => {
        setDraggedAssignment(null);
    };

    const handleDropOnProposed = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent bubbling to the JobCard drop handler
        const workerData = e.dataTransfer.getData('worker');
        if (workerData) {
            try {
                const worker = JSON.parse(workerData);
                proposeWorker(worker);
            } catch (err) {
                console.error("Failed to parse worker data", err);
            }
        }
        handleDragEnd();
    };

    const handleDropOnConfirmed = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent bubbling to the JobCard drop handler
        const workerData = e.dataTransfer.getData('worker');

        if (workerData) {
            try {
                const worker = JSON.parse(workerData);
                // Directly propose and confirm
                (async () => {
                    setActionLoading(worker.id);

                    const { hasConflict, jobTitle } = await checkWorkerAvailability(worker.id);
                    if (hasConflict) {
                        alert(`Conflito de Horário: ${worker.first_name} já está escalado para o serviço "${jobTitle}" neste período.`);
                        setActionLoading(null);
                        return;
                    }

                    const { data: newAssignment, error: propError } = await supabase
                        .from("assignments")
                        .insert({
                            job_order_id: jobOrderId,
                            worker_id: worker.id,
                            status: "confirmed",
                            proposed_at: new Date().toISOString(),
                            confirmed_at: new Date().toISOString(),
                            confirmed_by: user?.id,
                        })
                        .select()
                        .single();

                    if (!propError) {
                        await fetchData();
                        await checkAndUpdateJobStatus();
                        window.dispatchEvent(new CustomEvent('workforce-update'));
                    }
                    setActionLoading(null);
                })();
            } catch (err) {
                console.error("Failed to parse worker data", err);
            }
        } else if (draggedAssignment && draggedAssignment.status === "proposed") {
            confirmAssignment(draggedAssignment);
        }
        handleDragEnd();
    };


    const confirmedCount = confirmedAssignments.length;
    const neededCount = jobOrder?.needed_count || 0;
    const isFull = confirmedCount >= neededCount;

    // Check if job can be closed (confirmed === needed)
    const canCloseJob = confirmedCount === neededCount;
    const hasExcessConfirmations = confirmedCount > neededCount;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className={cn("space-y-6", header === "none" && "space-y-4")}>
            {/* Job Order Header */}
            {header === "full" && jobOrder && (
                <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl p-6 text-white">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h2 className="text-lg font-black">{jobOrder.title}</h2>
                                    <span className={cn(
                                        "px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest",
                                        jobOrder.status === 'open' && "bg-emerald-500/20 text-emerald-400",
                                        jobOrder.status === 'in_progress' && "bg-blue-500/20 text-blue-400",
                                        jobOrder.status === 'completed' && "bg-slate-500/20 text-slate-400",
                                        jobOrder.status === 'cancelled' && "bg-red-500/20 text-red-400"
                                    )}>
                                        {jobOrder.status === 'open' && 'Aberto'}
                                        {jobOrder.status === 'in_progress' && 'Em Progresso'}
                                        {jobOrder.status === 'completed' && 'Concluído'}
                                        {jobOrder.status === 'cancelled' && 'Cancelado'}
                                    </span>
                                </div>
                                <p className="text-slate-400 text-[10px] font-medium">
                                    {jobOrder.client?.name} • {jobOrder.city ? `${jobOrder.city} • ` : ""}{jobOrder.site?.name} • {jobOrder.role?.name}
                                </p>
                                {(jobOrder.start_time || jobOrder.end_time) && (
                                    <p className="text-slate-400 text-[9px] mt-1 flex items-center gap-1">
                                        <Clock className="h-2.5 w-2.5" />
                                        {jobOrder.start_time} - {jobOrder.end_time}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className={cn(
                            "text-right px-3 py-1.5 rounded-lg",
                            isFull ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                        )}>
                            <div className="text-xl font-black leading-none">{confirmedCount}/{neededCount}</div>
                            <div className="text-[8px] font-black uppercase tracking-widest mt-1">
                                {isFull ? "Completo" : "Confirmados"}
                            </div>
                        </div>
                    </div>

                    {/* Status message and action buttons */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                        <div>
                            {hasExcessConfirmations && (
                                <div className="flex items-center gap-2 text-amber-400 text-sm">
                                    <AlertCircle className="h-4 w-4" />
                                    <span className="font-bold">
                                        ⚠️ Há {confirmedCount - neededCount} trabalhador(es) a mais! Remova ou ajuste o número de vagas.
                                    </span>
                                </div>
                            )}
                            {canCloseJob && jobOrder.status === 'in_progress' && (
                                <div className="flex items-center gap-2 text-emerald-400 text-sm">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span className="font-bold">Pronto para fechar o pedido!</span>
                                </div>
                            )}
                            {isFull && jobOrder.status === 'open' && !hasExcessConfirmations && (
                                <div className="flex items-center gap-2 text-emerald-400 text-sm">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span className="font-bold">Todas as vagas preenchidas!</span>
                                </div>
                            )}
                            {jobOrder.status === 'completed' && (
                                <div className="flex items-center gap-2 text-slate-400 text-sm">
                                    <Lock className="h-4 w-4" />
                                    <span className="font-bold">Pedido concluído</span>
                                </div>
                            )}
                            {jobOrder.status === 'cancelled' && (
                                <div className="flex items-center gap-2 text-red-400 text-sm">
                                    <XCircle className="h-4 w-4" />
                                    <span className="font-bold">Pedido cancelado</span>
                                </div>
                            )}
                        </div>

                        {/* Admin action buttons */}
                        <div className="flex items-center gap-2">
                            {statusLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                            ) : (
                                <>
                                    {jobOrder.status === 'open' && (
                                        <>
                                            <button
                                                onClick={startJob}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-all"
                                            >
                                                <Play className="h-3.5 w-3.5" />
                                                Iniciar
                                            </button>
                                            <button
                                                onClick={closeJob}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-all"
                                            >
                                                <XCircle className="h-3.5 w-3.5" />
                                                Cancelar
                                            </button>
                                        </>
                                    )}
                                    {jobOrder.status === 'in_progress' && (
                                        <>
                                            <button
                                                onClick={completeJob}
                                                disabled={!canCloseJob}
                                                className={cn(
                                                    "flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                                                    canCloseJob
                                                        ? "bg-emerald-500 text-white hover:bg-emerald-600"
                                                        : "bg-slate-600 text-slate-400 cursor-not-allowed"
                                                )}
                                                title={!canCloseJob ? `Necessário ter exactamente ${neededCount} confirmados (actual: ${confirmedCount})` : "Fechar o pedido"}
                                            >
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                Fechar Pedido
                                            </button>
                                            <button
                                                onClick={closeJob}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-all"
                                            >
                                                <XCircle className="h-3.5 w-3.5" />
                                                Cancelar
                                            </button>
                                        </>
                                    )}
                                    {(jobOrder.status === 'completed' || jobOrder.status === 'cancelled') && (
                                        <button
                                            onClick={reopenJob}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 text-white text-xs font-bold rounded-lg hover:bg-slate-600 transition-all"
                                        >
                                            <Play className="h-3.5 w-3.5" />
                                            Reabrir Pedido
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Proposed Workers */}
                <div
                    className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors min-h-[300px]"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDropOnProposed}
                >
                    <div className="p-3 border-b border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-1.5">
                            <UserPlus className="h-4 w-4 text-amber-500" />
                            <span className="font-black text-slate-900 dark:text-white uppercase text-[10px] tracking-wide">
                                Propostos
                            </span>
                            <span className="ml-auto bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-black px-1.5 py-0.5 rounded-md">
                                {proposedAssignments.length}
                            </span>
                        </div>
                    </div>
                    <div className="p-2 space-y-1.5 max-h-[450px] overflow-y-auto">
                        {proposedAssignments.length === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
                                <UserPlus className="h-8 w-8 mb-2 opacity-20" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Arraste staff para aqui</span>
                            </div>
                        ) : (
                            proposedAssignments.map((assignment) => (
                                <AssignmentCard
                                    key={assignment.id}
                                    assignment={assignment}
                                    onDragStart={() => handleAssignmentDragStart(assignment)}
                                    onDragEnd={handleDragEnd}
                                    isLoading={actionLoading === assignment.id}
                                    onConfirm={() => confirmAssignment(assignment)}
                                    onRemove={() => removeAssignment(assignment)}
                                    showConfirmButton
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Confirmed Workers */}
                <div
                    className={cn(
                        "bg-white dark:bg-slate-800 rounded-xl border transition-colors min-h-[300px]",
                        draggedAssignment?.status === "proposed" ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20" : "border-slate-200 dark:border-slate-700"
                    )}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDropOnConfirmed}
                >
                    <div className="p-3 border-b border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-1.5">
                            <UserCheck className="h-4 w-4 text-emerald-500" />
                            <span className="font-black text-slate-900 dark:text-white uppercase text-[10px] tracking-wide">
                                Confirmados
                            </span>
                            <span className="ml-auto bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-1.5 py-0.5 rounded-md">
                                {confirmedAssignments.length}
                            </span>
                        </div>
                    </div>
                    <div className="p-2 space-y-1.5 max-h-[450px] overflow-y-auto">
                        {confirmedAssignments.length === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
                                <UserCheck className="h-8 w-8 mb-2 opacity-20" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Vazio</span>
                            </div>
                        ) : (
                            confirmedAssignments.map((assignment) => (
                                <AssignmentCard
                                    key={assignment.id}
                                    assignment={assignment}
                                    onDragStart={() => handleAssignmentDragStart(assignment)}
                                    onDragEnd={handleDragEnd}
                                    isLoading={actionLoading === assignment.id}
                                    onRemove={() => removeAssignment(assignment)}
                                    isConfirmed
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}



// Assignment Card Component
function AssignmentCard({
    assignment,
    onDragStart,
    onDragEnd,
    isLoading,
    onConfirm,
    onRemove,
    showConfirmButton,
    isConfirmed,
}: {
    assignment: Assignment;
    onDragStart: () => void;
    onDragEnd: () => void;
    isLoading: boolean;
    onConfirm?: () => void;
    onRemove: () => void;
    showConfirmButton?: boolean;
    isConfirmed?: boolean;
}) {
    const worker = assignment.worker;

    return (
        <div
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            className={cn(
                "flex items-center gap-2 p-2 rounded-lg cursor-grab active:cursor-grabbing transition-all border",
                isConfirmed
                    ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800"
                    : "bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800",
                isLoading && "opacity-50 pointer-events-none"
            )}
        >
            <GripVertical className="h-3 w-3 text-slate-300 dark:text-slate-500 shrink-0" />
            <div className={cn(
                "h-7 w-7 rounded-md flex items-center justify-center font-black text-[10px] shrink-0",
                isConfirmed
                    ? "bg-emerald-200/50 dark:bg-emerald-800/50 text-emerald-700 dark:text-emerald-300"
                    : "bg-amber-200/50 dark:bg-amber-800/50 text-amber-700 dark:text-amber-300"
            )}>
                {worker?.first_name?.[0]}{worker?.last_name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <div className="font-black text-slate-900 dark:text-white text-xs truncate leading-none">
                        {worker?.first_name} {worker?.last_name}
                    </div>
                    <span className={cn(
                        "text-[7px] font-black uppercase tracking-tighter px-1 rounded-[2px]",
                        isConfirmed
                            ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                    )}>
                        Escalado
                    </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="text-[9px] font-bold text-slate-400 truncate">
                        {worker?.languages?.join(", ")}
                    </div>
                    {worker?.city && (
                        <>
                            <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                            <div className="flex items-center gap-0.5 text-[8px] font-black uppercase text-emerald-500/70">
                                <MapPin className="h-2 w-2" />
                                {worker.city}
                            </div>
                        </>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-1">
                {isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
                ) : (
                    <>
                        {showConfirmButton && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onConfirm?.(); }}
                                className="p-1 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors"
                                title="Confirmar"
                            >
                                <CheckCircle2 className="h-3 w-3" />
                            </button>
                        )}
                        <button
                            onClick={(e) => { e.stopPropagation(); onRemove(); }}
                            className="p-1 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-md hover:bg-red-500 hover:text-white transition-colors"
                            title="Remover"
                        >
                            <AlertCircle className="h-3 w-3" />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

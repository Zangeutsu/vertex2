"use client";

import { Shift, ETTWorker, Client } from "../lib/types";
import { format, isSameDay } from "date-fns";
import { pt } from "date-fns/locale";
import { UserPlus, Trash2, Search, Globe, User } from "lucide-react";
import { api } from "../lib/api";
import clsx from "clsx";
import { useState, useMemo } from "react";
import { Input } from "./ui/input";

interface Props {
    shifts: Shift[];
    workers: ETTWorker[];
    clients: Client[];
    selectedDate: Date;
    onUpdate: () => void;
}

export function SchedulingBoard({ shifts, workers, clients, selectedDate, onUpdate }: Props) {
    const [draggedWorker, setDraggedWorker] = useState<ETTWorker | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Filter workers based on search
    const filteredWorkers = useMemo(() => {
        if (!searchQuery) return workers.filter(w => w.active);
        const lowerQuery = searchQuery.toLowerCase();
        return workers.filter(w =>
            w.active && (
                w.first_name.toLowerCase().includes(lowerQuery) ||
                w.last_name.toLowerCase().includes(lowerQuery) ||
                (w as any).language?.toLowerCase().includes(lowerQuery)
            )
        );
    }, [workers, searchQuery]);

    const handleDrop = async (shiftId: number) => {
        if (!draggedWorker) return;
        try {
            await api.scheduling.createBooking({
                shift_id: shiftId,
                worker_id: draggedWorker.id
            });
            onUpdate();
        } catch (error) {
            alert("Erro ao alocar colaborador.");
        }
        setDraggedWorker(null);
    };

    const handleDeleteBooking = async (bookingId: number) => {
        if (confirm("Remover colaborador deste turno?")) {
            await api.scheduling.deleteBooking(bookingId);
            onUpdate();
        }
    };

    const handleDeleteShift = async (shiftId: number) => {
        if (confirm("Eliminar este turno e todas as suas alocações?")) {
            await api.scheduling.deleteShift(shiftId);
            onUpdate();
        }
    };

    return (
        <div className="flex h-full gap-0 overflow-hidden bg-slate-50/50 rounded-3xl border border-slate-200 shadow-sm">
            {/* Left Sidebar: Worker Pool */}
            <div className="w-80 flex flex-col bg-white border-r border-slate-200">
                <div className="p-6 border-b border-slate-100 space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                            <UserPlus className="h-5 w-5" />
                        </div>
                        <h2 className="font-extrabold text-slate-800 tracking-tight">Trabalhadores</h2>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Pesquisar nome ou língua..."
                            className="pl-10 bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-emerald-500 rounded-xl"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {filteredWorkers.map(worker => (
                        <div
                            key={worker.id}
                            draggable
                            onDragStart={() => setDraggedWorker(worker)}
                            className="group flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl hover:border-emerald-400 hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
                        >
                            <div className="relative h-12 w-12 flex-shrink-0">
                                <div className="h-full w-full rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 shadow-sm">
                                    {(worker as any).photo_url ? (
                                        <img src={(worker as any).photo_url} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="font-bold text-slate-400 text-lg">
                                            {worker.first_name[0]}{worker.last_name[0]}
                                        </div>
                                    )}
                                </div>
                                <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-slate-800 truncate group-hover:text-emerald-700 transition-colors">
                                    {worker.first_name} {worker.last_name}
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <Globe className="h-3 w-3 text-slate-400" />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                                        {(worker as any).language || "Português"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredWorkers.length === 0 && (
                        <div className="text-center py-10">
                            <User className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                            <p className="text-xs font-bold text-slate-400 uppercase">Ninguém encontrado</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Board: Client Columns */}
            <div className="flex-1 overflow-x-auto">
                <div className="flex h-full p-6 gap-6 min-w-max">
                    {clients.map(client => {
                        const clientShifts = shifts.filter(s =>
                            s.client_id === client.id &&
                            isSameDay(new Date(s.date), selectedDate)
                        );

                        return (
                            <div key={client.id} className="w-80 flex flex-col gap-4">
                                <div className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-slate-700 text-sm shadow-sm group-hover:border-emerald-300 transition-colors">
                                            {client.name[0]}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-800 leading-tight truncate w-40">
                                                {client.name}
                                            </h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                {clientShifts.length} Turnos ativos
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 bg-slate-200/30 rounded-3xl border border-slate-200/60 p-4 space-y-4 min-h-[500px]">
                                    {clientShifts.map(shift => {
                                        const isFull = shift.bookings.length >= shift.required_count;
                                        return (
                                            <div
                                                key={shift.id}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={() => handleDrop(shift.id)}
                                                className={clsx(
                                                    "relative p-5 rounded-2xl border-2 transition-all bg-white shadow-sm",
                                                    isFull
                                                        ? "border-emerald-100 ring-1 ring-emerald-50/50"
                                                        : "border-dashed border-slate-200 hover:border-emerald-400 hover:shadow-lg"
                                                )}
                                            >
                                                <button
                                                    onClick={() => handleDeleteShift(shift.id)}
                                                    className="absolute -top-2 -right-2 bg-white rounded-full p-1.5 border border-slate-100 text-slate-300 hover:text-red-500 shadow-sm transition-all hover:scale-110"
                                                    title="Eliminar turno"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>

                                                <div className="flex justify-between items-center mb-4">
                                                    <div className="text-sm font-black text-slate-800 leading-none">
                                                        {shift.role}
                                                    </div>
                                                    <div className={clsx(
                                                        "text-[10px] font-black px-2.5 py-1 rounded-full",
                                                        isFull ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                                    )}>
                                                        {shift.bookings.length}/{shift.required_count}
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    {shift.bookings.map(booking => {
                                                        const worker = workers.find(w => w.id === booking.worker_id);
                                                        return (
                                                            <div key={booking.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-100 group/item">
                                                                <div className="flex items-center gap-2 overflow-hidden">
                                                                    <div className="h-7 w-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-600 shadow-sm">
                                                                        {worker?.first_name[0]}{worker?.last_name[0]}
                                                                    </div>
                                                                    <div className="text-xs font-bold text-slate-700 truncate">
                                                                        {worker?.first_name} {worker?.last_name}
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleDeleteBooking(booking.id)}
                                                                    className="text-slate-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity"
                                                                    aria-label="Eliminar alocação"
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                    {!isFull && (
                                                        <div className="h-12 border-2 border-dashed border-slate-100 rounded-xl flex items-center justify-center text-slate-300 text-[10px] uppercase font-black tracking-widest bg-slate-50/50">
                                                            Arraste Aqui
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {clientShifts.length === 0 && (
                                        <div className="h-32 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200/50 rounded-3xl">
                                            <p className="text-[10px] font-black uppercase tracking-widest">Sem turnos hoje</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

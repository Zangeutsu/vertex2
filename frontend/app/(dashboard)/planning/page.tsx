"use client";

import { useShifts, useWorkers, useClients } from "../../../lib/hooks";
import { api } from "../../../lib/api";
import { useState } from "react";
import { addDays, format, startOfWeek } from "date-fns";
import { pt } from "date-fns/locale";
import { Button } from "../../../components/ui/button";
import { Users, Calendar, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Modal } from "../../../components/ui/modal";
import { Input } from "../../../components/ui/input";
import { SchedulingBoard } from "../../../components/scheduling-board";

export default function PlanningPage() {
    const [currentDate, setCurrentDate] = useState(new Date());

    const { data: shifts, mutate } = useShifts(
        format(currentDate, "yyyy-MM-dd"),
        format(currentDate, "yyyy-MM-dd")
    );
    const { data: workers } = useWorkers();
    const { data: clients } = useClients();

    const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
    const [newShift, setNewShift] = useState({
        client_id: "",
        date: format(currentDate, "yyyy-MM-dd"),
        role: "",
        required_count: "1",
        start_time: "09:00",
        end_time: "18:00"
    });

    const handleCreateShift = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.scheduling.createShift({
                ...newShift,
                client_id: Number(newShift.client_id),
                required_count: Number(newShift.required_count),
                date: format(currentDate, "yyyy-MM-dd")
            } as any);
            setIsShiftModalOpen(false);
            mutate();
        } catch (error) {
            alert("Erro ao criar turno.");
        }
    };

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight text-gradient">Agenda Mensal</h1>
                    <p className="text-slate-500 font-medium">Gestão de workforce por cliente (Modo Liveforce).</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                        <Button
                            variant="ghost"
                            onClick={() => setCurrentDate(addDays(currentDate, -1))}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="px-6 text-sm font-black text-slate-800 uppercase tracking-tighter">
                            {format(currentDate, "EEEE, d 'de' MMMM", { locale: pt })}
                        </div>
                        <Button
                            variant="ghost"
                            onClick={() => setCurrentDate(addDays(currentDate, 1))}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <Button onClick={() => setIsShiftModalOpen(true)} className="gap-2 shadow-card active:scale-95 transition-transform">
                        <Plus className="h-4 w-4" />
                        Novo Turno
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                <SchedulingBoard
                    shifts={shifts || []}
                    workers={workers || []}
                    clients={clients || []}
                    selectedDate={currentDate}
                    onUpdate={() => mutate()}
                />
            </div>

            <Modal isOpen={isShiftModalOpen} onClose={() => setIsShiftModalOpen(false)} title="Novo Turno de Trabalho">
                <form onSubmit={handleCreateShift} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Cliente</label>
                        <select
                            required
                            className="w-full rounded-lg border border-slate-200 p-2 text-sm"
                            value={newShift.client_id}
                            onChange={e => setNewShift({ ...newShift, client_id: e.target.value })}
                            title="Seleccione um cliente"
                            aria-label="Cliente"
                        >
                            <option value="">Seleccione o cliente...</option>
                            {clients?.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Data</label>
                            <Input
                                type="date"
                                required
                                value={newShift.date}
                                onChange={e => setNewShift({ ...newShift, date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Vagas</label>
                            <Input
                                type="number"
                                required
                                min="1"
                                value={newShift.required_count}
                                onChange={e => setNewShift({ ...newShift, required_count: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Função / Cargo</label>
                        <Input
                            placeholder="Ex: Segurança, Hostess..."
                            required
                            value={newShift.role}
                            onChange={e => setNewShift({ ...newShift, role: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsShiftModalOpen(false)}>Cancelar</Button>
                        <Button type="submit">Criar Turno</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

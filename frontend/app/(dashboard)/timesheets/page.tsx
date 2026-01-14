"use client";

import { useTimesheets, useWorkers, useClients } from "../../../lib/hooks";
import { api } from "../../../lib/api";
import { Card, CardHeader } from "../../../components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "../../../components/ui/table";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Plus, Trash2, Clock, Calendar as CalendarIcon, User, Briefcase } from "lucide-react";
import { useState } from "react";
import { Modal } from "../../../components/ui/modal";
import { Input } from "../../../components/ui/input";

export default function TimesheetsPage() {
    const { data: timesheets, mutate } = useTimesheets();
    const { data: workers } = useWorkers();
    const { data: clients } = useClients();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        worker_id: "",
        client_id: "",
        date: new Date().toISOString().split("T")[0],
        hours: "",
        notes: ""
    });
    const [filters, setFilters] = useState({
        start: "",
        end: ""
    });

    const handleDelete = async (id: number) => {
        if (confirm("Deseja eliminar este registo de horas?")) {
            await api.timesheets.delete(id);
            mutate();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.timesheets.create({
                worker_id: Number(formData.worker_id),
                client_id: Number(formData.client_id),
                date: formData.date,
                hours: Number(formData.hours),
                notes: formData.notes || undefined
            });
            setIsModalOpen(false);
            setFormData({
                worker_id: "",
                client_id: "",
                date: new Date().toISOString().split("T")[0],
                hours: "",
                notes: ""
            });
            mutate();
        } catch (error) {
            alert("Erro ao criar registo de horas.");
        }
    };

    const getWorkerName = (id: number) => {
        const w = workers?.find(worker => worker.id === id);
        return w ? `${w.first_name} ${w.last_name}` : `ID: ${id}`;
    };

    const getClientName = (id: number) => {
        const c = clients?.find(client => client.id === id);
        return c ? c.name : `ID: ${id}`;
    };

    const filteredTimesheets = timesheets?.filter(t => {
        if (filters.start && new Date(t.date) < new Date(filters.start)) return false;
        if (filters.end && new Date(t.date) > new Date(filters.end)) return false;
        return true;
    });

    if (!timesheets) return <div className="p-8 text-center text-slate-500 font-medium">A carregar registos...</div>;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Folhas de Horas</h1>
                    <p className="text-slate-500 font-medium mt-1">Gestão de horas trabalhadas por colaborador e cliente.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-emerald-200 shadow-lg">
                    <Plus className="h-4 w-4" />
                    <span>Registar Horas</span>
                </Button>
            </div>

            <div className="flex flex-wrap items-end gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Desde</label>
                    <Input
                        type="date"
                        value={filters.start}
                        onChange={(e) => setFilters(prev => ({ ...prev, start: e.target.value }))}
                        className="bg-white h-9 text-xs"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Até</label>
                    <Input
                        type="date"
                        value={filters.end}
                        onChange={(e) => setFilters(prev => ({ ...prev, end: e.target.value }))}
                        className="bg-white h-9 text-xs"
                    />
                </div>
                {(filters.start || filters.end) && (
                    <Button variant="ghost" onClick={() => setFilters({ start: '', end: '' })} className="h-9 text-xs text-slate-500">
                        Limpar
                    </Button>
                )}
            </div>

            <Card className="overflow-hidden border-slate-200">
                <Table>
                    <THead>
                        <TR>
                            <TH>Data</TH>
                            <TH>Colaborador</TH>
                            <TH>Cliente</TH>
                            <TH>Horas</TH>
                            <TH>Notas</TH>
                            <TH className="text-right">Ações</TH>
                        </TR>
                    </THead>
                    <TBody>
                        {filteredTimesheets?.map((t) => (
                            <TR key={t.id} className="group transition-colors">
                                <TD className="font-mono text-xs">{new Date(t.date).toLocaleDateString()}</TD>
                                <TD className="font-medium text-slate-900">{getWorkerName(t.worker_id)}</TD>
                                <TD className="text-slate-600">{getClientName(t.client_id)}</TD>
                                <TD>
                                    <Badge tone="success">{t.hours}h</Badge>
                                </TD>
                                <TD className="max-w-xs truncate text-slate-500 italic text-xs">{t.notes || "-"}</TD>
                                <TD className="text-right">
                                    <Button
                                        onClick={() => handleDelete(t.id)}
                                        variant="ghost"
                                        className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TD>
                            </TR>
                        ))}
                        {timesheets.length === 0 && (
                            <TR>
                                <TD colSpan={6} className="py-12 text-center text-slate-400 italic bg-slate-50/50">
                                    Não existem registos de horas para apresentar.
                                </TD>
                            </TR>
                        )}
                    </TBody>
                </Table>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Registo de Horas">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <User className="h-4 w-4 text-emerald-600" />
                            Colaborador
                        </label>
                        <select
                            required
                            className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                            value={formData.worker_id}
                            onChange={(e) => setFormData({ ...formData, worker_id: e.target.value })}
                            title="Seleccione um colaborador"
                            aria-label="Colaborador"
                        >
                            <option value="">Seleccione um colaborador...</option>
                            {workers?.map(w => (
                                <option key={w.id} value={w.id}>{w.first_name} {w.last_name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-emerald-600" />
                            Cliente
                        </label>
                        <select
                            required
                            className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                            value={formData.client_id}
                            onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                            title="Seleccione um cliente"
                            aria-label="Cliente"
                        >
                            <option value="">Seleccione um cliente...</option>
                            {clients?.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4 text-emerald-600" />
                                Data
                            </label>
                            <Input
                                type="date"
                                required
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <Clock className="h-4 w-4 text-emerald-600" />
                                Horas
                            </label>
                            <Input
                                type="number"
                                step="0.5"
                                required
                                placeholder="0.0"
                                value={formData.hours}
                                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Notas</label>
                        <textarea
                            className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-emerald-400 outline-none min-h-[80px]"
                            placeholder="Ex: Horas extraordinárias, observações..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button type="submit">Guardar Registo</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

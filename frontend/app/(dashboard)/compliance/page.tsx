"use client";

import { FormEvent, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Card, CardHeader } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "../../../components/ui/table";
import { useCompliance, useWorkers } from "../../../lib/hooks";
import { api } from "../../../lib/api";
import { ComplianceRecord, ETTWorker, ComplianceType, ComplianceStatus } from "../../../lib/types";
import { Badge } from "../../../components/ui/badge";

export default function CompliancePage() {
    const { data: records, mutate } = useCompliance();
    const { data: workers } = useWorkers();
    const [form, setForm] = useState({
        worker_id: "",
        type: "medical_exam" as ComplianceType,
        due_date: "",
        notes: "",
    });

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        await api.compliance.create({
            ...form,
            worker_id: Number(form.worker_id),
            status: "pending" as ComplianceStatus,
        });
        setForm({ worker_id: "", type: "medical_exam", due_date: "", notes: "" });
        mutate();
    };

    const getWorkerName = (id: number) => {
        const worker = workers?.find((w: ETTWorker) => w.id === id);
        return worker ? `${worker.first_name} ${worker.last_name}` : `ID: ${id}`;
    };

    const statusTones: Record<ComplianceStatus, "info" | "success" | "warning"> = {
        pending: "info",
        scheduled: "info",
        completed: "success",
        overdue: "warning",
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900">Conformidade e Medicina</h1>
            </div>

            <Card>
                <CardHeader title="Novo Registo" />
                <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-4">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-500">Colaborador</label>
                        <select
                            title="Selecionar Colaborador"
                            className="w-full rounded-md border border-slate-200 p-2 text-sm"
                            value={form.worker_id}
                            onChange={(e) => setForm((prev) => ({ ...prev, worker_id: e.target.value }))}
                            required
                        >
                            <option value="">Selecionar...</option>
                            {workers?.map((w: ETTWorker) => (
                                <option key={w.id} value={w.id}>
                                    {w.first_name} {w.last_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-500">Tipo</label>
                        <select
                            title="Selecionar Tipo"
                            className="w-full rounded-md border border-slate-200 p-2 text-sm"
                            value={form.type}
                            onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as ComplianceType }))}
                            required
                        >
                            <option value="medical_exam">Exame Médico</option>
                            <option value="training">Formação</option>
                            <option value="document">Documentação</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-500">Data Limite</label>
                        <Input
                            type="date"
                            value={form.due_date}
                            onChange={(e) => setForm((prev) => ({ ...prev, due_date: e.target.value }))}
                            required
                        />
                    </div>
                    <div className="flex items-end">
                        <Button type="submit" className="w-full">
                            Guardar
                        </Button>
                    </div>
                </form>
            </Card>

            <Card>
                <CardHeader title="Histórico de Registos" />
                <Table>
                    <THead>
                        <TR>
                            <TH>Colaborador</TH>
                            <TH>Tipo</TH>
                            <TH>Validade</TH>
                            <TH>Estado</TH>
                        </TR>
                    </THead>
                    <TBody>
                        {records?.map((r: ComplianceRecord) => (
                            <TR key={r.id}>
                                <TD>{getWorkerName(r.worker_id)}</TD>
                                <TD className="capitalize">{r.type.replace("_", " ")}</TD>
                                <TD>{new Date(r.due_date).toLocaleDateString()}</TD>
                                <TD>
                                    <Badge tone={statusTones[r.status]}>{r.status}</Badge>
                                </TD>
                            </TR>
                        ))}
                    </TBody>
                </Table>
            </Card>
        </div>
    );
}

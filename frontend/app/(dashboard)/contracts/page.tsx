"use client";

import { FormEvent, useState, useMemo } from "react";
import { Button } from "../../../components/ui/button";
import { Card, CardHeader } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "../../../components/ui/table";
import { useContracts, useWorkers, useClients } from "../../../lib/hooks";
import { api } from "../../../lib/api";
import { Contract, ETTWorker, Client } from "../../../lib/types";
import { Badge } from "../../../components/ui/badge";
import { Trash2, Download } from "lucide-react";
import Link from "next/link";

export default function ContractsPage() {
  const { data: contracts, mutate } = useContracts();
  const { data: workers } = useWorkers();
  const { data: clients } = useClients();

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [form, setForm] = useState({
    worker_id: "",
    client_id: "",
    role: "",
    start_date: "",
    end_date: "",
    hourly_rate: "",
  });

  const filteredContracts = useMemo(() => {
    if (!contracts) return [];
    if (filterStatus === "all") return contracts;
    return contracts.filter((c: Contract) => c.status === filterStatus);
  }, [contracts, filterStatus]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await api.contracts.create({
      ...form,
      worker_id: Number(form.worker_id),
      client_id: Number(form.client_id),
      hourly_rate: form.hourly_rate ? Number(form.hourly_rate) : undefined,
    });
    setForm({ worker_id: "", client_id: "", role: "", start_date: "", end_date: "", hourly_rate: "" });
    mutate();
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem a certeza que deseja eliminar este contrato?")) {
      await api.contracts.delete(id);
      mutate();
    }
  };

  const getWorkerName = (id: number) => {
    const worker = workers?.find((w: ETTWorker) => w.id === id);
    return worker ? `${worker.first_name} ${worker.last_name}` : `ID: ${id}`;
  };

  const getClientName = (id: number) => {
    const client = clients?.find((c: Client) => c.id === id);
    return client ? client.name : `ID: ${id}`;
  };

  const statusTones: Record<string, "info" | "success" | "warning"> = {
    draft: "info",
    active: "success",
    terminated: "warning",
    expired: "warning",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Gestão de Contratos</h1>
        <Button
          variant="outline"
          onClick={() => window.open(api.reports.contractsUrl)}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          <span>Exportar CSV</span>
        </Button>
      </div>

      <Card>
        <CardHeader title="Novo Contrato" />
        <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">Trabalhador</label>
            <select
              title="Selecionar Trabalhador"
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
            <label className="text-xs font-medium text-slate-500">Cliente</label>
            <select
              title="Selecionar Cliente"
              className="w-full rounded-md border border-slate-200 p-2 text-sm"
              value={form.client_id}
              onChange={(e) => setForm((prev) => ({ ...prev, client_id: e.target.value }))}
              required
            >
              <option value="">Selecionar...</option>
              {clients?.map((c: Client) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">Função</label>
            <Input
              placeholder="Ex: Motorista"
              value={form.role}
              onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">Valor/Hora</label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={form.hourly_rate}
              onChange={(e) => setForm((prev) => ({ ...prev, hourly_rate: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">Início</label>
            <Input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm((prev) => ({ ...prev, start_date: e.target.value }))}
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
        <div className="flex items-center justify-between mb-4">
          <CardHeader title="Contratos Registados" />
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Filtrar:</label>
            <select
              title="Filtrar por estado"
              className="text-sm border border-slate-200 rounded-md px-2 py-1 bg-white"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Todos</option>
              <option value="draft">Rascunho</option>
              <option value="active">Ativo</option>
              <option value="terminated">Terminado</option>
              <option value="expired">Expirado</option>
            </select>
          </div>
        </div>
        <Table>
          <THead>
            <TR>
              <TH>Colaborador</TH>
              <TH>Cliente</TH>
              <TH>Função</TH>
              <TH>Início</TH>
              <TH>Estado</TH>
              <TH className="text-right">Ações</TH>
            </TR>
          </THead>
          <TBody>
            {filteredContracts.map((c: Contract) => (
              <TR key={c.id}>
                <TD className="font-medium text-slate-900">
                  <Link href={`/workers/${c.worker_id}`} className="hover:underline text-emerald-700">
                    {getWorkerName(c.worker_id)}
                  </Link>
                </TD>
                <TD>{getClientName(c.client_id)}</TD>
                <TD>{c.role}</TD>
                <TD className="text-xs font-mono">{new Date(c.start_date).toLocaleDateString()}</TD>
                <TD>
                  <Badge tone={statusTones[c.status] || "info"}>{c.status}</Badge>
                </TD>
                <TD className="text-right">
                  <Button
                    onClick={() => handleDelete(c.id)}
                    variant="ghost"
                    className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TD>
              </TR>
            ))}
            {filteredContracts.length === 0 && (
              <TR>
                <TD colSpan={6} className="py-8 text-center text-slate-400 italic">Sem contratos encontrados.</TD>
              </TR>
            )}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}

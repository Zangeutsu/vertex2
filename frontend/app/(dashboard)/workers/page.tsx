"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Worker, WorkerStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Users, Plus, Search, Edit, Trash2, ExternalLink, Loader2, MapPin } from "lucide-react";
import { ALGARVE_CITIES } from "@/lib/constants";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { SkeletonTable } from "@/components/ui/skeleton";

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    languages: "",
    notes: "",
    status: "active" as WorkerStatus,
    tags: "",
    experience_years: "0",
    city: "",
  });

  const fetchWorkers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('workers')
      .select(`*, profiles (full_name, email, avatar_url)`);

    if (error) {
      console.error("Error fetching workers:", error);
    } else {
      setWorkers(data as any || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      languages: "",
      notes: "",
      status: "active",
      tags: "",
      experience_years: "0",
      city: ""
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // First create a profile
      const profileId = crypto.randomUUID();
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: profileId,
          email: `${formData.first_name.toLowerCase()}.${formData.last_name.toLowerCase()}@worker.temp`,
          full_name: `${formData.first_name} ${formData.last_name}`,
          role: 'worker'
        });

      if (profileError) throw profileError;

      // Then create the worker
      const { error: workerError } = await supabase
        .from('workers')
        .insert({
          id: profileId,
          first_name: formData.first_name,
          last_name: formData.last_name,
          status: formData.status,
          languages: formData.languages.split(',').map(l => l.trim()).filter(Boolean),
          notes: formData.notes || null,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
          experience_years: parseInt(formData.experience_years) || 0,
          city: formData.city || null,
        });

      if (workerError) throw workerError;

      setToast({ message: "Colaborador criado com sucesso!", type: "success" });
      setIsCreateModalOpen(false);
      resetForm();
      fetchWorkers();
    } catch (error: any) {
      console.error("Error creating worker:", error);
      setToast({ message: error.message || "Erro ao criar colaborador", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorker) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('workers')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          status: formData.status,
          languages: formData.languages.split(',').map(l => l.trim()).filter(Boolean),
          notes: formData.notes || null,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
          experience_years: parseInt(formData.experience_years) || 0,
          city: formData.city || null,
        })
        .eq('id', selectedWorker.id);

      if (error) throw error;

      // Also update profile full_name
      await supabase
        .from('profiles')
        .update({ full_name: `${formData.first_name} ${formData.last_name}` })
        .eq('id', selectedWorker.id);

      setToast({ message: "Colaborador atualizado!", type: "success" });
      setIsEditModalOpen(false);
      setSelectedWorker(null);
      resetForm();
      fetchWorkers();
    } catch (error: any) {
      console.error("Error updating worker:", error);
      setToast({ message: error.message || "Erro ao atualizar", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedWorker) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('workers')
        .delete()
        .eq('id', selectedWorker.id);

      if (error) throw error;

      setToast({ message: "Colaborador eliminado!", type: "success" });
      setIsDeleteModalOpen(false);
      setSelectedWorker(null);
      fetchWorkers();
    } catch (error: any) {
      console.error("Error deleting worker:", error);
      setToast({ message: error.message || "Erro ao eliminar", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (worker: Worker) => {
    setSelectedWorker(worker);
    setFormData({
      first_name: worker.first_name,
      last_name: worker.last_name,
      languages: worker.languages.join(', '),
      notes: worker.notes || "",
      status: worker.status,
      tags: worker.tags ? worker.tags.join(', ') : "",
      experience_years: (worker.experience_years || 0).toString(),
      city: worker.city || "",
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (worker: Worker) => {
    setSelectedWorker(worker);
    setIsDeleteModalOpen(true);
  };

  const filteredWorkers = workers.filter(w =>
    `${w.first_name} ${w.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (w.city || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-10">
      {/* Toast Notification */}
      {toast && (
        <div className={cn(
          "fixed top-4 right-4 z-50 px-6 py-3 rounded-2xl shadow-2xl border animate-in slide-in-from-top-4 duration-300",
          toast.type === 'success'
            ? "bg-white dark:bg-slate-900 border-emerald-100 dark:border-emerald-800 text-emerald-600 shadow-emerald-200/20"
            : "bg-white dark:bg-slate-900 border-red-100 dark:border-red-800 text-red-600 shadow-red-200/20"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-2 w-2 rounded-full animate-pulse",
              toast.type === 'success' ? "bg-emerald-500" : "bg-red-500"
            )} />
            <span className="text-xs font-black uppercase tracking-widest">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header with improved hierarchy */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            <Users className="h-3 w-3" />
            <span>Gestão de Capital Humano</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Gestão de <span className="text-emerald-600">Colaboradores</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
            Registe e coordene o seu workforce global.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setIsCreateModalOpen(true); }}
          className="flex items-center justify-center gap-2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-200 dark:shadow-none"
        >
          <Plus className="h-4 w-4" /> Novo Colaborador
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-xl shadow-slate-200/40 dark:shadow-none">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            <input
              type="text"
              placeholder="Pesquisar..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950/50 border-none ring-1 ring-slate-100 dark:ring-slate-800 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-inner"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredWorkers.length} Ativos</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-950/20">
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Identificação</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Estado</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Cidade</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/50">
              {filteredWorkers.map((worker) => (
                <tr key={worker.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <Link href={`/workers/${worker.id}`} className="flex items-center gap-3 group/link cursor-pointer">
                      <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-500 text-sm border border-slate-200 shadow-sm overflow-hidden group-hover/link:ring-2 group-hover/link:ring-slate-900 transition-all">
                        {worker.profiles?.avatar_url ? (
                          <img
                            src={worker.profiles.avatar_url}
                            alt={`${worker.first_name} ${worker.last_name}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          worker.first_name?.[0] || '?'
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 group-hover/link:text-slate-900 transition-colors flex items-center gap-1">
                          {worker.first_name} {worker.last_name}
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{(worker as any).profiles?.email || 'Sem email'}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm",
                      worker.status === 'active' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                    )}>
                      {worker.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-bold">
                      <MapPin className="h-3 w-3 text-emerald-500" />
                      <span className="text-xs">{worker.city || 'Transversal'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(worker)}
                        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                        aria-label="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(worker)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredWorkers.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p className="font-bold uppercase text-[10px] tracking-widest">Nenhum colaborador encontrado</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Novo Colaborador">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="first_name" className="text-sm font-bold text-slate-700">Primeiro Nome</label>
              <input
                id="first_name"
                type="text"
                required
                className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="Ex: João"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="last_name" className="text-sm font-bold text-slate-700">Apelido</label>
              <input
                id="last_name"
                type="text"
                required
                className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Ex: Silva"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label htmlFor="city" className="text-sm font-bold text-slate-700">Cidade</label>
            <select
              id="city"
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            >
              <option value="">Selecione uma cidade...</option>
              {ALGARVE_CITIES.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="experience_years" className="text-sm font-bold text-slate-700">Anos de Experiência</label>
              <input
                id="experience_years"
                type="number"
                min="0"
                className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="languages" className="text-sm font-bold text-slate-700">Línguas</label>
              <input
                id="languages"
                type="text"
                placeholder="Português, Inglês"
                className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                value={formData.languages}
                onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label htmlFor="tags" className="text-sm font-bold text-slate-700">Tags / Perfil (separadas por vírgula)</label>
            <input
              id="tags"
              type="text"
              placeholder="Ex: dedicado, pontual, fardado"
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="notes" className="text-sm font-bold text-slate-700">Notas</label>
            <textarea
              id="notes"
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none min-h-[80px]"
              placeholder="Observações sobre o colaborador..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 disabled:bg-slate-300 transition-all flex items-center gap-2">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Criar Colaborador
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setSelectedWorker(null); }} title="Editar Colaborador">
        <form onSubmit={handleEdit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="edit_first_name" className="text-sm font-bold text-slate-700">Primeiro Nome</label>
              <input
                id="edit_first_name"
                type="text"
                required
                className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="Ex: João"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="edit_last_name" className="text-sm font-bold text-slate-700">Apelido</label>
              <input
                id="edit_last_name"
                type="text"
                required
                className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Ex: Silva"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label htmlFor="edit_status" className="text-sm font-bold text-slate-700">Estado</label>
            <select
              id="edit_status"
              title="Estado do Colaborador"
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            >
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
              <option value="on_hold">Em espera</option>
              <option value="banned">Banido</option>
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="edit_city" className="text-sm font-bold text-slate-700">Cidade</label>
            <select
              id="edit_city"
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            >
              <option value="">Selecione uma cidade...</option>
              {ALGARVE_CITIES.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="edit_experience_years" className="text-sm font-bold text-slate-700">Anos de Experiência</label>
              <input
                id="edit_experience_years"
                type="number"
                min="0"
                className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="edit_languages" className="text-sm font-bold text-slate-700">Línguas</label>
              <input
                id="edit_languages"
                type="text"
                placeholder="Português, Inglês"
                className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                value={formData.languages}
                onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label htmlFor="edit_tags" className="text-sm font-bold text-slate-700">Tags / Perfil</label>
            <input
              id="edit_tags"
              type="text"
              placeholder="Ex: dedicado, pontual"
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="edit_notes" className="text-sm font-bold text-slate-700">Notas</label>
            <textarea
              id="edit_notes"
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none min-h-[80px]"
              placeholder="Observações..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 disabled:bg-slate-300 transition-all flex items-center gap-2">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar Alterações
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => { setIsDeleteModalOpen(false); setSelectedWorker(null); }} title="Confirmar Eliminação">
        <div className="space-y-4">
          <p className="text-slate-600">
            Tem a certeza que deseja eliminar o colaborador <strong>{selectedWorker?.first_name} {selectedWorker?.last_name}</strong>?
          </p>
          <p className="text-sm text-red-600 font-medium">Esta ação não pode ser desfeita.</p>
          <div className="flex justify-end gap-3 pt-4">
            <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-all">
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={isSubmitting}
              className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:bg-red-300 transition-all flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

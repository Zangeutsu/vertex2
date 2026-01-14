"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { Client, Site } from "../../../lib/types";
import { cn } from "../../../lib/utils";
import { Building2, Plus, Search, Edit, Trash2, MapPin, Loader2, X, ExternalLink } from "lucide-react";
import { Modal } from "../../../components/ui/modal";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSitesModalOpen, setIsSitesModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    industry: "general" as Client["industry"],
    billing_address: "",
    contact_email: "",
  });

  const [siteForm, setSiteForm] = useState({
    name: "",
    address: "",
    latitude: "" as string | number,
    longitude: "" as string | number,
  });

  const fetchClients = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('clients').select('*');
    if (error) {
      console.error("Error fetching clients:", error);
    } else {
      setClients(data as any || []);
    }
    setLoading(false);
  };

  const fetchSites = async (clientId: string) => {
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .eq('client_id', clientId);
    if (!error) {
      setSites(data as any || []);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const resetForm = () => {
    setFormData({ name: "", industry: "general", billing_address: "", contact_email: "" });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('clients').insert({
        name: formData.name,
        industry: formData.industry,
        billing_address: formData.billing_address || null,
        contact_email: formData.contact_email || null,
      });
      if (error) throw error;
      setToast({ message: "Cliente criado com sucesso!", type: "success" });
      setIsCreateModalOpen(false);
      resetForm();
      fetchClients();
    } catch (error: any) {
      setToast({ message: error.message || "Erro ao criar cliente", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          name: formData.name,
          industry: formData.industry,
          billing_address: formData.billing_address || null,
          contact_email: formData.contact_email || null,
        })
        .eq('id', selectedClient.id);
      if (error) throw error;
      setToast({ message: "Cliente atualizado!", type: "success" });
      setIsEditModalOpen(false);
      setSelectedClient(null);
      resetForm();
      fetchClients();
    } catch (error: any) {
      setToast({ message: error.message || "Erro ao atualizar", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedClient) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('clients').delete().eq('id', selectedClient.id);
      if (error) throw error;
      setToast({ message: "Cliente eliminado!", type: "success" });
      setIsDeleteModalOpen(false);
      setSelectedClient(null);
      fetchClients();
    } catch (error: any) {
      setToast({ message: error.message || "Erro ao eliminar", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('sites').insert({
        client_id: selectedClient.id,
        name: siteForm.name,
        address: siteForm.address || null,
        latitude: siteForm.latitude ? parseFloat(siteForm.latitude.toString()) : null,
        longitude: siteForm.longitude ? parseFloat(siteForm.longitude.toString()) : null,
      });
      if (error) throw error;
      setToast({ message: "Unidade criada!", type: "success" });
      setSiteForm({ name: "", address: "", latitude: "", longitude: "" });
      fetchSites(selectedClient.id);
    } catch (error: any) {
      setToast({ message: error.message || "Erro ao criar unidade", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSite = async (siteId: string) => {
    try {
      const { error } = await supabase.from('sites').delete().eq('id', siteId);
      if (error) throw error;
      setToast({ message: "Unidade eliminada!", type: "success" });
      if (selectedClient) fetchSites(selectedClient.id);
    } catch (error: any) {
      setToast({ message: error.message || "Erro ao eliminar", type: "error" });
    }
  };

  const openEditModal = (client: Client) => {
    setSelectedClient(client);
    setFormData({
      name: client.name,
      industry: client.industry || "general",
      billing_address: client.billing_address || "",
      contact_email: client.contact_email || "",
    });
    setIsEditModalOpen(true);
  };

  const openSitesModal = (client: Client) => {
    setSelectedClient(client);
    fetchSites(client.id);
    setIsSitesModalOpen(true);
  };

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-10">
      {/* Header with improved hierarchy */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            <Building2 className="h-3 w-3" />
            <span>Carteira de Contas</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Clientes e <span className="text-emerald-600">Unidades</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
            Coordene locais de operação e contas empresariais.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setIsCreateModalOpen(true); }}
          className="flex items-center justify-center gap-2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-200 dark:shadow-none"
        >
          <Plus className="h-4 w-4" /> Novo Cliente
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
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredClients.length} Parceiros</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-950/20">
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Entidade</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Setor</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Contacto</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-right">Controlo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/50">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-500 text-sm border border-slate-200 shadow-sm">
                        {client.name[0]}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{client.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{client.billing_address || 'Sem morada'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-black uppercase">
                      {client.industry || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-700">{client.contact_email || 'Sem email'}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openSitesModal(client)}
                        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                        title="Ver Unidades"
                      >
                        <MapPin className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(client)}
                        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                        aria-label="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => { setSelectedClient(client); setIsDeleteModalOpen(true); }}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredClients.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    <Building2 className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p className="font-bold uppercase text-[10px] tracking-widest">Nenhum cliente encontrado</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Novo Cliente">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="client_name" className="text-sm font-bold text-slate-700">Nome</label>
            <input id="client_name" type="text" required className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Vertex Corp" />
          </div>
          <div className="space-y-1">
            <label htmlFor="client_industry" className="text-sm font-bold text-slate-700">Indústria</label>
            <select id="client_industry" title="Selecionar Indústria" className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none" value={formData.industry || ''} onChange={(e) => setFormData({ ...formData, industry: e.target.value as any })}>
              <option value="hospitality">Hotelaria</option>
              <option value="construction">Construção</option>
              <option value="security">Segurança</option>
              <option value="logistics">Logística</option>
              <option value="general">Geral</option>
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="client_address" className="text-sm font-bold text-slate-700">Morada de Faturação</label>
            <input id="client_address" type="text" className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none" value={formData.billing_address} onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })} placeholder="Ex: Rua Almirante, 123" />
          </div>
          <div className="space-y-1">
            <label htmlFor="client_email" className="text-sm font-bold text-slate-700">Email de Contacto</label>
            <input id="client_email" type="email" className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none" value={formData.contact_email} onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })} placeholder="Ex: contacto@empresa.com" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-all">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 disabled:bg-slate-300 transition-all flex items-center gap-2">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />} Criar Cliente
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setSelectedClient(null); }} title="Editar Cliente">
        <form onSubmit={handleEdit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="edit_client_name" className="text-sm font-bold text-slate-700">Nome</label>
            <input id="edit_client_name" type="text" required className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Vertex Corp" />
          </div>
          <div className="space-y-1">
            <label htmlFor="edit_client_industry" className="text-sm font-bold text-slate-700">Indústria</label>
            <select id="edit_client_industry" title="Selecionar Indústria" className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none" value={formData.industry || ''} onChange={(e) => setFormData({ ...formData, industry: e.target.value as any })}>
              <option value="hospitality">Hotelaria</option>
              <option value="construction">Construção</option>
              <option value="security">Segurança</option>
              <option value="logistics">Logística</option>
              <option value="general">Geral</option>
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="edit_client_address" className="text-sm font-bold text-slate-700">Morada de Faturação</label>
            <input id="edit_client_address" type="text" className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none" value={formData.billing_address} onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })} placeholder="Ex: Rua Almirante, 123" />
          </div>
          <div className="space-y-1">
            <label htmlFor="edit_client_email" className="text-sm font-bold text-slate-700">Email de Contacto</label>
            <input id="edit_client_email" type="email" className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none" value={formData.contact_email} onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })} placeholder="Ex: contacto@empresa.com" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-all">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 disabled:bg-slate-300 transition-all flex items-center gap-2">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />} Guardar
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => { setIsDeleteModalOpen(false); setSelectedClient(null); }} title="Confirmar Eliminação">
        <div className="space-y-4">
          <p className="text-slate-600">Tem a certeza que deseja eliminar o cliente <strong>{selectedClient?.name}</strong>?</p>
          <p className="text-sm text-red-600 font-medium">Todas as unidades e pedidos associados serão eliminados.</p>
          <div className="flex justify-end gap-3 pt-4">
            <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-all">Cancelar</button>
            <button onClick={handleDelete} disabled={isSubmitting} className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:bg-red-300 transition-all flex items-center gap-2">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />} Eliminar
            </button>
          </div>
        </div>
      </Modal>

      {/* Sites Modal */}
      <Modal isOpen={isSitesModalOpen} onClose={() => { setIsSitesModalOpen(false); setSelectedClient(null); setSites([]); }} title={`Unidades de ${selectedClient?.name || ''}`} size="lg">
        <div className="space-y-6">
          <form onSubmit={handleCreateSite} className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="grid grid-cols-2 gap-3">
              <input type="text" required placeholder="Nome da unidade" className="rounded-lg border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none" value={siteForm.name} onChange={(e) => setSiteForm({ ...siteForm, name: e.target.value })} />
              <input type="text" placeholder="Morada (opcional)" className="rounded-lg border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none" value={siteForm.address} onChange={(e) => setSiteForm({ ...siteForm, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <input type="number" step="any" placeholder="Latitude (GPS)" className="rounded-lg border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none" value={siteForm.latitude} onChange={(e) => setSiteForm({ ...siteForm, latitude: e.target.value })} />
              <input type="number" step="any" placeholder="Longitude (GPS)" className="rounded-lg border border-slate-200 p-2.5 text-sm focus:ring-2 focus:ring-slate-900 outline-none" value={siteForm.longitude} onChange={(e) => setSiteForm({ ...siteForm, longitude: e.target.value })} />
              <button type="submit" disabled={isSubmitting} className="bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 disabled:bg-slate-300 transition-all flex items-center justify-center gap-2">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Adicionar
              </button>
            </div>
          </form>
          <div className="space-y-2">
            {sites.length === 0 ? (
              <p className="text-center text-slate-400 py-8">Sem unidades registadas</p>
            ) : (
              sites.map(site => (
                <div key={site.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/20 rounded-xl border border-transparent hover:border-slate-200 transition-all group/site">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                      <MapPin className="h-5 w-5 text-slate-400 group-hover/site:text-slate-900 transition-colors" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{site.name}</div>
                      <div className="text-xs text-slate-500">
                        {site.address || 'Sem morada'}
                        {(site.latitude && site.longitude) && (
                          <span className="ml-2 text-slate-400">({site.latitude}, {site.longitude})</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(site.latitude && site.longitude) && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${site.latitude},${site.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-slate-400 hover:text-blue-600 rounded-lg transition-all"
                        title="Ver no Google Maps"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <button onClick={() => handleDeleteSite(site.id)} className="p-2 text-slate-400 hover:text-red-600 rounded-lg transition-all opacity-0 group-hover/site:opacity-100" title="Eliminar Unidade">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

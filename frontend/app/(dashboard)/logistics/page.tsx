"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Site, Client } from "@/lib/types";
import { GoogleMapsView } from "@/components/google-maps-view";
import { MapPin, Building2, Search, Loader2, Navigation, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LogisticsPage() {
    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);

    const fetchSites = async () => {
        setLoading(true);
        // Fetch sites with client info
        const { data, error } = await supabase
            .from('sites')
            .select(`
                *,
                client:clients(name)
            `);

        if (!error && data) {
            setSites(data as any);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchSites();
    }, []);

    const filteredSites = sites.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s as any).client?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.address?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Filter sites that have GPS coords
    const mappedSites = filteredSites.filter(s => s.latitude && s.longitude);

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col gap-6">
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Logística & Mapas</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Visualize e gira a localização geográfica das suas unidades.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-xl border border-emerald-100 dark:border-emerald-800 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {mappedSites.length} Unidades Mapeadas
                    </div>
                </div>
            </div>

            <div className="flex-1 flex gap-6 min-h-0">
                {/* Sidebar - List of Sites */}
                <div className="w-80 flex flex-col bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Filtrar unidades..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border-none ring-1 ring-slate-100 dark:ring-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-500 outline-none"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {loading ? (
                            <div className="flex items-center justify-center py-10">
                                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                            </div>
                        ) : filteredSites.length === 0 ? (
                            <div className="text-center py-10 px-4">
                                <MapPin className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nenhuma unidade encontrada</p>
                            </div>
                        ) : (
                            filteredSites.map(site => (
                                <button
                                    key={site.id}
                                    onClick={() => setSelectedSiteId(site.id)}
                                    className={cn(
                                        "w-full text-left p-3 rounded-2xl transition-all group border border-transparent",
                                        selectedSiteId === site.id
                                            ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg"
                                            : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={cn(
                                            "mt-1 rotate-45 h-2 w-2 rounded-full shrink-0",
                                            site.latitude && site.longitude ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                                        )} title={site.latitude ? "Com coordenadas" : "Sem coordenadas"} />
                                        <div className="min-w-0">
                                            <div className="font-bold text-sm truncate uppercase tracking-tight">{site.name}</div>
                                            <div className={cn(
                                                "text-[10px] font-bold truncate",
                                                selectedSiteId === site.id ? "text-white/60 dark:text-slate-500" : "text-slate-400"
                                            )}>
                                                {(site as any).client?.name}
                                            </div>
                                            {site.address && (
                                                <div className={cn(
                                                    "text-[10px] truncate mt-1",
                                                    selectedSiteId === site.id ? "text-white/40 dark:text-slate-400" : "text-slate-400"
                                                )}>
                                                    {site.address}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Map View */}
                <div className="flex-1 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm relative">
                    <GoogleMapsView
                        sites={mappedSites}
                        selectedSiteId={selectedSiteId}
                        onSiteSelect={setSelectedSiteId}
                    />
                </div>
            </div>
        </div>
    );
}

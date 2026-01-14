"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../lib/utils";
import { useAuth } from "../lib/auth-context";
import { useTheme } from "../lib/theme-context";
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  LayoutGrid,
  LogOut,
  CheckCircle2,
  UserCircle,
  Map as MapIcon,
  Search,
  GripVertical,
  Loader2,
  Sun,
  Moon,
  Menu,
  X,
  CalendarDays,
  Filter,
  MapPin
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Worker } from "../lib/types";

const menuItems = [
  { title: "Dashboard", href: "/", icon: <LayoutDashboard className="h-4 w-4" /> },
  { title: "Colaboradores", href: "/workers", icon: <Users className="h-4 w-4" /> },
  { title: "Clientes", href: "/clients", icon: <Building2 className="h-4 w-4" /> },
  { title: "Pedidos de Trabalho", href: "/job-orders", icon: <Briefcase className="h-4 w-4" /> },
  { title: "Escalas", href: "/schedules", icon: <CalendarDays className="h-4 w-4" /> },
  { title: "Logística", href: "/logistics", icon: <MapIcon className="h-4 w-4" /> },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut, loading: authLoading } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [pendingCount, setPendingCount] = useState(0);
  const [assignmentUpdateTick, setAssignmentUpdateTick] = useState(0);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [workerSearch, setWorkerSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'scheduled'>('all');
  const [loadingWorkers, setLoadingWorkers] = useState(true);

  useEffect(() => {
    const fetchWorkers = async () => {
      setLoadingWorkers(true);

      // 1. Fetch active workers
      const { data: workerData, error: workerError } = await supabase
        .from('workers')
        .select(`
          *,
          profiles:profiles(avatar_url),
          roles:worker_roles(role:roles(*))
        `)
        .eq('status', 'active')
        .order('first_name');

      // 2. Fetch only currently active assignments (proposed or confirmed)
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('assignments')
        .select('worker_id')
        .in('status', ['proposed', 'confirmed']);

      if (!workerError && workerData) {
        // Create a fast lookup set for scheduled workers
        const scheduledWorkerIds = new Set(assignmentData?.map(a => a.worker_id) || []);

        const workersWithStatus = workerData.map((w: any) => ({
          ...w,
          is_scheduled: scheduledWorkerIds.has(w.id)
        }));
        setWorkers(workersWithStatus);
      }
      setLoadingWorkers(false);
    };
    fetchWorkers();
  }, [assignmentUpdateTick]); // Refetch when assignments change

  const filteredWorkers = workers.filter(w => {
    const mainRole = (w as any).roles?.[0]?.role?.name || "";
    const tags = w.tags || [];
    const searchLower = workerSearch.toLowerCase();

    const matchesSearch =
      `${w.first_name} ${w.last_name}`.toLowerCase().includes(searchLower) ||
      mainRole.toLowerCase().includes(searchLower) ||
      tags.some((t: string) => t.toLowerCase().includes(searchLower));

    if (statusFilter === 'available') return matchesSearch && !(w as any).is_scheduled;
    if (statusFilter === 'scheduled') return matchesSearch && (w as any).is_scheduled;
    return matchesSearch;
  });

  useEffect(() => {
    const fetchPendingCount = async () => {
      const { count, error } = await supabase
        .from("assignments")
        .select("*", { count: 'exact', head: true })
        .eq("status", "proposed");

      if (!error && count !== null) {
        setPendingCount(count);
      }
    };

    const handleDataChange = () => {
      // Small delay to let DB settle
      setTimeout(() => {
        fetchPendingCount();
        setAssignmentUpdateTick(prev => prev + 1);
      }, 300);
    };

    fetchPendingCount();

    // Subscribe to both assignments and workers
    const channel = supabase
      .channel("sidebar-realtime-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "assignments" },
        handleDataChange
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "workers" },
        handleDataChange
      )
      .subscribe();

    // Listen for custom workforce updates from other components
    window.addEventListener('workforce-update', handleDataChange);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('workforce-update', handleDataChange);
    };
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <aside className="w-60 h-screen bg-[#0f172a] dark:bg-[#020617] text-white flex flex-col p-4 border-r border-slate-200/5 dark:border-white/5 sticky top-0 overflow-y-auto hide-on-mobile transition-all duration-300">
      <div className="flex items-center gap-3 mb-6 px-1">
        <div className="h-9 w-9 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center border border-slate-100 dark:border-slate-700">
          <CheckCircle2 className="h-5 w-5 text-slate-900 dark:text-emerald-500" />
        </div>
        <div>
          <span className="text-lg font-black tracking-tight text-white leading-none block">Vertex</span>
          <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">Workforce</span>
        </div>
      </div>

      <nav className="space-y-1.5 mb-6">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const showBadge = (item.href === "/job-orders" || item.href === "/dispatch") && pendingCount > 0;

          return (
            <Link
              key={item.href}
              href={item.href as any}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 font-black text-[11px] uppercase tracking-wider",
                isActive
                  ? "bg-white text-slate-950 translate-x-1"
                  : "text-white/40 hover:text-white hover:bg-white/5"
              )}
            >
              <div className={cn("transition-transform duration-200", isActive && "scale-105")}>{item.icon}</div>
              {item.title}
              {showBadge && (
                <span className={cn(
                  "ml-auto flex items-center justify-center h-4 w-4 rounded-full text-[9px] font-black",
                  isActive
                    ? "bg-slate-900 text-white"
                    : "bg-amber-500 text-slate-900"
                )}>
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Worker Pool Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Pool de Staff</span>
          <span className="bg-white/5 text-white/40 text-[8px] font-black px-1.5 py-0.5 rounded-md">
            {workers.length}
          </span>
        </div>

        <div className="flex flex-col gap-2 px-1 mb-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-white/20 group-focus-within:text-emerald-500 transition-colors" />
            <input
              type="text"
              placeholder="Nome ou Função..."
              className="w-full bg-white/5 border-none rounded-lg py-2 pl-8 pr-3 text-[10px] text-white placeholder:text-white/20 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all"
              value={workerSearch}
              onChange={(e) => setWorkerSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={cn(
                "flex-1 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all border",
                statusFilter === 'all'
                  ? "bg-white text-slate-900 border-white"
                  : "bg-white/5 text-white/40 border-white/5 hover:bg-white/10"
              )}
            >
              Todos
            </button>
            <button
              onClick={() => setStatusFilter('available')}
              className={cn(
                "flex-1 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all border",
                statusFilter === 'available'
                  ? "bg-emerald-500 text-white border-emerald-500"
                  : "bg-emerald-500/10 text-emerald-500/60 border-emerald-500/10 hover:bg-emerald-500/20"
              )}
            >
              Livre
            </button>
            <button
              onClick={() => setStatusFilter('scheduled')}
              className={cn(
                "flex-1 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all border",
                statusFilter === 'scheduled'
                  ? "bg-amber-500 text-slate-900 border-amber-500"
                  : "bg-amber-500/10 text-amber-500/60 border-amber-500/10 hover:bg-amber-500/20"
              )}
            >
              Escala
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 px-1 custom-scrollbar">
          {loadingWorkers ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-white/20" />
            </div>
          ) : (
            (() => {
              const grouped = filteredWorkers.reduce((acc, w) => {
                const city = w.city || "Transversal";
                if (!acc[city]) acc[city] = [];
                acc[city].push(w);
                return acc;
              }, {} as Record<string, Worker[]>);

              const sortedCities = Object.keys(grouped).sort((a, b) => {
                if (a === "Transversal") return 1;
                if (b === "Transversal") return -1;
                return a.localeCompare(b);
              });

              return sortedCities.map(city => (
                <div key={city} className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 px-1 py-1">
                    <MapPin className="h-2.5 w-2.5 text-emerald-500/50" />
                    <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">{city}</span>
                    <div className="flex-1 h-[1px] bg-white/5" />
                    <span className="text-[7px] font-black text-white/20">{grouped[city].length}</span>
                  </div>
                  <div className="space-y-1">
                    {grouped[city].map(worker => {
                      const mainRole = (worker as any).roles?.[0]?.role?.name || "Geral";
                      const experience = worker.experience_years || 0;
                      const isScheduled = (worker as any).is_scheduled;

                      return (
                        <div
                          key={worker.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('worker', JSON.stringify(worker));
                            e.dataTransfer.effectAllowed = 'copy';
                          }}
                          className="group flex flex-col gap-1.5 p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-grab active:cursor-grabbing transition-all border border-transparent hover:border-white/5"
                        >
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-3 w-3 text-white/10 group-hover:text-white/30 shrink-0" />
                            <div className="h-6 w-6 rounded-md overflow-hidden bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-[9px] shrink-0 border border-white/5">
                              {(worker as any).profiles?.avatar_url ? (
                                <img
                                  src={(worker as any).profiles.avatar_url}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="uppercase">{worker.first_name[0]}{worker.last_name[0]}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[10px] font-black text-emerald-500/90 uppercase tracking-tight leading-none mb-0.5">
                                {mainRole}
                              </div>
                              <div className="text-[9px] font-medium text-white/50 truncate leading-none">
                                {worker.first_name} {worker.last_name}
                              </div>
                            </div>
                          </div>

                          {/* Tags */}
                          <div className="flex flex-wrap gap-1 ml-5">
                            <span className={cn(
                              "text-[7px] font-black uppercase tracking-tighter px-1 rounded-[2px]",
                              isScheduled
                                ? "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            )}>
                              {isScheduled ? "Escalado" : "Disponível"}
                            </span>
                            <span className="bg-white/5 text-white/40 text-[7px] font-black uppercase tracking-tighter px-1 rounded-[2px] border border-white/5">
                              +{experience} Anos EXP
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ));
            })()
          )}
          {!loadingWorkers && filteredWorkers.length === 0 && (
            <div className="text-[9px] text-white/20 text-center py-4 uppercase font-bold tracking-widest">
              Nenhum resultado
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-white/5 space-y-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 text-white/50 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/5"
          title={resolvedTheme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"}
        >
          {resolvedTheme === "dark" ? (
            <Sun className="h-3.5 w-3.5" />
          ) : (
            <Moon className="h-3.5 w-3.5" />
          )}
          <span className="text-[10px] font-bold uppercase tracking-widest">
            {resolvedTheme === "dark" ? "Modo Claro" : "Modo Escuro"}
          </span>
        </button>

        {/* User Info */}
        <div className="px-3 flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
            <UserCircle className="h-5 w-5 text-white/60" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-white truncate leading-none">
              {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Utilizador"}
            </div>
            <div className="text-[9px] text-white/30 truncate mt-1">{user?.email}</div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={signOut}
          disabled={authLoading}
          className="w-full flex items-center gap-3 text-white/50 hover:text-white transition-colors px-4 py-2 group rounded-lg hover:bg-white/5"
        >
          {authLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <LogOut className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
          )}
          <span className="text-[10px] font-bold uppercase tracking-widest">Sair</span>
        </button>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut, loading: authLoading } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPendingCount = async () => {
      const { count, error } = await supabase
        .from("assignments")
        .select("*", { count: 'exact', head: true })
        .eq("status", "proposed");

      if (!error && count !== null) {
        setPendingCount(count);
      }
    };

    fetchPendingCount();

    const channel = supabase
      .channel("mobile-pending-assignments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "assignments" },
        () => fetchPendingCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <>
      {/* Mobile Header */}
      <header className="show-on-mobile-only fixed top-0 left-0 right-0 z-40 bg-slate-900 dark:bg-slate-950 text-white px-4 py-3 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5 text-slate-900" />
          </div>
          <span className="text-lg font-black tracking-tight">Vertex</span>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <div className="h-5 w-5 bg-amber-500 rounded-full flex items-center justify-center text-[10px] font-black text-slate-900">
              {pendingCount}
            </div>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-white/60 hover:text-white"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="show-on-mobile-only fixed inset-0 z-30 bg-slate-900/95 dark:bg-slate-950/95 pt-16 px-4 pb-8 overflow-y-auto">
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              const showBadge = (item.href === "/job-orders" || item.href === "/dispatch") && pendingCount > 0;

              return (
                <Link
                  key={item.href}
                  href={item.href as any}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm relative",
                    isActive
                      ? "bg-white text-slate-900"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  )}
                >
                  {item.icon}
                  {item.title}
                  {showBadge && (
                    <span className={cn(
                      "ml-auto flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-black",
                      isActive
                        ? "bg-slate-900 text-white"
                        : "bg-amber-500 text-slate-900"
                    )}>
                      {pendingCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 pt-8 border-t border-white/10 space-y-4">
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="w-full flex items-center gap-4 text-white/50 px-6 py-3 rounded-xl"
            >
              {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span className="text-xs font-bold uppercase tracking-widest">
                {resolvedTheme === "dark" ? "Modo Claro" : "Modo Escuro"}
              </span>
            </button>

            <div className="px-6 flex items-center gap-3">
              <UserCircle className="h-6 w-6 text-white/40" />
              <span className="text-sm text-white/60">{user?.email}</span>
            </div>

            <button
              onClick={signOut}
              disabled={authLoading}
              className="w-full flex items-center gap-4 text-red-400 px-6 py-3 rounded-xl"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Sair</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

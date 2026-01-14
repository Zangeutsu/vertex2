"use client";

import React, { useState, useEffect } from "react";
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
    defaultDropAnimationSideEffects,
    useDroppable,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabase } from "../lib/supabase";
import { Worker, Assignment, JobOrder } from "../lib/types";
import { cn } from "../lib/utils";
import { User, CheckCircle2, Circle, AlertCircle, Trash2, Globe } from "lucide-react";

interface ColumnProps {
    id: string;
    title: string;
    items: any[];
    icon: React.ReactNode;
}

function SortableItem({ id, item, type }: { id: string, item: any, type: 'worker' | 'assignment' }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const worker = type === 'worker' ? item : (item as Assignment).worker;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={cn(
                "p-4 bg-white border border-slate-200 rounded-2xl shadow-sm cursor-grab active:cursor-grabbing hover:border-slate-400 transition-all group",
                isDragging && "opacity-50 ring-2 ring-slate-900 shadow-xl"
            )}
        >
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center font-black text-slate-500 text-xs border border-slate-100 uppercase overflow-hidden">
                    {worker?.profiles?.avatar_url ? (
                        <img
                            src={worker.profiles.avatar_url}
                            alt={`${worker.first_name} ${worker.last_name}`}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <>{worker?.first_name?.[0]}{worker?.last_name?.[0]}</>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900 truncate">{worker?.first_name} {worker?.last_name}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                        <Globe className="h-3 w-3 text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{(worker?.languages || []).join(", ")}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function BoardColumn({ id, title, items, icon }: ColumnProps) {
    const { setNodeRef } = useDroppable({
        id: id,
    });

    return (
        <div
            ref={setNodeRef}
            className="flex flex-col w-full min-w-[300px] bg-slate-50/50 rounded-3xl border border-slate-200 overflow-hidden"
        >
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-white">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-slate-100 rounded-lg text-slate-600">
                        {icon}
                    </div>
                    <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">{title}</h3>
                </div>
                <span className="text-xs font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{items.length}</span>
            </div>

            <SortableContext
                id={id}
                items={items.map(item => item.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="p-4 flex-1 space-y-3 min-h-[500px]">
                    {items.map((item) => (
                        <SortableItem
                            key={item.id}
                            id={item.id}
                            item={item}
                            type={id === 'available' ? 'worker' : 'assignment'}
                        />
                    ))}
                    {items.length === 0 && (
                        <div className="h-32 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-slate-300">
                            <p className="text-[10px] font-black uppercase tracking-widest">Nada aqui</p>
                        </div>
                    )}
                </div>
            </SortableContext>
        </div>
    );
}

export function DispatchBoard({ jobId }: { jobId: string }) {
    const [availableWorkers, setAvailableWorkers] = useState<Worker[]>([]);
    const [proposed, setProposed] = useState<Assignment[]>([]);
    const [confirmed, setConfirmed] = useState<Assignment[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const fetchData = async () => {
        // Fetch Job Detail
        const { data: job } = await supabase
            .from('job_orders')
            .select('role_id')
            .eq('id', jobId)
            .single();

        if (!job) return;

        // Fetch Assignments
        const { data: assignments } = await supabase
            .from('assignments')
            .select('*, worker:workers(*, profiles(avatar_url))')
            .eq('job_order_id', jobId);

        const prop = (assignments || []).filter(a => a.status === 'proposed');
        const conf = (assignments || []).filter(a => a.status === 'confirmed');
        setProposed(prop);
        setConfirmed(conf);

        // Fetch Available Workers (Active workers not already assigned to this job)
        const assignedWorkerIds = (assignments || []).map(a => a.worker_id);

        let workersQuery = supabase
            .from('workers')
            .select('*, profiles(avatar_url)')
            .eq('status', 'active');

        // Exclude already assigned workers
        if (assignedWorkerIds.length > 0) {
            workersQuery = workersQuery.not('id', 'in', `(${assignedWorkerIds.join(",")})`);
        }

        const { data: workers } = await workersQuery;

        setAvailableWorkers(workers as any || []);
    };

    useEffect(() => {
        if (jobId) fetchData();
    }, [jobId]);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeContainer = active.data.current?.sortable.containerId || active.id;
        const overContainer = over.data.current?.sortable.containerId || over.id;

        if (activeContainer !== overContainer) {
            // Logic to move between containers visually if needed
            // But for this MVP, we'll handle actual data updates on DragEnd
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeId = active.id as string;

        // Correctly find the over container
        const overId = over.id as string;
        const overContainer = (over.data.current?.sortable?.containerId || overId) as string;

        // Ensure we find the container even if dropped on an item
        const targetContainer = ['available', 'proposed', 'confirmed'].includes(overContainer)
            ? overContainer
            : null;

        if (!targetContainer) return;

        // Logic based on target
        if (targetContainer === 'proposed') {
            const worker = availableWorkers.find(w => w.id === activeId);
            if (worker) {
                await supabase.from('assignments').insert({
                    job_order_id: jobId,
                    worker_id: worker.id,
                    status: 'proposed'
                });
            }
        } else if (targetContainer === 'confirmed') {
            const assignment = proposed.find(a => a.id === activeId);
            if (assignment) {
                await supabase.from('assignments').update({ status: 'confirmed' }).eq('id', assignment.id);
            }
        } else if (targetContainer === 'available') {
            // Delete assignment if returned to available
            const assignment = proposed.find(a => a.id === activeId) || confirmed.find(a => a.id === activeId);
            if (assignment) {
                await supabase.from('assignments').delete().eq('id', assignment.id);
            }
        }

        fetchData();
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <BoardColumn
                    id="available"
                    title="Disponíveis"
                    items={availableWorkers}
                    icon={<User className="h-4 w-4" />}
                />
                <BoardColumn
                    id="proposed"
                    title="Propostos"
                    items={proposed}
                    icon={<Circle className="h-4 w-4" />}
                />
                <BoardColumn
                    id="confirmed"
                    title="Confirmados"
                    items={confirmed}
                    icon={<CheckCircle2 className="h-4 w-4" />}
                />
            </div>
            <DragOverlay>
                {activeId ? (
                    <div className="p-4 bg-white border border-slate-900 rounded-2xl shadow-2xl ring-2 ring-slate-900 opacity-90">
                        <div className="font-black text-slate-900 uppercase text-xs tracking-widest">A Arrastar...</div>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

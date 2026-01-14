"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { AllocationBoard } from "../../../components/allocation-board";
import { useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function DispatchPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const jobId = searchParams.get("job_id");

    useEffect(() => {
        if (!jobId) {
            router.push("/job-orders");
        }
    }, [jobId, router]);

    if (!jobId) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Redirecionando para Pedidos...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Link href="/job-orders" className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-xs font-black uppercase tracking-widest">
                <ChevronLeft className="h-4 w-4" />
                Voltar aos Pedidos
            </Link>

            <AllocationBoard jobOrderId={jobId} />
        </div>
    );
}

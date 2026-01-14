"use client";

import { Sidebar, MobileNav } from "../../components/sidebar";
import { ProtectedRoute } from "../../components/protected-route";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute>
            <div className="flex min-h-screen bg-[#f1f3f6] dark:bg-[#020617]">
                <Sidebar />
                <MobileNav />
                <main className="flex-1 p-4 md:p-6 max-w-[1600px] mx-auto overflow-x-hidden pt-16 md:pt-8">
                    {children}
                </main>
            </div>
        </ProtectedRoute>
    );
}

"use client";

import { useTheme } from "../lib/theme-context";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "../lib/utils";

export function ThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme();

    const options = [
        { value: "light" as const, icon: Sun, label: "Claro" },
        { value: "dark" as const, icon: Moon, label: "Escuro" },
        { value: "system" as const, icon: Monitor, label: "Sistema" },
    ];

    return (
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {options.map((option) => {
                const Icon = option.icon;
                const isActive = theme === option.value;
                return (
                    <button
                        key={option.value}
                        onClick={() => setTheme(option.value)}
                        className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                            isActive
                                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                        )}
                        title={option.label}
                    >
                        <Icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{option.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

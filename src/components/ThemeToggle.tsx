"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
    className?: string;
    showLabel?: boolean;
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch
    useEffect(() => setMounted(true), []);

    if (!mounted) {
        return (
            <button className={cn("p-2 rounded-lg text-transparent", className)} disabled>
                <div className="w-4 h-4" />
            </button>
        );
    }

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={cn(
                "flex items-center gap-2 p-2 rounded-lg text-sm transition-colors group",
                "text-foreground/70 hover:bg-primary/10 hover:text-primary",
                className
            )}
            title="Toggle theme"
        >
            {theme === "dark" ? (
                <Sun className="w-4 h-4 group-hover:drop-shadow-[0_0_8px_hsl(var(--primary)/0.35)]" />
            ) : (
                <Moon className="w-4 h-4 group-hover:drop-shadow-[0_0_8px_hsl(var(--primary)/0.35)]" />
            )}
            {showLabel && (
                <span className="font-mono text-xs hidden md:inline">
                    {theme === "dark" ? "light mode" : "dark mode"}
                </span>
            )}
        </button>
    );
}

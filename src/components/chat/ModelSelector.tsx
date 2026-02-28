"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export type ModelOption = {
    id: string;
    label: string;
    provider: string;
    dotColor: string;
    shape: string; // tailwind rounded class
};

export const AVAILABLE_MODELS: ModelOption[] = [
    {
        id: 'anthropic.claude-3-haiku-20240307-v1:0',
        label: 'Claude Haiku',
        provider: 'Anthropic',
        dotColor: '#F97316',
        shape: 'rounded-md',
    },
    {
        id: 'anthropic.claude-3-sonnet-20240229-v1:0',
        label: 'Claude Sonnet',
        provider: 'Anthropic',
        dotColor: '#F97316',
        shape: 'rounded-md',
    },
    // Visual-only entries to show model breadth
    {
        id: 'gpt-4o-visual',
        label: 'GPT-4o',
        provider: 'OpenAI — coming soon',
        dotColor: '#10B981',
        shape: 'rounded-full',
    },
    {
        id: 'gemini-pro-visual',
        label: 'Gemini Pro',
        provider: 'Google — coming soon',
        dotColor: '#3B82F6',
        shape: 'rotate-45 rounded-sm',
    },
];

// Only models that are actually wired up
const ACTIVE_MODEL_IDS = [
    'anthropic.claude-3-haiku-20240307-v1:0',
    'anthropic.claude-3-sonnet-20240229-v1:0',
];

interface ModelSelectorProps {
    selectedModelId: string;
    onSelectModel: (modelId: string) => void;
    disabled?: boolean;
}

export function ModelSelector({ selectedModelId, onSelectModel, disabled }: ModelSelectorProps) {
    const [open, setOpen] = useState(false);
    const [flashing, setFlashing] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const selected = AVAILABLE_MODELS.find((m) => m.id === selectedModelId) ?? AVAILABLE_MODELS[0];

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSelect = (model: ModelOption) => {
        if (!ACTIVE_MODEL_IDS.includes(model.id)) return;
        onSelectModel(model.id);
        setOpen(false);
        setFlashing(true);
        setTimeout(() => setFlashing(false), 600);
    };

    return (
        <div ref={ref} className="relative inline-block">
            {/* Trigger pill */}
            <button
                id="model-selector-btn"
                onClick={() => !disabled && setOpen((o) => !o)}
                disabled={disabled}
                className={cn(
                    'flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-full transition-all duration-200',
                    'border text-foreground/70 hover:text-foreground',
                    flashing && 'amber-flash',
                    disabled && 'opacity-40 cursor-not-allowed',
                )}
                style={{
                    borderColor: 'rgba(245,158,11,0.3)',
                    backgroundColor: open ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.04)',
                    boxShadow: open ? '0 0 15px rgba(245,158,11,0.3)' : '',
                }}
            >
                <div
                    className={cn('w-2.5 h-2.5 shrink-0', selected.shape)}
                    style={{ backgroundColor: selected.dotColor }}
                />
                <span>{selected.label}</span>
                <svg
                    width="10" height="10" viewBox="0 0 10 10"
                    className={cn('transition-transform duration-200', open && 'rotate-180')}
                    fill="none"
                >
                    <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute bottom-full left-0 mb-2 w-60 rounded-2xl overflow-hidden z-50"
                        style={{
                            background: 'hsl(var(--sidebar-bg))',
                            border: '1px solid rgba(245,158,11,0.2)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(245,158,11,0.1)',
                        }}
                    >
                        <div className="p-1.5 flex flex-col gap-0.5">
                            {AVAILABLE_MODELS.map((model) => {
                                const isActive = model.id === selectedModelId;
                                const isClickable = ACTIVE_MODEL_IDS.includes(model.id);
                                return (
                                    <button
                                        key={model.id}
                                        onClick={() => handleSelect(model)}
                                        className={cn(
                                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-mono transition-all duration-150 text-left',
                                            isActive
                                                ? 'text-foreground'
                                                : isClickable
                                                    ? 'text-foreground/60 hover:text-foreground hover:bg-amber/5'
                                                    : 'text-foreground/30 cursor-not-allowed',
                                        )}
                                        style={isActive ? {
                                            backgroundColor: 'rgba(245,158,11,0.1)',
                                            borderLeft: '2px solid #F59E0B',
                                        } : {}}
                                    >
                                        <div
                                            className={cn('w-3.5 h-3.5 shrink-0', model.shape)}
                                            style={{ backgroundColor: model.dotColor, opacity: isClickable ? 1 : 0.4 }}
                                        />
                                        <div className="flex flex-col">
                                            <span>{model.label}</span>
                                            <span className="text-[10px] text-foreground/30">{model.provider}</span>
                                        </div>
                                        {isActive && (
                                            <span className="ml-auto text-amber text-xs">✓</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        {/* Amber glow underline on active */}
                        <div
                            className="h-px w-full"
                            style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.3), transparent)' }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

"use client";

import React from 'react';
import { ModelSelector } from './ModelSelector';
import { ArrowUp, Paperclip } from 'lucide-react';

interface ChatInputProps {
    input: string;
    isLoading: boolean;
    selectedModelId: string;
    onInputChange: (val: string) => void;
    onSubmit: (e?: React.FormEvent) => void;
    onModelChange: (modelId: string) => void;
}

export function ChatInput({
    input,
    isLoading,
    selectedModelId,
    onInputChange,
    onSubmit,
    onModelChange,
}: ChatInputProps) {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
        }
    };

    const canSend = !isLoading && input.trim().length > 0;

    return (
        <div className="absolute bottom-0 left-0 right-0 w-full max-w-3xl mx-auto px-6 pb-8 z-20 pt-4"
            style={{
                background: 'linear-gradient(to top, hsl(var(--background)) 60%, transparent)',
            }}
        >
            {/* Glass input container */}
            <div className="glass-input flex flex-col w-full">
                {/* Textarea */}
                <textarea
                    id="chat-input"
                    className="w-full min-h-[96px] px-5 pt-5 pb-2 bg-transparent border-none resize-none focus:outline-none font-mono text-sm placeholder:text-foreground/25 text-foreground"
                    placeholder="message omnipotent... or recall [topic]"
                    value={input}
                    onChange={(e) => onInputChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                />

                {/* Footer row */}
                <div className="px-4 pb-4 flex items-center justify-between">
                    {/* Left: model selector + hint */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            className="p-1.5 text-foreground/40 hover:text-amber transition-colors rounded-lg hover:bg-amber/10"
                            title="Upload Context (.md)"
                        >
                            <Paperclip size={16} />
                        </button>
                        <ModelSelector
                            selectedModelId={selectedModelId}
                            onSelectModel={onModelChange}
                            disabled={isLoading}
                        />
                        <span className="text-[10px] font-mono text-foreground/25">
                            ⇧↵ new line
                        </span>
                    </div>

                    {/* Right: status + send */}
                    <div className="flex items-center gap-3">
                        {isLoading && (
                            <span className="text-[10px] font-mono text-amber/70 animate-pulse">
                                generating...
                            </span>
                        )}
                        <button
                            id="send-btn"
                            onClick={() => onSubmit()}
                            disabled={!canSend}
                            className="flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                            style={{
                                backgroundColor: canSend ? 'hsl(var(--amber))' : 'rgba(245,158,11,0.15)',
                                boxShadow: canSend ? '0 0 16px rgba(245,158,11,0.35)' : '',
                            }}
                        >
                            <ArrowUp size={14} className="text-background" strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            </div>

            <p className="text-center text-[10px] font-mono text-foreground/20 mt-3">
                omnipotent can make mistakes — verify important info
            </p>
        </div>
    );
}

"use client";

import { Plus, Trash2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { SignedIn, UserButton } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type Conversation = {
    id: string;
    title: string;
    created_at: string;
};

interface SidebarProps {
    conversations: Conversation[];
    activeConversationId: string | null;
    onSelectConversation: (id: string) => void;
    onNewChat: () => void;
    onDeleteConversation?: (id: string) => void;
}

export function Sidebar({
    conversations,
    activeConversationId,
    onSelectConversation,
    onNewChat,
    onDeleteConversation,
}: SidebarProps) {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch
    useEffect(() => setMounted(true), []);

    return (
        <aside
            className="w-[260px] flex flex-col justify-between z-10 relative hidden md:flex shrink-0 border-r"
            style={{ backgroundColor: 'hsl(var(--sidebar-bg))', borderColor: 'rgba(245,158,11,0.12)' }}
        >
            <div className="flex flex-col flex-1 overflow-hidden">
                {/* ── Logo ── */}
                <div className="p-6 shrink-0">
                    <h1 className="font-serif text-2xl font-bold tracking-tight text-amber">
                        omnipotent
                    </h1>
                </div>

                {/* ── New Chat Button ── */}
                <div className="px-4 pb-3 shrink-0">
                    <button
                        id="new-chat-btn"
                        onClick={onNewChat}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-mono text-foreground/60 hover:text-foreground border transition-all duration-200 group"
                        style={{ borderColor: 'rgba(245,158,11,0.2)', backgroundColor: 'rgba(245,158,11,0.04)' }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.boxShadow = '0 0 14px rgba(245,158,11,0.2)';
                            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,158,11,0.45)';
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.boxShadow = '';
                            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,158,11,0.2)';
                        }}
                    >
                        <Plus size={14} className="text-amber" />
                        new conversation
                    </button>
                </div>

                {/* ── Divider ── */}
                <div className="mx-4 mb-3 border-t" style={{ borderColor: 'rgba(245,158,11,0.1)' }} />

                {/* ── Conversation List ── */}
                <div className="px-3 flex flex-col gap-0.5 overflow-y-auto flex-1">
                    <p className="px-2 pb-2 text-[10px] font-mono uppercase tracking-widest text-foreground/30">
                        History
                    </p>
                    {conversations.length === 0 ? (
                        <p className="text-xs text-foreground/30 font-mono px-2 mt-2">
                            no conversations yet
                        </p>
                    ) : (
                        conversations.map((conv) => {
                            const isActive = conv.id === activeConversationId;
                            return (
                                <div key={conv.id} className={cn(
                                    "group flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-150 w-full",
                                    isActive
                                        ? "sidebar-item-active font-semibold"
                                        : "hover:bg-amber/5"
                                )}>
                                    <button
                                        onClick={() => onSelectConversation(conv.id)}
                                        className={cn(
                                            "text-left text-xs font-mono truncate flex-1",
                                            isActive ? "text-amber" : "text-foreground/50 group-hover:text-foreground"
                                        )}
                                        title={conv.title}
                                    >
                                        {conv.title}
                                    </button>

                                    {onDeleteConversation && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteConversation(conv.id);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 text-foreground/30 hover:text-red-500 transition-all p-1"
                                            title="Delete chat"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ── Footer ── */}
            <div className="p-5 flex flex-col gap-4 shrink-0 border-t" style={{ borderColor: 'rgba(245,158,11,0.1)' }}>
                <div className="flex flex-col gap-2">
                    <button className="text-left text-xs text-foreground/40 hover:text-amber transition-colors duration-150 font-mono">
                        ↑ upload context .md
                    </button>
                    <button className="text-left text-xs text-foreground/40 hover:text-amber transition-colors duration-150 font-mono">
                        ← home
                    </button>
                </div>

                {mounted && (
                    <div className="flex items-center justify-between pt-2 border-t border-[#F59E0B]/10">
                        <ThemeToggle showLabel />

                        <SignedIn>
                            <div className="p-1 pb-0 rounded-full hover:ring-2 hover:ring-amber/30 transition-all cursor-pointer">
                                <UserButton
                                    appearance={{
                                        baseTheme: theme === 'dark' ? dark : undefined,
                                        elements: {
                                            userButtonAvatarBox: "w-7 h-7",
                                            userButtonPopoverCard: "bg-background/90 border border-amber/20 backdrop-blur-xl",
                                            userPreviewMainIdentifier: "text-foreground font-semibold text-sm",
                                            userPreviewSecondaryIdentifier: "text-foreground/70",
                                            userButtonPopoverActionButtonText: "text-foreground text-sm",
                                            userButtonPopoverActionButtonIconBox: "text-foreground/70",
                                            userButtonPopoverFooter: "text-foreground/50 hidden",
                                        }
                                    }}
                                />
                            </div>
                        </SignedIn>
                    </div>
                )}
            </div>
        </aside>
    );
}

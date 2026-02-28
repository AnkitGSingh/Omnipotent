"use client";

import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Message = {
    role: 'user' | 'assistant';
    content: string;
};

// Maps model IDs to display names, geometric shapes, and identity colors
const MODEL_DISPLAY: Record<string, { label: string; shape: string; bgColor: string }> = {
    'anthropic.claude-3-haiku-20240307-v1:0': {
        label: 'Claude Haiku',
        bgColor: '#F97316',
        shape: 'rounded-md',
    },
    'anthropic.claude-3-sonnet-20240229-v1:0': {
        label: 'Claude Sonnet',
        bgColor: '#F97316',
        shape: 'rounded-md',
    },
    default: {
        label: 'AI',
        bgColor: '#F97316',
        shape: 'rounded-md',
    },
};

interface MessageBubbleProps {
    message: Message;
    modelId?: string;
}

export function MessageBubble({ message, modelId }: MessageBubbleProps) {
    const isUser = message.role === 'user';
    const model = MODEL_DISPLAY[modelId ?? 'default'] ?? MODEL_DISPLAY.default;
    const isThinking = !isUser && message.content === '';

    return (
        <div className={cn('flex flex-col w-full msg-animate', isUser ? 'items-end' : 'items-start')}>
            {/* Model indicator */}
            {!isUser && (
                <div className="flex items-center gap-2 mb-2 ml-1">
                    <div
                        className={cn('w-3.5 h-3.5 shadow-sm shrink-0', model.shape)}
                        style={{ backgroundColor: model.bgColor }}
                    />
                    <span className="font-mono text-[10px] text-foreground/40 uppercase tracking-wider">
                        {model.label}
                    </span>
                </div>
            )}

            {/* Bubble */}
            <div
                className={cn(
                    'px-5 py-4 max-w-[85%] text-sm font-mono whitespace-pre-wrap leading-relaxed',
                    isUser
                        ? 'glass-card text-foreground rounded-2xl rounded-br-sm'
                        : 'glass-card text-foreground rounded-2xl rounded-bl-sm',
                )}
                style={
                    isUser
                        ? { borderColor: 'rgba(245,158,11,0.4)', borderWidth: '1px', borderStyle: 'solid' }
                        : {}
                }
            >
                {isThinking ? (
                    /* Amber typing dots */
                    <span className="flex items-center gap-1.5 py-1">
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                    </span>
                ) : (
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            code: ({ children }) => (
                                <code className="bg-amber/10 text-amber px-1.5 py-0.5 rounded text-xs font-mono">
                                    {children}
                                </code>
                            ),
                            pre: ({ children }) => (
                                <pre className="bg-black/30 p-4 rounded-xl overflow-x-auto mt-2 mb-2 text-xs">
                                    {children}
                                </pre>
                            ),
                        }}
                    >
                        {message.content}
                    </ReactMarkdown>
                )}
            </div>
        </div>
    );
}

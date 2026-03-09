"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { THINKING_PHRASES } from "@/lib/constants";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
};

// Maps model IDs to display names, geometric shapes, and identity colors
const MODEL_DISPLAY: Record<
  string,
  { label: string; shape: string; bgColor: string }
> = {
  "us.anthropic.claude-sonnet-4-5-20250929-v1:0": {
    label: "Claude Sonnet 4.5",
    bgColor: "#F97316",
    shape: "rounded-md",
  },
  "us.anthropic.claude-3-haiku-20240307-v1:0": {
    label: "GPT-4o",
    bgColor: "#10A37F",
    shape: "rounded-md",
  },
  "global.anthropic.claude-sonnet-4-20250514-v1:0": {
    label: "Gemini 2.0 Flash",
    bgColor: "#4285F4",
    shape: "rounded-md",
  },
  "us.anthropic.claude-3-5-haiku-20241022-v1:0": {
    label: "DeepSeek R1",
    bgColor: "#6366F1",
    shape: "rounded-sm",
  },
  default: {
    label: "AI",
    bgColor: "#F97316",
    shape: "rounded-md",
  },
};

interface MessageBubbleProps {
  message: Message;
  modelId?: string;
}

function ThinkingIndicator() {
  const [phrase, setPhrase] = useState(THINKING_PHRASES[0]);

  useEffect(() => {
    // Immediately pick a random phrase
    setPhrase(
      THINKING_PHRASES[Math.floor(Math.random() * THINKING_PHRASES.length)],
    );
    // Rotate every 2.5 s
    const interval = setInterval(() => {
      setPhrase(
        THINKING_PHRASES[Math.floor(Math.random() * THINKING_PHRASES.length)],
      );
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="flex items-center gap-2 py-1">
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="text-[10px] font-mono text-primary/60 ml-1 italic">
        {phrase}
      </span>
    </span>
  );
}

export function MessageBubble({ message, modelId }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const model = MODEL_DISPLAY[modelId ?? "default"] ?? MODEL_DISPLAY.default;
  const isThinking = !isUser && message.content === "";

  return (
    <div
      className={cn(
        "flex flex-col w-full msg-animate",
        isUser ? "items-end" : "items-start",
      )}
    >
      {/* Model indicator */}
      {!isUser && (
        <div className="flex items-center gap-2 mb-2 ml-1">
          <div
            className={cn("w-3.5 h-3.5 shadow-sm shrink-0", model.shape)}
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
          "px-5 py-4 max-w-[85%] text-sm font-mono leading-[1.75]",
          isUser
            ? "glass-card text-foreground rounded-2xl rounded-br-sm"
            : "glass-card text-foreground rounded-2xl rounded-bl-sm",
        )}
        style={
          isUser
            ? {
                background: "hsl(var(--user-bubble)/0.86)",
                borderColor: "hsl(var(--primary)/0.4)",
                borderWidth: "1px",
                borderStyle: "solid",
              }
            : {
                background: "hsl(var(--assistant-bubble)/0.8)",
              }
        }
      >
        {isThinking ? (
          <ThinkingIndicator />
        ) : (
          <Markdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => (
                <p className="mb-1.5 last:mb-0 leading-[1.75]">{children}</p>
              ),
              h1: ({ children }) => (
                <h1 className="font-serif text-lg font-bold mt-3 mb-2 text-foreground">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="font-serif text-base font-semibold mt-2.5 mb-1.5 text-foreground">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="font-mono text-sm font-semibold mt-2 mb-1 text-foreground/90">
                  {children}
                </h3>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-outside space-y-1 mb-2 pl-5">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-outside space-y-1 mb-2 pl-5">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="leading-[1.7] text-foreground/85">{children}</li>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-foreground">
                  {children}
                </strong>
              ),
              em: ({ children }) => (
                <em className="italic text-foreground/80">{children}</em>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-primary/40 pl-3 my-2 text-foreground/65 italic">
                  {children}
                </blockquote>
              ),
              code: ({ children }) => (
                <code className="bg-primary/15 text-primary px-1.5 py-0.5 rounded text-xs font-mono">
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre className="bg-muted/80 dark:bg-secondary/60 border border-border/50 dark:border-border/40 p-4 rounded-xl overflow-x-auto mt-2 mb-2 text-xs leading-relaxed">
                  {children}
                </pre>
              ),
            }}
          >
            {message.content}
          </Markdown>
        )}
      </div>

      {/* Sources footnote */}
      {!isUser && message.sources && message.sources.length > 0 && (
        <div className="mt-2 ml-1 flex flex-wrap gap-2">
          {message.sources.map((src, i) => (
            <a
              key={i}
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-mono text-primary/50 hover:text-primary underline underline-offset-2 transition-colors"
            >
              [{i + 1}] {src}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export type ModelOption = {
  id: string;
  label: string;
  provider: string;
  dotColor: string;
  shape: string; // tailwind rounded class
};

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: "us.anthropic.claude-sonnet-4-5-20250929-v1:0",
    label: "Claude Sonnet 4.5",
    provider: "Anthropic",
    dotColor: "#F97316",
    shape: "rounded-md",
  },
  {
    id: "us.anthropic.claude-3-haiku-20240307-v1:0",
    label: "GPT-4o",
    provider: "OpenAI",
    dotColor: "#10A37F",
    shape: "rounded-md",
  },
  {
    id: "global.anthropic.claude-sonnet-4-20250514-v1:0",
    label: "Gemini 2.0 Flash",
    provider: "Google",
    dotColor: "#4285F4",
    shape: "rounded-md",
  },
  {
    id: "us.anthropic.claude-3-5-haiku-20241022-v1:0",
    label: "DeepSeek R1",
    provider: "DeepSeek",
    dotColor: "#6366F1",
    shape: "rounded-sm",
  },
];

// Only models verified working against live AWS account
const ACTIVE_MODEL_IDS = [
  "us.anthropic.claude-sonnet-4-5-20250929-v1:0",
  "us.anthropic.claude-3-haiku-20240307-v1:0",
  "global.anthropic.claude-sonnet-4-20250514-v1:0",
  "us.anthropic.claude-3-5-haiku-20241022-v1:0",
];

interface ModelSelectorProps {
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  disabled?: boolean;
}

export function ModelSelector({
  selectedModelId,
  onSelectModel,
  disabled,
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [flashing, setFlashing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected =
    AVAILABLE_MODELS.find((m) => m.id === selectedModelId) ??
    AVAILABLE_MODELS[0];

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
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
      <motion.button
        id="model-selector-btn"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        whileHover={!disabled ? { y: -1 } : {}}
        whileTap={!disabled ? { scale: 0.97 } : {}}
        transition={{ type: "spring", stiffness: 420, damping: 20 }}
        className={cn(
          "flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-full",
          "border text-foreground/70 hover:text-foreground",
          flashing && "theme-flash",
          disabled && "opacity-40 cursor-not-allowed",
        )}
        style={{
          borderColor: "hsl(var(--primary)/0.3)",
          backgroundColor: open
            ? "hsl(var(--surface-elevated)/0.95)"
            : "hsl(var(--surface)/0.8)",
          boxShadow: open ? "0 0 15px hsl(var(--primary)/0.3)" : "",
          transition:
            "background-color 140ms ease, border-color 140ms ease, box-shadow 220ms ease",
        }}
      >
        <div
          className={cn("w-2.5 h-2.5 shrink-0", selected.shape)}
          style={{ backgroundColor: selected.dotColor }}
        />
        <span>{selected.label}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          className={cn(
            "transition-transform duration-200",
            open && "rotate-180",
          )}
          fill="none"
        >
          <path
            d="M2 3.5L5 6.5L8 3.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute bottom-full left-0 mb-2 w-60 rounded-2xl overflow-hidden z-50"
            style={{
              background: "hsl(var(--surface-elevated))",
              border: "1px solid hsl(var(--primary)/0.2)",
              boxShadow:
                "0 10px 32px hsl(var(--background)/0.55), 0 0 0 1px hsl(var(--primary)/0.1)",
            }}
          >
            <div className="p-1.5 flex flex-col gap-0.5">
              {AVAILABLE_MODELS.map((model) => {
                const isActive = model.id === selectedModelId;
                const isClickable = ACTIVE_MODEL_IDS.includes(model.id);
                return (
                  <motion.button
                    key={model.id}
                    onClick={() => handleSelect(model)}
                    whileHover={isClickable ? { x: 3 } : {}}
                    whileTap={isClickable ? { scale: 0.97 } : {}}
                    transition={{ type: "spring", stiffness: 500, damping: 22 }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-mono text-left",
                      isActive
                        ? "text-foreground"
                        : isClickable
                          ? "text-foreground/60 hover:text-foreground hover:bg-primary/5"
                          : "text-foreground/30 cursor-not-allowed",
                    )}
                    style={
                      isActive
                        ? {
                            backgroundColor: "hsl(var(--primary)/0.1)",
                            borderLeft: "2px solid hsl(var(--primary))",
                            transition: "background-color 140ms ease",
                          }
                        : {
                            transition:
                              "background-color 140ms ease, color 140ms ease",
                          }
                    }
                  >
                    <motion.div
                      className={cn("w-3.5 h-3.5 shrink-0", model.shape)}
                      style={{
                        backgroundColor: model.dotColor,
                        opacity: isClickable ? 1 : 0.4,
                      }}
                      whileHover={isClickable ? { scale: 1.25 } : {}}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 20,
                      }}
                    />
                    <div className="flex flex-col">
                      <span>{model.label}</span>
                    </div>
                    {isActive && (
                      <span className="ml-auto text-primary text-xs">✓</span>
                    )}
                  </motion.button>
                );
              })}
            </div>
            {/* Zinc glow underline on active */}
            <div
              className="h-px w-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent, hsl(var(--primary)/0.3), transparent)",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

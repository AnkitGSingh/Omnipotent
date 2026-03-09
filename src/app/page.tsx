"use client";

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SignedIn, SignedOut, useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { Cpu, Database, Search, Lightbulb, FileText, Code, LineChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/chat/Sidebar';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { AVAILABLE_MODELS } from '@/components/chat/ModelSelector';
import { ThemeToggle } from '@/components/ThemeToggle';
import { DotPattern } from '@/components/magicui/dot-pattern';

// Route through Next.js proxy (/backend/*) to avoid browser CORS issues.
// next.config.mjs rewrites /backend/* → FastAPI backend.
const API_BASE = '/backend';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  modelId?: string;
};

type Conversation = {
  id: string;
  title: string;
  created_at: string;
};

// Model dot identities for the hero display
const HERO_MODELS: Record<string, { color: string; shape: string; label: string }> = {
  'us.anthropic.claude-sonnet-4-5-20250929-v1:0': { color: '#F97316', shape: 'rounded-md', label: 'Claude' },
  'us.anthropic.claude-3-haiku-20240307-v1:0': { color: '#10A37F', shape: 'rounded-md', label: 'GPT-4o' },
  'global.anthropic.claude-sonnet-4-20250514-v1:0': { color: '#4285F4', shape: 'rounded-md', label: 'Gemini' },
  'us.anthropic.claude-3-5-haiku-20241022-v1:0': { color: '#6366F1', shape: 'rounded-sm', label: 'DeepSeek' },
};

const DEFAULT_HERO_MODEL = HERO_MODELS['us.anthropic.claude-sonnet-4-5-20250929-v1:0'];

export default function Home() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>(AVAILABLE_MODELS[0].id);
  const [modelIconFx, setModelIconFx] = useState({ x: 50, y: 50, isHovering: false });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Shared helper — always call this to refresh the sidebar list
  const refreshConversations = async () => {
    try {
      const token = await getToken();
      if (!token) return; // guard: Clerk not ready yet
      const res = await fetch(`${API_BASE}/api/conversations/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return; // guard: don't wipe list on server error
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (err) {
      console.error('Failed to refresh conversations:', err);
    }
  };

  // Load conversation history on mount
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    refreshConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn]);

  const loadConversation = async (id: string) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/conversations/${id}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setConversationId(id);
      setMessages(
        (data.messages || []).map((m: { role: string; content: string; model_used?: string | null }) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
          modelId: m.model_used ?? undefined,
        }))
      );
    } catch (err) {
      console.error("Failed to load conversation:", err);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setConversationId(null);
  };

  const handleModelIconMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setModelIconFx({ x, y, isHovering: true });
  };

  const handleModelIconLeave = () => {
    setModelIconFx({ x: 50, y: 50, isHovering: false });
  };

  const handleSubmit = async (e?: React.FormEvent, overrideInput?: string) => {
    if (e) e.preventDefault();
    const promptText = overrideInput || input;
    if (!promptText.trim() || isLoading) return;

    const userMessage = promptText.trim();
    if (!overrideInput) setInput('');

    const baseMessages: Message[] = [
      ...messages,
      { role: 'user', content: userMessage },
    ];
    const newMessages: Message[] = [
      ...baseMessages,
      { role: 'assistant', content: '', modelId: selectedModelId },
    ];
    setMessages(newMessages);
    setIsLoading(true);

    let accumulatedText = '';
    let rafPending = false;
    let sseBuffer = '';

    // Batch React state updates at display refresh rate (~60fps) to avoid
    // a re-render on every single streamed token.
    const scheduleUpdate = () => {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => {
        rafPending = false;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: accumulatedText, modelId: selectedModelId };
          return updated;
        });
      });
    };

    try {
      const token = await getToken();

      const response = await fetch(`${API_BASE}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: baseMessages.map(m => ({ role: m.role, content: m.content })),
          model_id: selectedModelId,
          conversation_id: conversationId ?? undefined,
        }),
      });
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // Use a persistent buffer so SSE events that span multiple reads are
      // never silently dropped.
      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });

        let boundary: number;
        while ((boundary = sseBuffer.indexOf('\n\n')) !== -1) {
          const event = sseBuffer.slice(0, boundary);
          sseBuffer = sseBuffer.slice(boundary + 2);

          if (!event.startsWith('data: ')) continue;
          const dataStr = event.slice(6); // strip 'data: '
          if (dataStr === '[DONE]') break outer;

          try {
            const data = JSON.parse(dataStr);
            if (data.error) { console.error("Backend error:", data.error); continue; }
            if (data.conversation_id) {
              setConversationId(data.conversation_id);
              refreshConversations();
            }
            if (data.text) {
              accumulatedText += data.text;
              scheduleUpdate();
            }
          } catch (err) {
            console.error("Error parsing SSE chunk", err);
          }
        }
      }

      // Flush any final text that arrived after the last rAF scheduled
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: accumulatedText, modelId: selectedModelId };
        return updated;
      });
    } catch (error) {
      console.error("Fetch error:", error);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: "Sorry, there was an error communicating with the AI.", modelId: selectedModelId };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE}/api/conversations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setConversations(prev => prev.filter(c => c.id !== id));
        if (conversationId === id) handleNewChat();
      } else {
        console.error("Failed to delete conversation");
      }
    } catch (e) {
      console.error("Error deleting conversation", e);
    }
  };

  return (
    <main className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Sidebar - Only show when Signed In */}
      <SignedIn>
        <Sidebar
          conversations={conversations}
          activeConversationId={conversationId}
          onSelectConversation={loadConversation}
          onNewChat={handleNewChat}
          onDeleteConversation={deleteConversation}
        />
      </SignedIn>

      {/* Main Chat Area */}
      <section className="flex-1 flex flex-col relative bg-background overflow-hidden constellation-bg">
        {/* Subtle texture only (no glow lights) */}
        <DotPattern
          width={20}
          height={20}
          cr={1.1}
          className="fill-foreground/30 opacity-[0.2] dark:fill-foreground/20 dark:opacity-[0.12] pointer-events-none"
          style={{
            maskImage: 'radial-gradient(74% 66% at 50% 48%, black 35%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(74% 66% at 50% 48%, black 35%, transparent 100%)',
          }}
        />

        {/* Global Nav (Theme Toggle) for SignedOut Guests */}
        <SignedOut>
          <div className="absolute top-6 right-8 z-50">
            <ThemeToggle className="bg-background/80 backdrop-blur-md border border-primary/10 shadow-lg" />
          </div>
        </SignedOut>

        {/* ── Chat Feed ── */}
        <div className="flex-1 overflow-y-auto w-full z-10 pt-16 pb-40 scroll-smooth">
          {(!isSignedIn || messages.length === 0) ? (
            /* ── Hero State ── */
            <div className="flex flex-col items-center justify-center h-full -mt-6 px-6">

              <SignedOut>
                {/* Model dots — float in first */}
                <motion.div
                  className="mb-6 flex items-center gap-3"
                  initial={{ opacity: 0, y: -16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
                >
                  {Object.values(HERO_MODELS).map((m, i) => (
                    <motion.div
                      key={m.label}
                      title={m.label}
                      className={cn('w-3 h-3 cursor-default', m.shape)}
                      style={{ backgroundColor: m.color }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      whileHover={{ scale: 1.4 }}
                      transition={{ duration: 0.35, delay: 0.15 + i * 0.08, type: 'spring', stiffness: 300 }}
                    />
                  ))}
                </motion.div>

                {/* Main heading */}
                <motion.h2
                  className="font-serif text-6xl md:text-8xl font-bold mb-4 tracking-tight text-center text-primary"
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                >
                  omnipotent
                </motion.h2>

                {/* Tagline — cascades in */}
                <motion.p
                  className="font-mono text-base text-foreground/60 mb-2 text-center"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: 'easeOut', delay: 0.65 }}
                >
                  One platform. All models. Total control.
                </motion.p>
                <motion.p
                  className="font-mono text-sm text-foreground/30 mb-8 text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: 'easeOut', delay: 0.8 }}
                >
                  switch models mid-conversation — context travels with you
                </motion.p>

                {/* Auth / Hint section */}
                <div className="mt-8">
                  <motion.div
                    className="flex flex-col items-center gap-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.4 }}
                  >
                    <Link href="/sign-in" className="cta-shimmer px-8 py-3 rounded-full bg-primary/12 border border-primary/30 text-primary font-mono text-sm hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_24px_hsl(var(--primary)/0.32)] hover:-translate-y-0.5 transition-all flex items-center gap-2 group">
                      Sign in to Omnipotent
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 group-hover:translate-x-1 transition-transform">
                        <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Link>
                    <p className="font-mono text-xs text-foreground/40 text-center">
                      50 free messages • no credit card
                    </p>
                  </motion.div>
                </div>
              </SignedOut>

              {/* Native AI Empty State for Authenticated Users */}
              <SignedIn>
                <motion.div
                  className="flex flex-col items-center justify-center gap-8 w-full max-w-2xl px-4"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  {/* Dynamic Active Model Display */}
                  <div className="flex flex-col items-center gap-5 mt-4">
                    {(() => {
                      const activeHeroModel = HERO_MODELS[selectedModelId] || DEFAULT_HERO_MODEL;

                      return (
                        <motion.div
                          className="[perspective:720px]"
                          animate={modelIconFx.isHovering ? { y: 0 } : { y: [0, -5, 0] }}
                          transition={
                            modelIconFx.isHovering
                              ? { type: 'spring', stiffness: 300, damping: 20 }
                              : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }
                          }
                        >
                          <motion.div
                            className="w-16 h-16 flex items-center justify-center rounded-2xl shadow-2xl relative overflow-hidden"
                            style={{
                              backgroundColor: `${activeHeroModel.color}15`,
                              border: `1px solid ${activeHeroModel.color}35`,
                              transformStyle: 'preserve-3d',
                            }}
                            animate={{
                              rotateX: modelIconFx.isHovering ? (50 - modelIconFx.y) / 7 : 0,
                              rotateY: modelIconFx.isHovering ? (modelIconFx.x - 50) / 7 : 0,
                              scale: modelIconFx.isHovering ? 1.06 : 1,
                              boxShadow: modelIconFx.isHovering
                                ? `0 16px 40px hsl(var(--background)/0.7), 0 0 28px ${activeHeroModel.color}40`
                                : `0 14px 34px hsl(var(--background)/0.6), 0 0 14px ${activeHeroModel.color}20`,
                            }}
                            transition={{ type: 'spring', stiffness: 220, damping: 18, mass: 0.7 }}
                            onMouseMove={handleModelIconMove}
                            onMouseLeave={handleModelIconLeave}
                            layoutId="active-model-icon"
                          >
                            <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle, ${activeHeroModel.color} 0%, transparent 70%)` }} />
                            <motion.div
                              className="absolute inset-0 pointer-events-none"
                              style={{
                                background: `radial-gradient(56px 56px at ${modelIconFx.x}% ${modelIconFx.y}%, hsl(var(--foreground)/0.24), transparent 68%)`,
                                mixBlendMode: 'screen',
                              }}
                              animate={{ opacity: modelIconFx.isHovering ? 1 : 0.45 }}
                              transition={{ duration: 0.24 }}
                            />
                            <motion.div
                              className={cn('w-6 h-6 z-10', activeHeroModel.shape)}
                              style={{ backgroundColor: activeHeroModel.color, transform: 'translateZ(18px)' }}
                              animate={{ scale: modelIconFx.isHovering ? 1.07 : 1 }}
                              transition={{ duration: 0.24 }}
                            />
                          </motion.div>
                        </motion.div>
                      );
                    })()}
                    <h2 className="font-serif text-2xl font-semibold text-foreground/80 tracking-tight">
                      How can I help you today?
                    </h2>
                  </div>

                  {/* Quick Action Suggestion Pills */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mt-4">
                    {[
                      { icon: <Lightbulb size={16} />, text: "Help me brainstorm ideas" },
                      { icon: <FileText size={16} />, text: "Summarize this meeting" },
                      { icon: <Code size={16} />, text: "Write a Python script" },
                      { icon: <LineChart size={16} />, text: "Analyze this data" },
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSubmit(undefined, item.text)}
                        className="card-lift flex items-center gap-3 p-4 rounded-xl border border-border/30 bg-card/55 hover:bg-card/82 text-left group hover:border-primary/35"
                      >
                        <div className="text-foreground/40 group-hover:text-primary transition-colors duration-fast">
                          {item.icon}
                        </div>
                        <span className="text-sm font-mono text-foreground/60 group-hover:text-foreground transition-colors duration-fast">
                          {item.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              </SignedIn>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-6 w-full flex flex-col gap-6 pb-10">
              {messages.map((msg, idx) => (
                <MessageBubble key={idx} message={msg} modelId={msg.modelId} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Chat Input — Only show if Signed In */}
        <SignedIn>
          <ChatInput
            input={input}
            isLoading={isLoading}
            selectedModelId={selectedModelId}
            onInputChange={setInput}
            onSubmit={handleSubmit}
            onModelChange={setSelectedModelId}
          />
        </SignedIn>

        {/* Feature Grid — Only show if Signed Out */}
        {(!isSignedIn || messages.length === 0) && (
          <SignedOut>
            <motion.div
              className="absolute bottom-10 left-0 right-0 max-w-4xl mx-auto w-full z-20 px-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.6, ease: "easeOut" }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-primary/10">
                <div className="card-lift flex flex-col gap-2 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-primary font-serif text-lg">
                    <Cpu className="w-4 h-4" />
                    <h4>fluid intelligence</h4>
                  </div>
                  <p className="font-mono text-xs text-foreground/50 leading-relaxed">
                    swap between industry-leading models mid-thought. your context never drops.
                  </p>
                </div>

                <div className="card-lift flex flex-col gap-2 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-primary font-serif text-lg">
                    <Database className="w-4 h-4" />
                    <h4>persistent identity</h4>
                  </div>
                  <p className="font-mono text-xs text-foreground/50 leading-relaxed">
                    inject your .md framework once. omnipotent permanently aligns with your workflow.
                  </p>
                </div>

                <div className="card-lift flex flex-col gap-2 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-primary font-serif text-lg">
                    <Search className="w-4 h-4" />
                    <h4>neural retrieval</h4>
                  </div>
                  <p className="font-mono text-xs text-foreground/50 leading-relaxed">
                    command absolute recall. surface insights and code from any past conversation instantly.
                  </p>
                </div>
              </div>
            </motion.div>
          </SignedOut>
        )}
      </section>
    </main >
  );
}

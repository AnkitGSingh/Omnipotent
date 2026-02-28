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
import { FloatingEmbers } from '@/components/chat/FloatingEmbers';
import { ThemeToggle } from '@/components/ThemeToggle';

const API_BASE = 'http://127.0.0.1:8000';

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
const HERO_MODELS = [
  { color: '#10B981', shape: 'rounded-full', label: 'GPT-4o' },
  { color: '#F97316', shape: 'rounded-md', label: 'Claude' },
  { color: '#3B82F6', shape: 'rotate-45', label: 'Gemini' },
  { color: '#8B5CF6', shape: 'rounded-none', label: 'Llama' },
];

export default function Home() {
  const { isSignedIn, isLoaded } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>(AVAILABLE_MODELS[0].id);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversation history on mount
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const loadHistory = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/conversations/`);
        const data = await res.json();
        const convos: Conversation[] = data.conversations || [];
        setConversations(convos);
        // We no longer auto-load the most recent conversation by default.
        // Users will always land on a fresh "New Chat" hero screen.
      } catch (err) {
        console.error("Failed to load history:", err);
      }
    };
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn]);

  const loadConversation = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/conversations/${id}/messages`);
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

  const handleSubmit = async (e?: React.FormEvent, overrideInput?: string) => {
    if (e) e.preventDefault();
    const promptText = overrideInput || input;
    if (!promptText.trim() || isLoading) return;

    const userMessage = promptText.trim();
    if (!overrideInput) setInput('');

    const newMessages: Message[] = [
      ...messages,
      { role: 'user', content: userMessage },
      { role: 'assistant', content: '', modelId: selectedModelId },
    ];
    setMessages(newMessages);
    setIsLoading(true);
    let accumulatedText = '';

    let url = `${API_BASE}/api/chat/stream?message=${encodeURIComponent(userMessage)}&model_id=${encodeURIComponent(selectedModelId)}`;
    if (conversationId) url += `&conversation_id=${conversationId}`;

    try {
      const response = await fetch(url, { method: "POST" });
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '');
            if (dataStr === '[DONE]') break;

            try {
              const data = JSON.parse(dataStr);
              if (data.error) { console.error("Backend error:", data.error); continue; }
              if (data.conversation_id && !conversationId) {
                setConversationId(data.conversation_id);
                fetch(`${API_BASE}/api/conversations/`)
                  .then(r => r.json())
                  .then(d => setConversations(d.conversations || []))
                  .catch(() => { });
              }
              if (data.text) {
                accumulatedText += data.text;
                const updated = [...newMessages];
                updated[updated.length - 1] = { role: 'assistant', content: accumulatedText, modelId: selectedModelId };
                setMessages(updated);
              }
            } catch (err) {
              console.error("Error parsing SSE chunk", err);
            }
          }
        }
      }
    } catch (error) {
      console.error("Fetch error:", error);
      const updated = [...newMessages];
      updated[updated.length - 1] = { role: 'assistant', content: "Sorry, there was an error communicating with the AI.", modelId: selectedModelId };
      setMessages(updated);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/conversations/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setConversations(prev => prev.filter(c => c.id !== id));
        if (conversationId === id) {
          handleNewChat();
        }
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
        {/* Global Nav (Theme Toggle) for SignedOut Guests */}
        <SignedOut>
          <div className="absolute top-6 right-8 z-50">
            <ThemeToggle className="bg-background/80 backdrop-blur-md border border-amber/10 shadow-lg" />
          </div>
        </SignedOut>

        {/* Ambient embers — always visible */}
        <FloatingEmbers count={messages.length === 0 ? 22 : 10} />

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
                  {HERO_MODELS.map((m, i) => (
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

                {/* Main heading — scales up with amber glow */}
                <motion.h2
                  className="font-serif text-6xl md:text-8xl font-bold mb-4 tracking-tight text-center"
                  style={{
                    background: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 50%, #F59E0B 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
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
                    <Link href="/sign-in" className="px-8 py-3 rounded-full bg-amber/10 border border-amber/30 text-amber font-mono text-sm hover:bg-amber hover:text-[#0A0A0F] hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all flex items-center gap-2 group">
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
                      const selectedModelInfo = AVAILABLE_MODELS.find(x => x.id === selectedModelId);
                      const activeHeroModel = HERO_MODELS.find(m => selectedModelInfo?.label?.toLowerCase().includes(m.label.toLowerCase())) || HERO_MODELS[0];

                      return (
                        <motion.div
                          className="w-16 h-16 flex items-center justify-center rounded-2xl shadow-2xl relative overflow-hidden"
                          style={{ backgroundColor: `${activeHeroModel.color}15`, border: `1px solid ${activeHeroModel.color}30` }}
                          layoutId="active-model-icon"
                        >
                          <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle, ${activeHeroModel.color} 0%, transparent 70%)` }} />
                          <div className={cn('w-6 h-6 z-10', activeHeroModel.shape)} style={{ backgroundColor: activeHeroModel.color }} />
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
                        className="flex items-center gap-3 p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-left transition-all group hover:border-amber/20"
                      >
                        <div className="text-foreground/40 group-hover:text-amber transition-colors">
                          {item.icon}
                        </div>
                        <span className="text-sm font-mono text-foreground/60 group-hover:text-foreground transition-colors">
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-amber/10">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-amber font-serif text-lg">
                    <Cpu className="w-4 h-4" />
                    <h4>fluid intelligence</h4>
                  </div>
                  <p className="font-mono text-xs text-foreground/50 leading-relaxed">
                    swap between industry-leading models mid-thought. your context never drops.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-amber font-serif text-lg">
                    <Database className="w-4 h-4" />
                    <h4>persistent identity</h4>
                  </div>
                  <p className="font-mono text-xs text-foreground/50 leading-relaxed">
                    inject your .md framework once. omnipotent permanently aligns with your workflow.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-amber font-serif text-lg">
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

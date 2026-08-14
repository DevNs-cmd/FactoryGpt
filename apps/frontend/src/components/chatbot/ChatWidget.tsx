/** FactoryGPT — Chat Widget with bubbles, language toggle, suggested prompts. */
"use client";
import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import { Send, Bot, User, Loader2, Globe, Sparkles } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
}

const SUGGESTED_PROMPTS = [
  "What's the current production status?",
  "Which machine has the most downtime?",
  "Show me today's defect summary",
  "Generate a quality report",
  "Why did Line-3 stop?",
];

export default function ChatWidget() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text?: string) {
    const msg = text || input.trim();
    if (!msg) return;

    const userMessage: Message = { role: "user", text: msg, timestamp: new Date() };
    setMessages((m) => [...m, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.sendChatMessage(msg, language);
      setMessages((m) => [
        ...m,
        { role: "assistant", text: res.reply ?? "No response", timestamp: new Date() },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: "⚠️ Chatbot service unavailable — make sure chatbot-assistant is running on port 8002.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card-base flex flex-col" style={{ height: "calc(100vh - 200px)", minHeight: "500px" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-line)]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
            <Bot size={16} color="#FFFFFF" />
          </div>
          <div>
            <span className="text-sm font-semibold">FactoryGPT Assistant</span>
            <span className="status-dot status-dot-online ml-2" />
          </div>
        </div>
        <button
          onClick={() => setLanguage(language === "en" ? "hi" : "en")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-surface)] text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-all"
          title="Toggle language"
        >
          <Globe size={12} />
          {language === "en" ? "EN" : "HI"}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-14 h-14 rounded-xl bg-[var(--color-primary-light)] flex items-center justify-center mb-4">
              <Sparkles size={24} className="text-[var(--color-primary)]" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-[var(--color-text-primary)]">
              Ask me anything about the factory
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6 max-w-md">
              I can check production status, analyze downtime, find defect patterns, and generate reports.
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => send(prompt)}
                  className="px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-line)] text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary-border)] hover:bg-[var(--color-primary-light)] transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}
          >
            {m.role === "assistant" && (
              <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center flex-shrink-0 mt-1">
                <Bot size={14} color="#FFFFFF" />
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-[var(--color-primary)] text-white rounded-br-md"
                  : "bg-[var(--color-surface)] text-[var(--color-text-primary)] rounded-bl-md"
              }`}
            >
              <p className="whitespace-pre-wrap">{m.text}</p>
              <p
                className={`text-[10px] mt-1.5 ${
                  m.role === "user" ? "text-blue-200" : "text-[var(--color-text-muted)]"
                }`}
              >
                {m.timestamp.toLocaleTimeString()}
              </p>
            </div>
            {m.role === "user" && (
              <div className="w-8 h-8 rounded-lg bg-[var(--color-surface)] flex items-center justify-center flex-shrink-0 mt-1">
                <User size={14} className="text-[var(--color-text-secondary)]" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
              <Bot size={14} color="#FFFFFF" />
            </div>
            <div className="bg-[var(--color-surface)] rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                <Loader2 size={14} className="animate-spin" />
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-5 py-4 border-t border-[var(--color-line)]">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder={language === "en" ? "Ask about production, defects, downtime..." : "उत्पादन, दोष, डाउनटाइम के बारे में पूछें..."}
            disabled={loading}
            className="flex-1 bg-white border border-[var(--color-line)] rounded-lg px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary-border)] transition-all disabled:opacity-50 placeholder:text-[var(--color-text-muted)]"
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            className="px-4 rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity disabled:opacity-30 flex items-center justify-center"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

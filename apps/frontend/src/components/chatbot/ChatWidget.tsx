/** FactoryGPT — Enterprise Bilingual AI Voice & Text Assistant Studio with Rich Telemetry Formatting */
"use client";
import { useState, useRef, useEffect } from "react";
import { api, type ChatAssistantResponse } from "@/lib/api";
import {
  Send,
  Bot,
  User,
  Loader2,
  Globe,
  Sparkles,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Clock,
  Layers,
  CheckCircle2,
  RefreshCw,
  Trash2,
  ShieldCheck,
  Zap,
  AlertTriangle,
  Activity,
  Wrench,
  TrendingDown,
  TrendingUp,
  BarChart3,
  Flame,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
  source?: string;
  confidence?: number;
  suggestions?: string[];
  model_used?: string;
  execution_time_ms?: number;
}

const SUGGESTED_PROMPTS_EN = [
  "Which machine produced the least?",
  "What caused recent downtime?",
  "Which machines are currently down or degrading?",
  "What is today's production count and OEE?",
  "Show open defect tickets and QA crack alerts",
];

const SUGGESTED_PROMPTS_HI = [
  "सबसे कम उत्पादन किस लाइन में हुआ?",
  "हाल ही में डाउनटाइम का क्या कारण था?",
  "वर्तमान में कौन सी मशीनें बंद या खराब हैं?",
  "आज का कुल उत्पादन और OEE क्या है?",
  "गुणवत्ता दोष और वेल्ड क्रैक टिकट दिखाएं",
];

/** Rich Visual Renderer for Assistant Messages */
function FormattedAssistantMessage({ text }: { text: string }) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  if (lines.length === 0) return <p>{text}</p>;

  // Check if first line is a title header (e.g. ⚠️ **Lowest Output Line**: ...)
  const firstLine = lines[0];
  const isHeader = firstLine.startsWith("⚠️") || firstLine.startsWith("🏆") || firstLine.startsWith("⏱️") || firstLine.startsWith("🏭") || firstLine.startsWith("📊") || firstLine.startsWith("🔬") || firstLine.startsWith("🤖") || firstLine.startsWith("📦") || firstLine.startsWith("✅");

  const headerLine = isHeader ? firstLine : null;
  const contentLines = isHeader ? lines.slice(1) : lines;

  // Extract clean title text
  const cleanHeader = headerLine
    ? headerLine.replace(/[*_#`]/g, "").trim()
    : null;

  return (
    <div className="space-y-2.5 text-xs text-[var(--color-text-primary)]">
      {/* ── Title Banner ────────────────────────────────────────────── */}
      {cleanHeader && (
        <div className="pb-2 border-b border-slate-100 flex items-center justify-between gap-2">
          <div className="font-bold text-[13px] text-slate-900 flex items-center gap-1.5">
            <span>{cleanHeader}</span>
          </div>
        </div>
      )}

      {/* ── Content Rows & Metric Cards ─────────────────────────────── */}
      <div className="space-y-1.5">
        {contentLines.map((line, idx) => {
          const raw = line.replace(/^•\s*/, "").trim();

          // 1. Action / Recommendation Callout Box
          if (
            raw.toLowerCase().startsWith("recommendation:") ||
            raw.toLowerCase().startsWith("action:") ||
            raw.toLowerCase().startsWith("action required:") ||
            raw.startsWith("सिफारिश:") ||
            raw.startsWith("अनुशंसित कार्रवाई:")
          ) {
            const parts = raw.split(/:\s*/);
            const title = parts[0];
            const body = parts.slice(1).join(": ").replace(/[*_#`]/g, "");

            return (
              <div
                key={idx}
                className="mt-2.5 p-2.5 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-950 flex items-start gap-2 shadow-xs"
              >
                <div className="w-5 h-5 rounded-md bg-amber-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Wrench size={12} />
                </div>
                <div className="flex-1">
                  <span className="font-bold text-[11px] uppercase tracking-wider text-amber-900 block">
                    {title}
                  </span>
                  <p className="text-xs font-medium text-amber-950 leading-relaxed mt-0.5">
                    {body}
                  </p>
                </div>
              </div>
            );
          }

          // 2. Machine Telemetry Bullet Row (e.g. • Floor-1-PressShop-Line1-M2: Health Score 100%...)
          if (raw.includes("Health Score") || raw.includes("Vibration:") || raw.includes("Failure forecast:")) {
            const clean = raw.replace(/[*_#`]/g, "");
            const parts = clean.split(/:\s*/);
            const machineName = parts[0];
            const details = parts.slice(1).join(": ");

            return (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2 shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span className="font-bold font-mono text-slate-900 text-xs">
                    {machineName}
                  </span>
                </div>
                <span className="text-[11px] text-slate-700 font-medium">
                  {details}
                </span>
              </div>
            );
          }

          // 3. Key-Value Metric Item (e.g. • Total Output: 5,430 units)
          if (raw.includes(":")) {
            const [k, ...v] = raw.split(":");
            const keyClean = k.replace(/[*_#`]/g, "").trim();
            const valClean = v.join(":").replace(/[*_#`]/g, "").trim();

            return (
              <div
                key={idx}
                className="flex flex-wrap items-center justify-between py-1 px-2 rounded-lg bg-slate-50/70 border border-slate-100/80 text-xs"
              >
                <span className="text-slate-600 font-medium">{keyClean}:</span>
                <span className="font-bold text-slate-900 font-mono">{valClean}</span>
              </div>
            );
          }

          // 4. Regular Text Paragraph
          return (
            <p key={idx} className="font-medium text-slate-800 leading-relaxed">
              {raw.replace(/[*_#`]/g, "")}
            </p>
          );
        })}
      </div>
    </div>
  );
}

export default function ChatWidget() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [isListening, setIsListening] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = language === "hi" ? "hi-IN" : "en-US";

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join("");
          setInput(transcript);
        };

        recognition.onerror = (event: any) => {
          console.warn("Speech recognition notice:", event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } else {
        setVoiceSupported(false);
      }
    }

    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [language]);

  const toggleVoiceRecording = () => {
    if (!voiceSupported || !recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome or Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = language === "hi" ? "hi-IN" : "en-US";
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Mic error:", e);
      }
    }
  };

  const handleSpeakText = (text: string, index: number) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#`•\[\]]/g, " ").replace(/\s+/g, " ").trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === "hi" ? "hi-IN" : "en-US";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);

    setSpeakingIndex(index);
    window.speechSynthesis.speak(utterance);
  };

  async function send(text?: string) {
    const msg = text || input.trim();
    if (!msg) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const userMessage: Message = { role: "user", text: msg, timestamp: new Date() };
    setMessages((m) => [...m, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res: ChatAssistantResponse = await api.sendChatMessage(msg, language);
      const answerText = res.answer || res.reply || "Factory telemetry processed.";

      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: answerText,
          timestamp: new Date(),
          source: res.source || "MES Database & Claude 3.5",
          confidence: res.confidence || 0.98,
          suggestions: res.suggestions || [],
          model_used: res.model_used || "Claude-3.5-Sonnet",
          execution_time_ms: res.execution_time_ms,
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: language === "hi"
            ? "⚠️ चैटबॉट सेवा वर्तमान में अनुपलब्ध है — कृपया सुनिश्चित करें कि पोर्ट 8002 पर सहायक सेवा चालू है।"
            : "⚠️ Chatbot service unavailable — please ensure services are active with python run_all_services.py.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const suggestedPrompts = language === "hi" ? SUGGESTED_PROMPTS_HI : SUGGESTED_PROMPTS_EN;

  return (
    <div className="card-base flex flex-col shadow-sm border border-[var(--color-line)]" style={{ height: "calc(100vh - 190px)", minHeight: "560px" }}>
      {/* ── Chatbot Studio Header ───────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between px-5 py-3.5 border-b border-[var(--color-line)] bg-slate-50/70">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)] text-white flex items-center justify-center shadow-xs">
            <Bot size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[var(--color-text-primary)]">
                FactoryGPT Bilingual Assistant
              </span>
              <span className="badge badge-online text-[10px] font-mono">
                Claude 3.5 + Live MES
              </span>
            </div>
            <p className="text-[11px] text-[var(--color-text-muted)] font-medium">
              Real-time voice & text shop-floor intelligence
            </p>
          </div>
        </div>

        {/* Language Switcher & Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-[var(--color-line)] rounded-lg p-0.5 shadow-xs">
            <button
              onClick={() => setLanguage("en")}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                language === "en"
                  ? "bg-[var(--color-primary)] text-white shadow-xs"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              English 🇬🇧
            </button>
            <button
              onClick={() => setLanguage("hi")}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                language === "hi"
                  ? "bg-[var(--color-primary)] text-white shadow-xs"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              हिंदी (Hindi) 🇮🇳
            </button>
          </div>

          <button
            onClick={() => setMessages([])}
            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-red-50 transition-colors"
            title="Clear Chat History"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* ── Messages Stream ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-slate-50/30">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mb-4 shadow-sm">
              <Sparkles size={26} />
            </div>
            <h3 className="text-base font-bold mb-1.5 text-[var(--color-text-primary)]">
              {language === "hi" ? "फैक्टरी एआई असिस्टेंट से कुछ भी पूछें" : "Ask Anything About Factory Operations"}
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] mb-5 leading-relaxed font-medium">
              {language === "hi"
                ? "मैं उत्पादन प्रगति, OEE दक्षता, विज़न दोष, डाउनटाइम रूट कॉज़ और मशीन स्वास्थ्य की सटीक जानकारी देता हूँ। आप माइक दबाकर हिंदी या अंग्रेजी में बोल भी सकते हैं।"
                : "Real-time query engine for OEE analytics, machine health alerts, YOLOv8 vision defects, and inventory. Use your microphone to speak in English or Hindi."}
            </p>

            <div className="flex flex-wrap gap-2 justify-center">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => send(prompt)}
                  className="px-3.5 py-2 rounded-xl bg-white border border-[var(--color-line)] text-xs text-[var(--color-text-primary)] font-semibold hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:bg-blue-50/40 transition-all shadow-xs text-left"
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
            className={`flex gap-3 animate-fade-in ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.role === "assistant" && (
              <div className="w-8 h-8 rounded-xl bg-[var(--color-primary)] text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                <Bot size={15} />
              </div>
            )}

            <div className="max-w-[85%] space-y-2">
              <div
                className={`rounded-2xl px-4.5 py-3.5 shadow-sm border ${
                  m.role === "user"
                    ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] rounded-br-sm font-medium text-xs leading-relaxed"
                    : "bg-white border-[var(--color-line)] rounded-bl-sm"
                }`}
              >
                {m.role === "user" ? (
                  <p className="whitespace-pre-wrap font-medium">{m.text}</p>
                ) : (
                  <FormattedAssistantMessage text={m.text} />
                )}

                {/* Assistant Footer Metadata & TTS Button */}
                {m.role === "assistant" && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 mt-2.5 border-t border-slate-100 text-[10px] text-[var(--color-text-muted)]">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-blue-700">
                        {m.source || "MES Database"}
                      </span>
                      {m.confidence && (
                        <span>&bull; {Math.round(m.confidence * 100)}% Confidence</span>
                      )}
                    </div>

                    <button
                      onClick={() => handleSpeakText(m.text, i)}
                      className="flex items-center gap-1 text-[var(--color-primary)] hover:underline font-bold px-1.5 py-0.5 rounded bg-blue-50"
                      title="Read aloud via Text-to-Speech"
                    >
                      {speakingIndex === i ? (
                        <>
                          <VolumeX size={11} className="text-red-600" />
                          <span className="text-red-600">Stop</span>
                        </>
                      ) : (
                        <>
                          <Volume2 size={11} />
                          <span>Listen 🔊</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Follow-up Contextual Suggestions */}
              {m.role === "assistant" && m.suggestions && m.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {m.suggestions.map((sug) => (
                    <button
                      key={sug}
                      onClick={() => send(sug)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-[11px] font-semibold text-blue-700 hover:bg-blue-600 hover:text-white transition-all shadow-xs"
                    >
                      {sug} &rarr;
                    </button>
                  ))}
                </div>
              )}
            </div>

            {m.role === "user" && (
              <div className="w-8 h-8 rounded-xl bg-slate-200 text-[var(--color-text-primary)] flex items-center justify-center flex-shrink-0 mt-0.5">
                <User size={15} />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-xl bg-[var(--color-primary)] text-white flex items-center justify-center flex-shrink-0">
              <Bot size={15} />
            </div>
            <div className="bg-white border border-[var(--color-line)] rounded-2xl rounded-bl-sm px-4 py-3 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)]">
                <Loader2 size={14} className="animate-spin text-[var(--color-primary)]" />
                <span>{language === "hi" ? "फैक्टरी डेटा का विश्लेषण हो रहा है..." : "Querying factory telemetry & Claude 3.5..."}</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Active Mic Visualizer Banner ─────────────────────────────── */}
      {isListening && (
        <div className="px-5 py-2.5 bg-red-50 border-t border-red-200 flex items-center justify-between text-xs text-red-700 font-bold animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
            <span>🎙️ {language === "hi" ? "सुन रहा हूँ... हिंदी में बोलिए" : "Listening... Speak in English or Hindi"}</span>
          </div>
          <button
            onClick={toggleVoiceRecording}
            className="px-2.5 py-1 rounded bg-red-600 text-white text-[10px] font-bold hover:bg-red-700"
          >
            Done Speaking
          </button>
        </div>
      )}

      {/* ── Input Bar ────────────────────────────────────────────────── */}
      <div className="px-5 py-4 border-t border-[var(--color-line)] bg-white">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder={
              language === "hi"
                ? "उत्पादन, डाउनटाइम, विज़न दोष या इन्वेंट्री के बारे में पूछें..."
                : "Ask about plant OEE, downtime causes, machine health, or defect tickets..."
            }
            disabled={loading}
            className="flex-1 bg-slate-50 border border-[var(--color-line)] rounded-xl px-4 py-3 text-xs text-[var(--color-text-primary)] font-medium outline-none focus:border-[var(--color-primary)] focus:bg-white focus:ring-1 focus:ring-[var(--color-primary-border)] transition-all disabled:opacity-50 placeholder:text-[var(--color-text-muted)]"
          />

          {/* Voice Input Microphone Button */}
          <button
            type="button"
            onClick={toggleVoiceRecording}
            className={`p-3 rounded-xl transition-all flex items-center justify-center ${
              isListening
                ? "bg-red-600 text-white animate-bounce shadow-md"
                : "bg-slate-100 text-[var(--color-text-secondary)] hover:bg-blue-50 hover:text-[var(--color-primary)] border border-[var(--color-line)]"
            }`}
            title={isListening ? "Stop Listening" : "Speak via Microphone (Voice Input)"}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>

          {/* Send Button */}
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            className="px-4 py-3 rounded-xl bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity disabled:opacity-30 flex items-center justify-center shadow-xs"
            title="Send Message"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

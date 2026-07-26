/** Owner: Abhi. Talks to backend-core's /integrations/chat proxy only. */
"use client";
import { useState } from "react";
import { api } from "@/lib/api";

export default function ChatWidget() {
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!input.trim()) return;
    const userMessage = input;
    setMessages((m) => [...m, { role: "user", text: userMessage }]);
    setInput("");
    setLoading(true);
    try {
      const res = await api.sendChatMessage(userMessage);
      setMessages((m) => [...m, { role: "assistant", text: res.reply ?? res.error }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "chatbot-assistant unavailable" }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-panel border border-line rounded-lg p-4 flex flex-col h-96">
      <div className="flex-1 overflow-y-auto space-y-2 mb-2 font-mono text-sm">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-cyan" : "text-gray-300"}>
            <span className="text-gray-500">{m.role === "user" ? "you: " : "factorygpt: "}</span>
            {m.text}
          </div>
        ))}
        {loading && <div className="text-gray-500">thinking...</div>}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Why did Line 3 stop?"
          className="flex-1 bg-base border border-line rounded px-3 py-2 text-sm font-mono outline-none focus:border-cyan"
        />
        <button onClick={send} className="bg-cyan text-base px-4 rounded text-sm font-medium">
          Ask
        </button>
      </div>
    </div>
  );
}

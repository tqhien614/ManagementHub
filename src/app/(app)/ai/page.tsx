"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { request } from "@/lib/api";

type Citation = { document_id: string; document_title: string; header_path: string; snippet: string; score: number };
type Message = { role: "user" | "assistant"; content: string; citations?: Citation[]; conversation_id?: string };

export default function AiPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<{ enabled: boolean; message: string } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    request<{ enabled: boolean; message: string }>("/ai/status").then(({ data }) => setAiStatus(data));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const q = input.trim();
    setInput("");
    setLoading(true);
    setMessages((m) => [...m, { role: "user", content: q }]);
    try {
      const { data, error } = await request<{ answer: string; citations: Citation[]; conversation_id: string }>("/ai/ask", {
        method: "POST",
        body: JSON.stringify({ question: q, conversation_id: convId }),
      });
      if (data) {
        setConvId(data.conversation_id);
        setMessages((m) => [...m, { role: "assistant", content: data.answer, citations: data.citations }]);
      } else {
        setMessages((m) => [...m, { role: "assistant", content: `Lỗi: ${error}` }]);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] max-w-3xl mx-auto">
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
        <h1 className="text-lg font-bold">AI Chat</h1>
        {aiStatus && (
          <span className={`text-xs ${aiStatus.enabled ? "text-green-600" : "text-yellow-600"}`}>
            {aiStatus.enabled ? "● AI sẵn sàng" : "● Keyword mode"}
          </span>
        )}
      </div>

      {!aiStatus?.enabled && aiStatus && (
        <div className="text-xs text-yellow-700 dark:text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 px-4 py-2">
          {aiStatus.message}. Thêm <code className="bg-neutral-100 dark:bg-neutral-800 px-1 rounded">OPENAI_API_KEY</code> vào <code>backend/.env</code> để bật AI RAG đầy đủ.
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-sm text-neutral-500 mt-12">
            Hỏi AI về tài liệu trong hệ thống. Ví dụ: "Tóm tắt tài liệu DOCX test"
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-lg px-4 py-2 text-sm ${m.role === "user" ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black" : "bg-neutral-100 dark:bg-neutral-800"}`}>
              <div className="whitespace-pre-wrap">{m.content}</div>
              {m.citations && m.citations.length > 0 && (
                <div className="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-700 space-y-1">
                  <div className="text-xs font-medium opacity-70">Nguồn:</div>
                  {m.citations.map((c, j) => (
                    <Link key={j} href={`/documents/${c.document_id}`} className="text-xs text-blue-600 hover:underline block">
                      [{j + 1}] {c.document_title} — {c.header_path}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg px-4 py-2 text-sm text-neutral-500">AI đang trả lời...</div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Hỏi AI..."
          className="flex-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-4 py-2 text-sm outline-none focus:border-neutral-900"
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()} className="rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black px-4 py-2 text-sm font-medium disabled:opacity-50">
          Gửi
        </button>
      </form>
    </div>
  );
}

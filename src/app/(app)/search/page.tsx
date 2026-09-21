"use client";

import { useState } from "react";
import Link from "next/link";
import { request } from "@/lib/api";

type SearchResult = { id: string; title: string; status: string; genre: string; product_id: string };

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    const { data } = await request<{ results: SearchResult[]; count: number }>(`/search?q=${encodeURIComponent(q)}`);
    setResults(data?.results || []);
    setSearched(true);
    setLoading(false);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">Tìm kiếm</h1>
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm tài liệu theo tiêu đề hoặc nội dung..."
          className="flex-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-4 py-2 text-sm outline-none focus:border-neutral-900"
        />
        <button type="submit" disabled={loading || !q.trim()} className="rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black px-5 py-2 text-sm font-medium disabled:opacity-50">
          {loading ? "..." : "Tìm"}
        </button>
      </form>

      {searched && (
        <div className="space-y-2">
          <p className="text-sm text-neutral-500">{results.length} kết quả</p>
          {results.length === 0 ? (
            <p className="text-sm text-neutral-500">Không tìm thấy tài liệu phù hợp.</p>
          ) : (
            results.map((r) => (
              <Link key={r.id} href={`/documents/${r.id}`} className="block rounded-lg border border-neutral-200 dark:border-neutral-800 p-3 hover:border-neutral-400">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{r.title}</span>
                  <span className="text-xs text-neutral-500">{r.genre}</span>
                </div>
                <div className="text-xs text-neutral-500 mt-1">{r.status}</div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}

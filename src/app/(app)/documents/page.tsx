"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { request, type Doc } from "@/lib/api";
import { Sidebar } from "@/components/Sidebar";

export default function DocumentsListPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request<Doc[]>("/documents").then(({ data }) => { setDocs(data || []); setLoading(false); });
  }, []);

  return (
    <>
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-neutral-50 dark:bg-neutral-950">
        <div className="px-6 py-6 max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Tất cả tài liệu</h1>
          {loading ? (
            <p className="text-sm text-neutral-500">Đang tải...</p>
          ) : docs.length === 0 ? (
            <p className="text-sm text-neutral-500">Chưa có tài liệu.</p>
          ) : (
            <div className="space-y-1">
              {docs.map((d) => (
                <Link key={d.id} href={`/documents/${d.id}`} className="flex items-center justify-between rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-4 py-2.5 hover:border-neutral-400">
                  <span className="text-sm font-medium">{d.title}</span>
                  <span className="text-xs text-neutral-500">{d.genre} · {d.status === "public" ? "Đã xuất bản" : "Bản nháp"} · {new Date(d.created_at).toLocaleDateString("vi-VN")}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

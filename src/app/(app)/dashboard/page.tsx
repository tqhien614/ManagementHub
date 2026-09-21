"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { request } from "@/lib/api";

type Stats = { documents: number; products: number; users: number; ai_queries: number; storage_mb: number; recent_documents: { id: string; title: string; status: string; created_at: string }[] };

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    request<Stats>("/dashboard").then(({ data }) => setStats(data));
  }, []);

  if (!stats) return <p className="text-sm text-neutral-500">Đang tải...</p>;

  const cards = [
    { label: "Tài liệu", value: stats.documents, href: "/products" },
    { label: "Sản phẩm", value: stats.products, href: "/products" },
    { label: "Người dùng", value: stats.users, href: "/admin/users" },
    { label: "Truy vấn AI", value: stats.ai_queries, href: "/admin/logs" },
    { label: "Lưu trữ (MB)", value: stats.storage_mb, href: "#" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 hover:border-neutral-400 dark:hover:border-neutral-600">
            <div className="text-xs text-neutral-500">{c.label}</div>
            <div className="text-2xl font-bold mt-1">{c.value}</div>
          </Link>
        ))}
      </div>

      <div className="space-y-2">
        <h2 className="font-medium">Tài liệu gần đây</h2>
        {stats.recent_documents.length === 0 ? (
          <p className="text-sm text-neutral-500">Chưa có tài liệu.</p>
        ) : (
          <div className="space-y-1">
            {stats.recent_documents.map((d) => (
              <Link key={d.id} href={`/documents/${d.id}`} className="flex items-center justify-between rounded-lg border border-neutral-200 dark:border-neutral-800 px-4 py-2 hover:border-neutral-400">
                <span className="text-sm font-medium">{d.title}</span>
                <span className="text-xs text-neutral-500">{d.status} · {new Date(d.created_at).toLocaleDateString("vi-VN")}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

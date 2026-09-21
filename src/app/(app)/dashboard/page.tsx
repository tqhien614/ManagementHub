"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { request, getMe, type User, type Doc } from "@/lib/api";
import { Sidebar } from "@/components/Sidebar";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [recentDocs, setRecentDocs] = useState<Doc[]>([]);
  const [stats, setStats] = useState<{ documents: number; products: number; users: number; ai_queries: number; storage_mb: number } | null>(null);

  useEffect(() => {
    getMe().then(({ data }) => {
      setUser(data);
      if (data?.is_admin) {
        request<typeof stats>("/dashboard").then(({ data: s }) => setStats(s));
      }
    });
    request<Doc[]>("/documents").then(({ data }) => setRecentDocs((data || []).slice(0, 8)));
  }, []);

  return (
    <>
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-neutral-50 dark:bg-neutral-950">
        <div className="px-6 py-6 max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-1">Xin chào, {user?.display_name}</h1>
          <p className="text-sm text-neutral-500 mb-6">{user?.is_admin ? "Tổng quan hệ thống" : "Tài liệu gần đây của bạn"}</p>

          {user?.is_admin && stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              {[
                { label: "Tài liệu", value: stats.documents, href: "/products" },
                { label: "Sản phẩm", value: stats.products, href: "/products" },
                { label: "Người dùng", value: stats.users, href: "/admin/users" },
                { label: "Truy vấn AI", value: stats.ai_queries, href: "/admin/logs" },
                { label: "Lưu trữ (MB)", value: stats.storage_mb, href: "#" },
              ].map((c) => (
                <Link key={c.label} href={c.href} className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-4 hover:border-neutral-400">
                  <div className="text-xs text-neutral-500">{c.label}</div>
                  <div className="text-2xl font-bold mt-1">{c.value}</div>
                </Link>
              ))}
            </div>
          )}

          <h2 className="font-medium mb-3">Gần đây</h2>
          {recentDocs.length === 0 ? (
            <p className="text-sm text-neutral-500">Chưa có tài liệu. <Link href="/products" className="text-blue-600 hover:underline">Tạo tài liệu đầu tiên</Link></p>
          ) : (
            <div className="space-y-1">
              {recentDocs.map((d) => (
                <Link key={d.id} href={`/documents/${d.id}`} className="flex items-center justify-between rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-4 py-2.5 hover:border-neutral-400">
                  <span className="text-sm font-medium">{d.title}</span>
                  <span className="text-xs text-neutral-500">{d.status === "public" ? "Đã xuất bản" : "Bản nháp"} · {new Date(d.created_at).toLocaleDateString("vi-VN")}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

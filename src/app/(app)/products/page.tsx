"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { request } from "@/lib/api";

type Product = { id: string; name: string; slug: string; description: string | null; status: string; owner_id: string; created_at: string };

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", description: "" });

  const load = useCallback(async () => {
    const { data } = await request<Product[]>("/products");
    setProducts(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const { data, error } = await request<Product>("/products", { method: "POST", body: JSON.stringify({ ...form, status: "idea" }) });
    if (data) {
      setShowCreate(false);
      setForm({ name: "", slug: "", description: "" });
      load();
    } else {
      alert(error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sản phẩm</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="text-sm px-3 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900">
          {showCreate ? "Hủy" : "+ Tạo sản phẩm"}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="space-y-3 rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 max-w-md">
          <input placeholder="Tên sản phẩm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm" />
          <input placeholder="Slug (vd: product-a)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm font-mono" />
          <textarea placeholder="Mô tả" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm" />
          <button type="submit" className="rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black px-4 py-2 text-sm font-medium">Tạo</button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-neutral-500">Đang tải...</p>
      ) : products.length === 0 ? (
        <p className="text-sm text-neutral-500">Chưa có sản phẩm. Tạo sản phẩm đầu tiên.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {products.map((p) => (
            <Link key={p.id} href={`/products/${p.id}`} className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{p.name}</h3>
                <span className="text-xs text-neutral-500">{p.status}</span>
              </div>
              <p className="text-sm text-neutral-500 mt-1 line-clamp-2">{p.description || "—"}</p>
              <p className="text-xs text-neutral-400 mt-2 font-mono">{p.slug}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

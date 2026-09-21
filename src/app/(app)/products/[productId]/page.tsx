"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { request, type Doc, type Folder, type Product } from "@/lib/api";
import { FileUploader } from "@/components/FileUploader";

export default function ProductDetailPage() {
  const params = useParams<{ productId: string }>();
  const productId = params.productId;
  const [product, setProduct] = useState<Product | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [folderName, setFolderName] = useState("");

  const load = useCallback(async () => {
    const [prodRes, folderRes, docRes] = await Promise.all([
      request<Product>(`/products/${productId}`),
      request<Folder[]>(`/folders?product_id=${productId}&parent_folder_id=`),
      request<Doc[]>(`/documents?product_id=${productId}`),
    ]);
    setProduct(prodRes.data);
    setFolders(folderRes.data || []);
    setDocs(docRes.data || []);
    setLoading(false);
  }, [productId]);

  useEffect(() => { load(); }, [load]);

  async function handleCreateFolder(e: React.FormEvent) {
    e.preventDefault();
    const { data, error } = await request<Folder>("/folders", {
      method: "POST",
      body: JSON.stringify({ product_id: productId, name: folderName }),
    });
    if (data) {
      setShowNewFolder(false);
      setFolderName("");
      load();
    } else {
      alert(error);
    }
  }

  if (loading) return <p className="text-sm text-neutral-500">Đang tải...</p>;
  if (!product) return <p className="text-sm text-red-500">Không tìm thấy sản phẩm</p>;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/products" className="text-sm text-neutral-500 hover:underline">← Sản phẩm</Link>
        <h1 className="text-2xl font-bold mt-1">{product.name}</h1>
        <p className="text-sm text-neutral-500">{product.description || "—"}</p>
      </div>

      <FileUploader productId={productId} onUploaded={load} />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Thư mục</h2>
          <button onClick={() => setShowNewFolder(!showNewFolder)} className="text-sm px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700">
            {showNewFolder ? "Hủy" : "+ Thư mục"}
          </button>
        </div>
        {showNewFolder && (
          <form onSubmit={handleCreateFolder} className="flex gap-2 max-w-sm">
            <input value={folderName} onChange={(e) => setFolderName(e.target.value)} placeholder="Tên thư mục" required className="flex-1 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm" />
            <button type="submit" className="rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black px-4 py-2 text-sm">Tạo</button>
          </form>
        )}
        {folders.length === 0 ? (
          <p className="text-sm text-neutral-500">Chưa có thư mục.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {folders.map((f) => (
              <div key={f.id} className="rounded-lg border border-neutral-200 dark:border-neutral-800 px-4 py-2 text-sm">
                📁 {f.name}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="font-medium">Tài liệu ({docs.length})</h2>
        {docs.length === 0 ? (
          <p className="text-sm text-neutral-500">Chưa có tài liệu. Upload ở trên.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {docs.map((d) => (
              <Link key={d.id} href={`/documents/${d.id}`} className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3 hover:border-neutral-400 dark:hover:border-neutral-600">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{d.title}</span>
                  <span className="text-xs text-neutral-500">{d.genre}</span>
                </div>
                <div className="text-xs text-neutral-500 mt-1">
                  {d.status === "public" ? "Public" : "Draft"} · {new Date(d.created_at).toLocaleDateString("vi-VN")}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

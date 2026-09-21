"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { request, type Product, type Folder, type Doc } from "@/lib/api";

export function Sidebar({ productId }: { productId?: string }) {
  const pathname = usePathname();
  const [products, setProducts] = useState<Product[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"explore" | "recent">("explore");
  const [recentDocs, setRecentDocs] = useState<Doc[]>([]);

  const load = useCallback(async () => {
    const [prodRes] = await Promise.all([request<Product[]>("/products")]);
    setProducts(prodRes.data || []);
    if (prodRes.data && prodRes.data.length > 0) {
      const targetId = productId || prodRes.data[0].id;
      const [folderRes, docRes] = await Promise.all([
        request<Folder[]>(`/folders?product_id=${targetId}`),
        request<Doc[]>(`/documents?product_id=${targetId}`),
      ]);
      setFolders(folderRes.data || []);
      setDocs(docRes.data || []);
      setExpanded(new Set([targetId]));
    }
    request<Doc[]>("/documents").then(({ data }) => setRecentDocs((data || []).slice(0, 8)));
  }, [productId]);

  useEffect(() => { load(); }, [load]);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Build folder tree (parent → children)
  const rootFolders = folders.filter((f) => !f.parent_folder_id);
  const childMap = new Map<string, Folder[]>();
  folders.forEach((f) => {
    if (f.parent_folder_id) {
      const arr = childMap.get(f.parent_folder_id) || [];
      arr.push(f);
      childMap.set(f.parent_folder_id, arr);
    }
  });
  const docsByFolder = new Map<string, Doc[]>();
  docs.forEach((d) => {
    const key = d.folder_id || "root";
    const arr = docsByFolder.get(key) || [];
    arr.push(d);
    docsByFolder.set(key, arr);
  });

  const filteredDocs = search
    ? docs.filter((d) => d.title.toLowerCase().includes(search.toLowerCase()))
    : docs;

  function FolderNode({ folder, depth }: { folder: Folder; depth: number }) {
    const isOpen = expanded.has(folder.id);
    const children = childMap.get(folder.id) || [];
    const folderDocs = (docsByFolder.get(folder.id) || []).filter(
      (d) => !search || d.title.toLowerCase().includes(search.toLowerCase())
    );
    return (
      <div>
        <button
          onClick={() => toggle(folder.id)}
          className="flex items-center gap-1 w-full text-left px-2 py-1 text-sm rounded hover:bg-neutral-100 dark:hover:bg-neutral-900"
          style={{ paddingLeft: `${8 + depth * 16}px` }}
        >
          <span className="text-xs text-neutral-400">{isOpen ? "▼" : "▶"}</span>
          <span className="text-neutral-500">📁</span>
          <span className="truncate">{folder.name}</span>
        </button>
        {isOpen && (
          <div>
            {children.map((c) => <FolderNode key={c.id} folder={c} depth={depth + 1} />)}
            {folderDocs.map((d) => (
              <Link
                key={d.id}
                href={`/documents/${d.id}`}
                className={`flex items-center gap-1 w-full text-left px-2 py-1 text-sm rounded ${
                  pathname === `/documents/${d.id}` ? "bg-neutral-100 dark:bg-neutral-800 font-medium" : "hover:bg-neutral-50 dark:hover:bg-neutral-900"
                }`}
                style={{ paddingLeft: `${24 + depth * 16}px` }}
              >
                <span className="text-neutral-400">📄</span>
                <span className="truncate">{d.title}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <aside className="w-60 border-r border-neutral-200 dark:border-neutral-800 flex flex-col bg-white dark:bg-neutral-950 overflow-hidden">
      <div className="p-3 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex gap-1 text-xs">
          <button onClick={() => setTab("explore")} className={`flex-1 px-2 py-1 rounded ${tab === "explore" ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black font-medium" : "hover:bg-neutral-100 dark:hover:bg-neutral-800"}`}>Khám phá</button>
          <button onClick={() => setTab("recent")} className={`flex-1 px-2 py-1 rounded ${tab === "recent" ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black font-medium" : "hover:bg-neutral-100 dark:hover:bg-neutral-800"}`}>Gần đây</button>
        </div>
      </div>

      {tab === "explore" ? (
        <>
          <div className="p-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm trong không gian..."
              className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-2 py-1 text-xs outline-none"
            />
          </div>
          <div className="flex-1 overflow-y-auto px-1 pb-2">
            {products.map((p) => {
              const pDocs = (docsByFolder.get("root") || []).filter(
                (d) => d.product_id === p.id && (!search || d.title.toLowerCase().includes(search.toLowerCase()))
              );
              return (
                <div key={p.id} className="mb-1">
                  <button
                    onClick={() => toggle(p.id)}
                    className="flex items-center gap-1 w-full text-left px-2 py-1.5 text-sm rounded hover:bg-neutral-100 dark:hover:bg-neutral-900 font-medium"
                  >
                    <span className="text-xs text-neutral-400">{expanded.has(p.id) ? "▼" : "▶"}</span>
                    <span>🏢</span>
                    <span className="truncate">{p.name}</span>
                  </button>
                  {expanded.has(p.id) && (
                    <div>
                      {rootFolders.map((f) => <FolderNode key={f.id} folder={f} depth={1} />)}
                      {pDocs.map((d) => (
                        <Link
                          key={d.id}
                          href={`/documents/${d.id}`}
                          className={`flex items-center gap-1 w-full text-left px-2 py-1 text-sm rounded ${
                            pathname === `/documents/${d.id}` ? "bg-neutral-100 dark:bg-neutral-800 font-medium" : "hover:bg-neutral-50 dark:hover:bg-neutral-900"
                          }`}
                          style={{ paddingLeft: "24px" }}
                        >
                          <span className="text-neutral-400">📄</span>
                          <span className="truncate">{d.title}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {products.length === 0 && <p className="text-xs text-neutral-400 px-3 py-2">Chưa có sản phẩm.</p>}
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto px-1 pb-2">
          {recentDocs.length === 0 ? (
            <p className="text-xs text-neutral-400 px-3 py-2">Chưa có tài liệu.</p>
          ) : (
            recentDocs.map((d) => (
              <Link
                key={d.id}
                href={`/documents/${d.id}`}
                className={`flex items-center gap-1 w-full text-left px-2 py-1.5 text-sm rounded ${
                  pathname === `/documents/${d.id}` ? "bg-neutral-100 dark:bg-neutral-800 font-medium" : "hover:bg-neutral-50 dark:hover:bg-neutral-900"
                }`}
              >
                <span className="text-neutral-400">📄</span>
                <span className="truncate">{d.title}</span>
              </Link>
            ))
          )}
        </div>
      )}

      <div className="p-2 border-t border-neutral-200 dark:border-neutral-800 space-y-1">
        <Link href="/products" className="flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-neutral-100 dark:hover:bg-neutral-900">
          <span className="text-green-600">+</span> Tạo tài liệu
        </Link>
      </div>
    </aside>
  );
}

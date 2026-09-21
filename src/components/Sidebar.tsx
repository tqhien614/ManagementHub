"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { request, type Product, type Folder, type Doc } from "@/lib/api";

type TreeNode =
  | { kind: "product"; id: string; name: string; depth: number }
  | { kind: "folder"; id: string; name: string; depth: number; parentId: string }
  | { kind: "doc"; id: string; title: string; depth: number; href: string };

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
    const prods = prodRes.data || [];
    setProducts(prods);
    if (prods.length > 0) {
      const targetId = productId || prods[0].id;
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

  // Build flat tree from products → folders → docs (only expanded nodes)
  const nodes: TreeNode[] = [];
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

  function addFolder(folder: Folder, depth: number) {
    const isOpen = expanded.has(folder.id);
    nodes.push({ kind: "folder", id: folder.id, name: folder.name, depth, parentId: folder.parent_folder_id || "" });
    if (isOpen) {
      const children = childMap.get(folder.id) || [];
      children.forEach((c) => addFolder(c, depth + 1));
      const fd = (docsByFolder.get(folder.id) || []).filter((d) => !search || d.title.toLowerCase().includes(search.toLowerCase()));
      fd.forEach((d) => nodes.push({ kind: "doc", id: d.id, title: d.title, depth: depth + 1, href: `/documents/${d.id}` }));
    }
  }

  products.forEach((p) => {
    nodes.push({ kind: "product", id: p.id, name: p.name, depth: 0 });
    if (expanded.has(p.id)) {
      const rootFolders = folders.filter((f) => !f.parent_folder_id && f.product_id === p.id);
      rootFolders.forEach((f) => addFolder(f, 1));
      const rootDocs = (docsByFolder.get("root") || []).filter((d) => d.product_id === p.id && (!search || d.title.toLowerCase().includes(search.toLowerCase())));
      rootDocs.forEach((d) => nodes.push({ kind: "doc", id: d.id, title: d.title, depth: 1, href: `/documents/${d.id}` }));
    }
  });

  return (
    <aside className="w-60 border-r border-neutral-200 dark:border-neutral-800 flex flex-col bg-white dark:bg-neutral-950 overflow-hidden shrink-0">
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
            {nodes.map((n) => {
              if (n.kind === "product") {
                const isOpen = expanded.has(n.id);
                return (
                  <button key={`p-${n.id}`} onClick={() => toggle(n.id)} className="flex items-center gap-1 w-full text-left px-2 py-1.5 text-sm rounded hover:bg-neutral-100 dark:hover:bg-neutral-900 font-medium">
                    <span className="text-xs text-neutral-400">{isOpen ? "▼" : "▶"}</span>
                    <span>🏢</span>
                    <span className="truncate">{n.name}</span>
                  </button>
                );
              }
              if (n.kind === "folder") {
                const isOpen = expanded.has(n.id);
                return (
                  <button key={`f-${n.id}`} onClick={() => toggle(n.id)} className="flex items-center gap-1 w-full text-left px-2 py-1 text-sm rounded hover:bg-neutral-100 dark:hover:bg-neutral-900" style={{ paddingLeft: `${8 + n.depth * 16}px` }}>
                    <span className="text-xs text-neutral-400">{isOpen ? "▼" : "▶"}</span>
                    <span className="text-neutral-500">📁</span>
                    <span className="truncate">{n.name}</span>
                  </button>
                );
              }
              return (
                <Link key={`d-${n.id}`} href={n.href} className={`flex items-center gap-1 w-full text-left px-2 py-1 text-sm rounded ${pathname === n.href ? "bg-neutral-100 dark:bg-neutral-800 font-medium" : "hover:bg-neutral-50 dark:hover:bg-neutral-900"}`} style={{ paddingLeft: `${24 + n.depth * 16}px` }}>
                  <span className="text-neutral-400">📄</span>
                  <span className="truncate">{n.title}</span>
                </Link>
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
              <Link key={d.id} href={`/documents/${d.id}`} className={`flex items-center gap-1 w-full text-left px-2 py-1.5 text-sm rounded ${pathname === `/documents/${d.id}` ? "bg-neutral-100 dark:bg-neutral-800 font-medium" : "hover:bg-neutral-50 dark:hover:bg-neutral-900"}`}>
                <span className="text-neutral-400">📄</span>
                <span className="truncate">{d.title}</span>
              </Link>
            ))
          )}
        </div>
      )}

      <div className="p-2 border-t border-neutral-200 dark:border-neutral-800">
        <Link href="/products" className="flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-neutral-100 dark:hover:bg-neutral-900">
          <span className="text-green-600">+</span> Tạo tài liệu
        </Link>
      </div>
    </aside>
  );
}

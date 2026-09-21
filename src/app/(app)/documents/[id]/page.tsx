"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getDocument, getMarkdown, updateMarkdown, listVersions, deleteDocument, request, type Doc, type Markdown, type Version } from "@/lib/api";
import { MarkdownViewer } from "@/components/MarkdownViewer";
import { PermissionManager } from "@/components/PermissionManager";

export default function DocumentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const docId = params.id;
  const [doc, setDoc] = useState<Doc | null>(null);
  const [md, setMd] = useState<Markdown | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [editText, setEditText] = useState("");
  const [saving, setSaving] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [d, m, v] = await Promise.all([
      getDocument(docId),
      getMarkdown(docId),
      listVersions(docId),
    ]);
    setDoc(d.data);
    setMd(m.data);
    setVersions(v.data || []);
    if (m.data) setEditText(m.data.content_text);
    setLoading(false);
  }, [docId]);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    setSaving(true);
    const { data, error } = await updateMarkdown(docId, editText);
    setSaving(false);
    if (data) {
      setMd(data);
      setMsg("Đã lưu. Tạo version mới.");
      setMode("view");
      load();
    } else {
      setMsg(error || "Lỗi lưu");
    }
  }

  async function handleDelete() {
    if (!confirm("Xóa tài liệu này? Không thể hoàn tác.")) return;
    const { error } = await deleteDocument(docId);
    if (error) { alert(error); return; }
    router.push("/products");
  }

  if (loading) return <p className="text-sm text-neutral-500">Đang tải...</p>;
  if (!doc) return <p className="text-sm text-red-500">Không tìm thấy tài liệu</p>;

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <Link href={`/products/${doc.product_id}`} className="text-sm text-neutral-500 hover:underline">← Sản phẩm</Link>
        <div className="flex items-center justify-between mt-1">
          <h1 className="text-2xl font-bold">{doc.title}</h1>
          <div className="flex gap-2 text-sm">
            <button onClick={() => setMode(mode === "view" ? "edit" : "view")} className="px-3 py-1 rounded-md border border-neutral-300 dark:border-neutral-700">
              {mode === "view" ? "Sửa" : "Xem"}
            </button>
            <a href={`/api/v1/documents/${doc.id}/download/raw`} className="px-3 py-1 rounded-md border border-neutral-300 dark:border-neutral-700" download>File gốc</a>
            <a href={`/api/v1/documents/${doc.id}/download/markdown`} className="px-3 py-1 rounded-md border border-neutral-300 dark:border-neutral-700" download>Markdown</a>
            <button onClick={() => setShowVersions(!showVersions)} className="px-3 py-1 rounded-md border border-neutral-300 dark:border-neutral-700">
              Lịch sử ({versions.length})
            </button>
            <button onClick={handleDelete} className="px-3 py-1 rounded-md text-red-600 border border-red-300 dark:border-red-800">Xóa</button>
          </div>
        </div>
        <div className="text-xs text-neutral-500 mt-1">
          {doc.status} · {doc.genre} · {new Date(doc.created_at).toLocaleString("vi-VN")}
        </div>
      </div>

      {msg && <p className="text-sm text-green-600">{msg}</p>}

      {showVersions && (
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3 space-y-1 max-h-64 overflow-y-auto">
          <h3 className="text-sm font-medium mb-2">Lịch sử phiên bản</h3>
          {versions.length === 0 ? (
            <p className="text-xs text-neutral-500">Chưa có phiên bản</p>
          ) : (
            versions.map((v) => (
              <div key={v.id} className="flex items-center justify-between text-xs py-1 border-b border-neutral-100 dark:border-neutral-900 last:border-0">
                <span>v{v.version_no}</span>
                <span className="text-neutral-500">{new Date(v.created_at).toLocaleString("vi-VN")}</span>
                <button onClick={() => { setEditText(v.content_text); setMode("edit"); setShowVersions(false); }} className="text-blue-600 hover:underline">Khôi phục</button>
              </div>
            ))
          )}
        </div>
      )}

      {mode === "view" && (
        <details className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3">
          <summary className="text-sm font-medium cursor-pointer">Phân quyền tài liệu</summary>
          <div className="mt-3">
            <PermissionManager type="document" targetId={doc.id} />
          </div>
        </details>
      )}

      {mode === "view" ? (
        md ? (
          <MarkdownViewer content={md.content_text} />
        ) : (
          <p className="text-sm text-neutral-500">Chưa có nội dung markdown</p>
        )
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2 text-sm flex-wrap">
            <button onClick={async () => { const { data } = await request<{ text: string }>("/ai/copilot", { method: "POST", body: JSON.stringify({ prompt: "", context: editText, mode: "continue" }) }); if (data?.text) setEditText(editText + "\n\n" + data.text); }} className="px-3 py-1 rounded-md border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900">✨ Viết tiếp (AI)</button>
            <button onClick={async () => { const { data } = await request<{ text: string }>("/ai/copilot", { method: "POST", body: JSON.stringify({ prompt: "", context: editText, mode: "summarize" }) }); if (data?.text) setEditText(editText + "\n\n## Tóm tắt\n\n" + data.text); }} className="px-3 py-1 rounded-md border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900">📋 Tóm tắt (AI)</button>
            <button onClick={async () => { const { data } = await request<{ text: string }>("/ai/copilot", { method: "POST", body: JSON.stringify({ prompt: "", context: editText, mode: "improve" }) }); if (data?.text) setEditText(data.text); }} className="px-3 py-1 rounded-md border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900">✏️ Viết lại (AI)</button>
          </div>
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={24}
            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm font-mono"
          />
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black px-4 py-2 text-sm font-medium disabled:opacity-50">
              {saving ? "Đang lưu..." : "Lưu (tạo version mới)"}
            </button>
            <button onClick={() => { setMode("view"); setEditText(md?.content_text || ""); }} className="rounded-md border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-sm">
              Hủy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

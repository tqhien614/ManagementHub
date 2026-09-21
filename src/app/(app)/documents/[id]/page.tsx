"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getDocument, getMarkdown, updateMarkdown, listVersions, deleteDocument, request, type Doc, type Markdown, type Version } from "@/lib/api";
import { MarkdownViewer } from "@/components/MarkdownViewer";
import { Sidebar } from "@/components/Sidebar";
import { DocMetaPanel } from "@/components/DocMetaPanel";

export default function DocumentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const docId = params.id;
  const [doc, setDoc] = useState<Doc | null>(null);
  const [md, setMd] = useState<Markdown | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"markdown" | "edit" | "versions">("markdown");
  const [editText, setEditText] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);

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
    // Check permission
    const { data: perm } = await request<{ can_view: boolean; can_edit: boolean; can_admin: boolean }>(`/permissions/documents/${docId}/resolve`);
    if (perm) setCanEdit(perm.can_edit);
  }, [docId]);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    setSaving(true);
    const { data, error } = await updateMarkdown(docId, editText);
    setSaving(false);
    if (data) { setMd(data); setMsg("Đã lưu. Tạo version mới."); setMode("markdown"); load(); }
    else setMsg(error || "Lỗi lưu");
  }

  async function handleDelete() {
    if (!confirm("Xóa tài liệu này? Không thể hoàn tác.")) return;
    const { error } = await deleteDocument(docId);
    if (error) { alert(error); return; }
    router.push("/products");
  }

  if (loading) return <div className="flex-1 flex items-center justify-center text-sm text-neutral-500">Đang tải...</div>;
  if (!doc) return <div className="flex-1 flex items-center justify-center text-sm text-red-500">Không tìm thấy tài liệu</div>;

  return (
    <>
      <Sidebar productId={doc.product_id} />
      <main className="flex-1 overflow-y-auto bg-neutral-50 dark:bg-neutral-950">
        <div className="max-w-3xl mx-auto px-6 py-6">
          {/* Breadcrumb */}
          <div className="text-xs text-neutral-500 mb-2">
            <Link href="/products" className="hover:underline">Không gian</Link>
            <span className="mx-1">/</span>
            <Link href={`/products/${doc.product_id}`} className="hover:underline">Sản phẩm</Link>
          </div>

          {/* Title + meta */}
          <h1 className="text-2xl font-bold mb-2">{doc.title}</h1>
          <div className="flex items-center gap-3 text-sm text-neutral-500 mb-4">
            <span className={`px-2 py-0.5 rounded text-xs ${doc.status === "public" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"}`}>
              {doc.status === "public" ? "Đã xuất bản" : "Bản nháp"}
            </span>
            <span>· Cập nhật {new Date(doc.updated_at).toLocaleDateString("vi-VN")}</span>
            {versions.length > 0 && <span>· v{versions[0].version_no}</span>}
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-neutral-200 dark:border-neutral-800 mb-4">
            <button onClick={() => setMode("markdown")} className={`px-3 py-2 text-sm border-b-2 ${mode === "markdown" ? "border-neutral-900 dark:border-neutral-100 font-medium" : "border-transparent text-neutral-500"}`}>Markdown</button>
            {canEdit && <button onClick={() => setMode("edit")} className={`px-3 py-2 text-sm border-b-2 ${mode === "edit" ? "border-neutral-900 dark:border-neutral-100 font-medium" : "border-transparent text-neutral-500"}`}>Chỉnh sửa</button>}
            <button onClick={() => setMode("versions")} className={`px-3 py-2 text-sm border-b-2 ${mode === "versions" ? "border-neutral-900 dark:border-neutral-100 font-medium" : "border-transparent text-neutral-500"}`}>Lịch sử ({versions.length})</button>
            {canEdit && (
              <button onClick={handleDelete} className="ml-auto text-xs text-red-600 hover:underline">Xóa</button>
            )}
          </div>

          {msg && <p className="text-sm text-green-600 mb-3">{msg}</p>}

          {/* Content */}
          {mode === "markdown" && (md ? <MarkdownViewer content={md.content_text} /> : <p className="text-sm text-neutral-500">Chưa có nội dung markdown</p>)}

          {mode === "edit" && canEdit && (
            <div className="space-y-3">
              <div className="flex gap-2 text-sm flex-wrap">
                <button onClick={async () => { const { data } = await request<{ text: string }>("/ai/copilot", { method: "POST", body: JSON.stringify({ prompt: "", context: editText, mode: "continue" }) }); if (data?.text) setEditText(editText + "\n\n" + data.text); }} className="px-3 py-1 rounded-md border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-900">✨ Viết tiếp</button>
                <button onClick={async () => { const { data } = await request<{ text: string }>("/ai/copilot", { method: "POST", body: JSON.stringify({ prompt: "", context: editText, mode: "summarize" }) }); if (data?.text) setEditText(editText + "\n\n## Tóm tắt\n\n" + data.text); }} className="px-3 py-1 rounded-md border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-900">📋 Tóm tắt</button>
                <button onClick={async () => { const { data } = await request<{ text: string }>("/ai/copilot", { method: "POST", body: JSON.stringify({ prompt: "", context: editText, mode: "improve" }) }); if (data?.text) setEditText(data.text); }} className="px-3 py-1 rounded-md border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-900">✏️ Viết lại</button>
              </div>
              <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={24} className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm font-mono" />
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving} className="rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black px-4 py-2 text-sm font-medium disabled:opacity-50">{saving ? "Đang lưu..." : "Lưu (tạo version)"}</button>
                <button onClick={() => { setMode("markdown"); setEditText(md?.content_text || ""); }} className="rounded-md border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-sm">Hủy</button>
              </div>
            </div>
          )}

          {mode === "versions" && (
            <div className="space-y-2">
              {versions.length === 0 ? (
                <p className="text-sm text-neutral-500">Chưa có phiên bản</p>
              ) : (
                versions.map((v) => (
                  <div key={v.id} className="flex items-center justify-between rounded-lg border border-neutral-200 dark:border-neutral-800 px-4 py-2">
                    <div>
                      <span className="font-medium text-sm">v{v.version_no}</span>
                      <span className="text-xs text-neutral-500 ml-2">{new Date(v.created_at).toLocaleString("vi-VN")}</span>
                    </div>
                    <button onClick={() => { setEditText(v.content_text); setMode("edit"); }} className="text-xs text-blue-600 hover:underline">Khôi phục</button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>
      <DocMetaPanel doc={doc} canEdit={canEdit} />
    </>
  );
}

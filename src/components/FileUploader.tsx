"use client";

import { useState, useRef } from "react";
import { uploadFile } from "@/lib/api";

export function FileUploader({
  productId,
  folderId,
  onUploaded,
}: {
  productId: string;
  folderId?: string | null;
  onUploaded?: (doc: any) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("general");
  const [statusDoc, setStatusDoc] = useState("draft");
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Chọn file");
      return;
    }
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("product_id", productId);
    formData.append("title", title || file.name);
    formData.append("genre", genre);
    formData.append("status_doc", statusDoc);
    if (folderId) formData.append("folder_id", folderId);
    const token = typeof window !== "undefined" ? localStorage.getItem("ai-pdmh-token") : null;
    try {
      const res = await fetch("/api/v1/documents/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.detail || "Upload thất bại");
      setUploading(false);
      setFile(null);
      setTitle("");
      if (inputRef.current) inputRef.current.value = "";
      onUploaded?.(body);
    } catch (err: any) {
      setUploading(false);
      setError(err.message || "Lỗi upload");
    }
  }

  return (
    <form onSubmit={handleUpload} className="space-y-3 rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
      <h3 className="font-medium">Upload tài liệu</h3>
      <div>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.doc,.pptx,.html,.htm,.txt,.md"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="text-sm"
        />
        <p className="text-xs text-neutral-500 mt-1">Hỗ trợ: PDF, DOCX, PPTX, HTML, TXT, MD</p>
      </div>
      <input placeholder="Tiêu đề (để trống = tên file)" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm" />
      <div className="flex gap-2">
        <input placeholder="Genre" value={genre} onChange={(e) => setGenre(e.target.value)} className="flex-1 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm" />
        <select value={statusDoc} onChange={(e) => setStatusDoc(e.target.value)} className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm">
          <option value="draft">Draft</option>
          <option value="public">Public</option>
        </select>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={uploading || !file} className="rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black px-4 py-2 text-sm font-medium disabled:opacity-50">
        {uploading ? "Đang chuyển đổi..." : "Upload"}
      </button>
    </form>
  );
}

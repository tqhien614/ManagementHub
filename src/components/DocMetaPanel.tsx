"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { request, type Doc, type Version } from "@/lib/api";
import { PermissionManager } from "@/components/PermissionManager";

export function DocMetaPanel({ doc, canEdit }: { doc: Doc; canEdit: boolean }) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [showPerms, setShowPerms] = useState(false);

  const load = useCallback(async () => {
    const { data } = await request<Version[]>(`/documents/${doc.id}/versions`);
    setVersions(data || []);
  }, [doc.id]);

  useEffect(() => { load(); }, [load]);

  const created = new Date(doc.created_at).toLocaleString("vi-VN");
  const updated = new Date(doc.updated_at).toLocaleString("vi-VN");

  return (
    <aside className="w-80 border-l border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
        <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Thông tin tài liệu</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-neutral-500">Trạng thái</dt>
            <dd>
              <span className={`px-2 py-0.5 rounded text-xs ${doc.status === "public" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"}`}>
                {doc.status === "public" ? "Đã xuất bản" : "Bản nháp"}
              </span>
            </dd>
          </div>
          <div className="flex justify-between"><dt className="text-neutral-500">Genre</dt><dd className="text-neutral-700 dark:text-neutral-300">{doc.genre}</dd></div>
          <div className="flex justify-between"><dt className="text-neutral-500">Ngày tạo</dt><dd className="text-neutral-700 dark:text-neutral-300 text-xs">{created}</dd></div>
          <div className="flex justify-between"><dt className="text-neutral-500">Cập nhật</dt><dd className="text-neutral-700 dark:text-neutral-300 text-xs">{updated}</dd></div>
        </dl>
      </div>

      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
        <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Files</h3>
        <div className="space-y-1.5 text-sm">
          <a href={`/api/v1/documents/${doc.id}/download/raw`} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-700 dark:text-neutral-300">
            <span>📎</span> File gốc
          </a>
          <a href={`/api/v1/documents/${doc.id}/download/markdown`} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-700 dark:text-neutral-300">
            <span>📝</span> Markdown
          </a>
        </div>
        <div className="mt-2">
          <p className="text-xs text-neutral-500 mb-1">Lịch sử phiên bản ({versions.length})</p>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {versions.slice(0, 5).map((v) => (
              <div key={v.id} className="text-xs text-neutral-500 flex justify-between">
                <span>v{v.version_no}</span>
                <span>{new Date(v.created_at).toLocaleDateString("vi-VN")}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Quyền truy cập</h3>
          {canEdit && (
            <button onClick={() => setShowPerms(!showPerms)} className="text-xs text-blue-600 hover:underline">
              {showPerms ? "Ẩn" : "Quản lý"}
            </button>
          )}
        </div>
        {!showPerms ? (
          <p className="text-xs text-neutral-500">
            {doc.status === "public" ? "Tài liệu công khai — ai cũng xem được." : "Chỉ những người có quyền trong thư mục/tài liệu mới xem được."}
          </p>
        ) : (
          <PermissionManager type="document" targetId={doc.id} />
        )}
      </div>

      <div className="p-4 mt-auto bg-neutral-50 dark:bg-neutral-900/50">
        <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">AI Assistant</h3>
        <p className="text-xs text-neutral-500 mb-2">Hỏi bất cứ điều gì về tài liệu này...</p>
        <Link
          href={`/ai?doc=${doc.id}`}
          className="block w-full text-center rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black px-3 py-1.5 text-sm font-medium hover:opacity-90"
        >
          Bắt đầu trò chuyện
        </Link>
      </div>
    </aside>
  );
}

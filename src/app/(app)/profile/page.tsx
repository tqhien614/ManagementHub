"use client";

import { useEffect, useState } from "react";
import { getMe, updateMe, type User } from "@/lib/api";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    getMe().then(({ data }) => {
      if (data) {
        setUser(data);
        setDisplayName(data.display_name);
        setBio(data.bio || "");
      }
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data, error } = await updateMe({ display_name: displayName, bio });
    setSaving(false);
    if (data) {
      setUser(data);
      setMsg("Đã lưu");
    } else {
      setMsg(error || "Lỗi");
    }
  }

  if (!user) return <div className="text-sm text-neutral-500">Đang tải...</div>;

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Hồ sơ cá nhân</h1>
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 space-y-2 text-sm">
        <div><span className="text-neutral-500">Username:</span> @{user.username}</div>
        <div><span className="text-neutral-500">Email:</span> {user.email}</div>
        <div><span className="text-neutral-500">Vai trò:</span> {user.is_admin ? "Admin" : "User"}</div>
        <div><span className="text-neutral-500">Trạng thái:</span> {user.status}</div>
      </div>
      <form onSubmit={handleSave} className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">Display name</label>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm outline-none focus:border-neutral-900" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Bio</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm outline-none focus:border-neutral-900" />
        </div>
        {msg && <p className="text-sm text-green-600">{msg}</p>}
        <button type="submit" disabled={saving} className="rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black px-4 py-2 text-sm font-medium disabled:opacity-50">
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </form>
    </div>
  );
}

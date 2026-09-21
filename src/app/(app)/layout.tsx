"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe, request, setToken, type User } from "@/lib/api";
import { GlobalHeader } from "@/components/GlobalHeader";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    getMe().then(({ data }) => {
      if (!data) { router.push("/login"); return; }
      setUser(data);
      setLoading(false);
    });
    request<{ count: number }>("/notifications/unread-count").then(({ data }) => {
      if (data) setUnread(data.count);
    });
  }, [router]);

  if (loading) {
    return <main className="min-h-screen flex items-center justify-center text-sm text-neutral-500">Đang tải...</main>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <GlobalHeader user={user} unread={unread} />
      <div className="flex-1 flex overflow-hidden">{children}</div>
    </div>
  );
}

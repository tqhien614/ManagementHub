"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { getMe, setToken, request, type User } from "@/lib/api";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    getMe().then(({ data }) => {
      if (!data) {
        router.push("/login");
        return;
      }
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

  const nav = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/products", label: "Sản phẩm" },
    { href: "/search", label: "Tìm kiếm" },
    { href: "/ai", label: "AI Chat" },
    { href: "/notifications", label: `Thông báo${unread > 0 ? ` (${unread})` : ""}` },
    { href: "/profile", label: "Hồ sơ" },
  ];

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 border-r border-neutral-200 dark:border-neutral-800 flex flex-col">
        <div className="p-4 font-bold border-b border-neutral-200 dark:border-neutral-800">AI-PDMH</div>
        <nav className="flex-1 p-2 space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-md text-sm ${
                pathname?.startsWith(item.href)
                  ? "bg-neutral-100 dark:bg-neutral-800 font-medium"
                  : "hover:bg-neutral-50 dark:hover:bg-neutral-900"
              }`}
            >
              {item.label}
            </Link>
          ))}
          {user?.is_admin && (
            <Link href="/admin" className={`block px-3 py-2 rounded-md text-sm ${pathname?.startsWith("/admin") ? "bg-neutral-100 dark:bg-neutral-800 font-medium" : "hover:bg-neutral-50 dark:hover:bg-neutral-900"}`}>
              Quản trị
            </Link>
          )}
        </nav>
        <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500">
          <div className="font-medium text-neutral-700 dark:text-neutral-300">{user?.display_name}</div>
          <div>@{user?.username}</div>
          <button
            onClick={() => { setToken(null); router.push("/login"); }}
            className="mt-2 text-red-600 hover:underline"
          >
            Đăng xuất
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}

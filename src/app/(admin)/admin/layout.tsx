"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getMe, type User } from "@/lib/api";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    getMe().then(({ data }) => {
      if (!data) { router.push("/login"); return; }
      if (!data.is_admin) { router.push("/dashboard"); return; }
      setUser(data);
    });
  }, [router]);

  if (!user) return <div className="p-6 text-sm text-neutral-500">Đang tải...</div>;

  const nav = [
    { href: "/admin", label: "Tổng quan" },
    { href: "/admin/users", label: "Người dùng" },
    { href: "/admin/system", label: "Cấu hình hệ thống" },
    { href: "/admin/ai-config", label: "Cấu hình AI" },
    { href: "/admin/logs", label: "Nhật ký" },
    { href: "/admin/roles", label: "Vai trò" },
  ];

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 border-r border-neutral-200 dark:border-neutral-800 flex flex-col">
        <div className="p-4 font-bold border-b border-neutral-200 dark:border-neutral-800">Quản trị</div>
        <nav className="flex-1 p-2 space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-md text-sm ${
                pathname === item.href
                  ? "bg-neutral-100 dark:bg-neutral-800 font-medium"
                  : "hover:bg-neutral-50 dark:hover:bg-neutral-900"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link href="/dashboard" className="p-3 border-t border-neutral-200 dark:border-neutral-800 text-sm text-neutral-500 hover:underline">
          ← Về app
        </Link>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}

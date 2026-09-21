"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { setToken, type User } from "@/lib/api";

export function GlobalHeader({ user, unread }: { user: User | null; unread: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const nav = [
    { href: "/dashboard", label: "Trang chủ" },
    { href: "/products", label: "Không gian" },
    { href: "/documents", label: "Tài liệu" },
    { href: "/ai", label: "AI Assistant" },
  ];

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) router.push(`/search?q=${encodeURIComponent(search.trim())}`);
  }

  return (
    <header className="h-14 border-b border-neutral-200 dark:border-neutral-800 flex items-center px-4 gap-6 bg-white dark:bg-neutral-950 sticky top-0 z-20">
      <Link href="/dashboard" className="font-bold text-lg whitespace-nowrap">
        AI-PDMH
      </Link>

      <nav className="flex items-center gap-1 text-sm">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              pathname?.startsWith(item.href)
                ? "bg-neutral-100 dark:bg-neutral-800 font-medium"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900"
            }`}
          >
            {item.label}
          </Link>
        ))}
        {user?.is_admin && (
          <Link
            href="/admin"
            className={`px-3 py-1.5 rounded-md ${
              pathname?.startsWith("/admin")
                ? "bg-neutral-100 dark:bg-neutral-800 font-medium"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900"
            }`}
          >
            Quản trị
          </Link>
        )}
      </nav>

      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm tài liệu, nội dung..."
          className="w-full rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-3 py-1.5 text-sm outline-none focus:border-neutral-400"
        />
      </form>

      <div className="flex items-center gap-3">
        <Link href="/notifications" className="relative p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800" title="Thông báo">
          <span className="text-lg">🔔</span>
          {unread > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <div className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xs font-medium">
              {user?.display_name?.[0] || "U"}
            </div>
            <span className="text-sm hidden md:block">{user?.display_name}</span>
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-lg z-20 py-1">
                <Link href="/profile" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900">
                  Hồ sơ cá nhân
                </Link>
                <Link href="/notifications" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900">
                  Thông báo {unread > 0 && `(${unread})`}
                </Link>
                {user?.is_admin && (
                  <Link href="/admin" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900">
                    Quản trị
                  </Link>
                )}
                <hr className="my-1 border-neutral-200 dark:border-neutral-800" />
                <button
                  onClick={() => { setToken(null); router.push("/login"); }}
                  className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-neutral-50 dark:hover:bg-neutral-900"
                >
                  Đăng xuất
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

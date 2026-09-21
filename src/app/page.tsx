import Link from "next/link";
import { checkApiHealth } from "@/lib/api";

export default async function Home() {
  const health = await checkApiHealth().catch(() => null);
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">AI-PDMH</h1>
        <p className="text-neutral-500">AI Product Document Management Hub</p>
      </div>
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 px-4 py-3 text-sm">
        {health ? (
          <span className="text-green-600 dark:text-green-400">● API: {health.service} — {health.status}</span>
        ) : (
          <span className="text-red-600 dark:text-red-400">● API chưa chạy — chạy <code className="bg-neutral-100 dark:bg-neutral-800 px-1 rounded">npm run dev:api</code></span>
        )}
      </div>
      <div className="flex gap-3">
        <Link href="/login" className="rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black px-5 py-2 text-sm font-medium hover:opacity-90">
          Đăng nhập
        </Link>
        <Link href="/register" className="rounded-lg border border-neutral-300 dark:border-neutral-700 px-5 py-2 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-900">
          Đăng ký
        </Link>
      </div>
    </main>
  );
}

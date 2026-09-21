"use client";

import { useState } from "react";
import Link from "next/link";
import { register, verifyOtp, resendOtp } from "@/lib/api";

type Step = "form" | "otp" | "done";

export default function RegisterPage() {
  const [step, setStep] = useState<Step>("form");
  const [form, setForm] = useState({ username: "", display_name: "", email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await register(form);
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    setInfo("Đã gửi mã OTP tới email của bạn. (Trong dev, mã được in ra console backend.)");
    setStep("otp");
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await verifyOtp({ email: form.email, code: otp, purpose: "signup" });
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    setInfo("Xác nhận thành công. Tài khoản đang chờ admin phê duyệt. Bạn có thể đăng nhập sau khi admin kích hoạt.");
    setStep("done");
  }

  if (step === "done") {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-4 text-center">
          <h1 className="text-xl font-bold">Đăng ký thành công</h1>
          <p className="text-sm text-neutral-500">{info}</p>
          <Link href="/login" className="inline-block text-sm text-blue-600 hover:underline">
            Về trang đăng nhập
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">Đăng ký tài khoản</h1>
          <p className="text-sm text-neutral-500">
            {step === "form" ? "Tạo tài khoản mới" : "Nhập mã OTP đã gửi tới email"}
          </p>
        </div>
        {step === "form" ? (
          <form onSubmit={handleRegister} className="space-y-3">
            <input placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm outline-none focus:border-neutral-900" />
            <input placeholder="Display name" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} required className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm outline-none focus:border-neutral-900" />
            <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm outline-none focus:border-neutral-900" />
            <input type="password" placeholder="Mật khẩu" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm outline-none focus:border-neutral-900" />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="w-full rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {loading ? "Đang xử lý..." : "Đăng ký"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-3">
            {info && <p className="text-sm text-green-600 dark:text-green-400">{info}</p>}
            <input placeholder="Mã OTP (6 số)" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} required className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm outline-none focus:border-neutral-900 text-center tracking-widest" />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="w-full rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {loading ? "Đang xác nhận..." : "Xác nhận OTP"}
            </button>
            <button type="button" onClick={async () => { await resendOtp({ email: form.email, purpose: "signup" }); setInfo("Đã gửi lại OTP"); }} className="w-full text-sm text-neutral-500 hover:underline">
              Gửi lại OTP
            </button>
          </form>
        )}
        <div className="text-center text-sm text-neutral-500">
          Đã có tài khoản? <Link href="/login" className="hover:underline">Đăng nhập</Link>
        </div>
      </div>
    </main>
  );
}

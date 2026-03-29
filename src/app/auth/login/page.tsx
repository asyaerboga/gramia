"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get("role") || "client";

  const [role, setRole] = useState<"dietitian" | "client">(
    defaultRole as "dietitian" | "client"
  );
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      const redirectPath =
        role === "dietitian"
          ? "/dashboard/dietitian/clients"
          : "/dashboard/client";
      router.push(redirectPath);
    } catch {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-white px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="block text-center mb-8">
          <h1 className="text-3xl font-bold text-emerald-600">🌿 Gramia</h1>
        </Link>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Role Switcher */}
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setRole("client")}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
                role === "client"
                  ? "bg-white shadow text-emerald-600"
                  : "text-gray-500"
              }`}
            >
              👤 Danışan
            </button>
            <button
              type="button"
              onClick={() => setRole("dietitian")}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
                role === "dietitian"
                  ? "bg-white shadow text-emerald-600"
                  : "text-gray-500"
              }`}
            >
              🩺 Diyetisyen
            </button>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-6">Giriş Yap</h2>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                placeholder="ornek@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Şifre
              </label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition disabled:opacity-50"
            >
              {loading ? "Yükleniyor..." : "Giriş Yap"}
            </button>
          </form>

          {role === "dietitian" && (
            <p className="text-center text-sm text-gray-500 mt-6">
              Hesabınız yok mu?{" "}
              <Link
                href="/auth/register"
                className="text-emerald-600 font-medium hover:underline"
              >
                Diyetisyen Kaydı
              </Link>
            </p>
          )}

          {role === "client" && (
            <p className="text-center text-xs text-gray-400 mt-6">
              Danışan hesapları diyetisyeniniz tarafından oluşturulur.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

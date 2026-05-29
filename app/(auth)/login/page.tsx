"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Email ou mot de passe incorrect");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/auth/session");
    const session = await res.json();
    const role = session?.user?.role;

    if (callbackUrl) {
      router.push(callbackUrl);
    } else if (role === "ADMIN") {
      router.push("/admin/dashboard");
    } else if (role === "PROF") {
      let permissions: string[] = [];
      try { permissions = JSON.parse(session?.user?.permissions ?? "[]"); } catch { permissions = []; }
      const first = permissions[0];
      router.push(first ? `/admin/${first}` : "/admin/dashboard");
    } else {
      router.push("/eleve/accueil");
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center px-4">
      <div className="bg-white rounded-[12px] shadow p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🥋</div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">BJJ Manager</h1>
          <p className="text-[#666666] text-sm mt-1">Connexion à votre compte</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
              Adresse email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.fr"
              required
              autoComplete="email"
              className="w-full border border-[#e5e5e5] rounded-[8px] px-4 py-2.5 text-[#1a1a1a] text-sm focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="w-full border border-[#e5e5e5] rounded-[8px] px-4 py-2.5 text-[#1a1a1a] text-sm focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          {error && (
            <p className="text-[#ef4444] text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--color-primary)] text-white rounded-[8px] px-4 py-2.5 font-medium text-sm hover:bg-[var(--color-primary-dark)] disabled:opacity-50 transition-colors"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

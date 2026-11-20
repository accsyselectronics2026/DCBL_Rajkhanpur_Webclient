"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message ?? `Login failed (status ${res.status})`);
        return;
      }
      router.push(data.redirect ?? "/Bagcounter");
    } catch {
      setError("Cannot reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center bg-[#F2EDF3] p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-white text-gray-900 rounded-lg shadow p-8 space-y-5"
      >
        <h1 className="text-2xl font-bold text-[#8E3FD6]">MRP Validation System</h1>

        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-semibold text-gray-900">Email</label>
          <input
            id="email" name="email" type="email" required autoComplete="username"
            className="w-full h-11 px-3 border border-gray-400 rounded-md bg-white text-gray-900"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-semibold text-gray-900">Password</label>
          <input
            id="password" name="password" type="password" required
            autoComplete="current-password"
            className="w-full h-11 px-3 border border-gray-400 rounded-md bg-white text-gray-900"
          />
        </div>

        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

        <button
          type="submit" disabled={loading}
          className="w-full h-11 rounded-md bg-[#8E3FD6] text-white font-semibold disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <a href="/forgot-password" className="block text-center text-sm text-[#8E3FD6]">
          Forgot password?
        </a>
      </form>
    </main>
  );
}
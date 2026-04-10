"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex-col justify-between p-12">
        <div>
          <img src="/logo-signifier-white.png" alt="AG" width={56} height={56} className="object-contain" />
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Factory Management,<br />
            <span className="text-blue-400">Simplified.</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-md">
            Track inventory, manage orders, and monitor stock movements — all from one place.
          </p>
        </div>
        <p className="text-slate-500 text-sm">Aditya Gupta Garment Manufacturing</p>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <img src="/logo-signifier-black.png" alt="AG" width={48} height={48} className="object-contain" />
          </div>

          <h2 className="text-2xl font-bold mb-1">Welcome back</h2>
          <p className="text-slate-500 mb-8">Sign in to your account</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 focus:bg-white placeholder:text-slate-400"
                placeholder="you@markdatwork.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 focus:bg-white placeholder:text-slate-400"
                placeholder="Enter your password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium text-sm shadow-sm shadow-blue-600/25 cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Signing in...
                </span>
              ) : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

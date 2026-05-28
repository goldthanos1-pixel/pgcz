"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const url = isLogin ? "/api/auth/login" : "/api/auth/register";

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      if (isLogin) {
        // Success login, redirect to dashboard
        router.push("/dashboard");
      } else {
        // Registration success, switch to login
        alert("Registration complete! Please login.");
        setIsLogin(true);
        setPassword("");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-[85vh] px-4">
      <div className="w-full max-w-md p-8 rounded-2xl glassmorphism neon-border-cyan">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black uppercase tracking-wider text-cyan-neon neon-glow-cyan">
            Gravity Cash
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            Physics-based App Tech Rewards
          </p>
        </div>

        {error && (
          <div className="p-3 mb-4 text-xs font-semibold text-pink-neon bg-pink-950/20 border border-pink-900/30 rounded-lg text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:outline-none focus:border-cyan-neon focus:ring-1 focus:ring-cyan-neon text-white placeholder-slate-500 transition-all"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:outline-none focus:border-cyan-neon focus:ring-1 focus:ring-cyan-neon text-white placeholder-slate-500 transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl font-bold uppercase tracking-wider bg-gradient-to-r from-cyan-neon to-blue-500 hover:from-cyan-neon hover:to-cyan-400 text-slate-950 transition-all active:scale-[0.98] shadow-lg shadow-cyan-500/20 disabled:opacity-50"
          >
            {loading ? "Processing..." : isLogin ? "Launch App" : "Create Account"}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs font-bold uppercase tracking-widest text-pink-neon neon-glow-pink hover:underline"
          >
            {isLogin ? "Need an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    </main>
  );
}

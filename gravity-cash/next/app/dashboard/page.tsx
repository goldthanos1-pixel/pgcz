"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GravityCanvas from "./components/GravityCanvas";
import AdTriggerModal from "./components/AdTriggerModal";

interface Record {
  id: number;
  data: string;
  created_at: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [records, setRecords] = useState<Record[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // App points state
  const [points, setPoints] = useState(100);
  const [adModalOpen, setAdModalOpen] = useState(false);
  const [pendingReward, setPendingReward] = useState(0);

  // Anti-cheat verification
  const [lastRequestTime, setLastRequestTime] = useState(0);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await fetch("/api/data", {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (response.status === 401) {
        router.push("/");
        return;
      }
      if (!response.ok) throw new Error("Failed to load records");
      const data = await response.json();
      setRecords(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEarnPoints = async (amount: number, type: string) => {
    // Basic anti-cheat: prevent spam requests under 300ms
    const now = Date.now();
    if (now - lastRequestTime < 300) {
      console.warn("Spam request blocked by local engine security check.");
      return;
    }
    setLastRequestTime(now);

    if (type === "AD_REWARD") {
      // Open ad modal first
      setPendingReward(amount);
      setAdModalOpen(true);
      return;
    }

    // Direct points accumulation
    setPoints((prev) => prev + amount);

    // Call API internally to store points (in a real app)
    // To satisfy dashboard record list context, we auto-generate dynamic transaction records
    try {
      await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ data: `Earned ${amount} points by tapping a coin!` }),
      });
      fetchRecords();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdComplete = async () => {
    const reward = pendingReward || 50;
    setPoints((prev) => prev + reward);
    setPendingReward(0);

    try {
      await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ data: `Earned ${reward} points by watching a sponsor video!` }),
      });
      fetchRecords();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setSubmitting(true);

    try {
      const response = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ data: inputText }),
      });

      if (!response.ok) throw new Error("Failed to add record");
      const newRecord = await response.json();
      
      setRecords((prev) => [newRecord, ...prev]);
      setInputText("");
    } catch (err) {
      alert("Error adding record");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRecord = async (id: number) => {
    try {
      const response = await fetch(`/api/data/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete");
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert("Error deleting record");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-neon"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Premium Dashboard Header Card */}
      <div className="p-8 rounded-2xl glassmorphism neon-border-cyan flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            Hello, <span className="text-cyan-neon neon-glow-cyan">Gamer</span> 👋
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Tap physics coins, complete tasks, and earn real rewards.
          </p>
        </div>
        <div className="bg-slate-900/60 px-6 py-4 rounded-xl border border-white/5 flex items-center space-x-4">
          <div>
            <p className="text-xs uppercase font-black tracking-widest text-pink-neon neon-glow-pink">Current Points</p>
            <p className="text-2xl font-black text-white mt-1">{points.toLocaleString()} P</p>
          </div>
        </div>
      </div>

      {/* Physics Canvas simulation (Matter.js Coin Tapping Game) */}
      <div className="space-y-2">
        <h3 className="text-sm font-extrabold text-slate-300 uppercase tracking-widest">
          🎮 Gravity Canvas - Click background to spawn / Tap items to earn points
        </h3>
        <GravityCanvas onEarnPoints={handleEarnPoints} />
      </div>

      {/* Main Grid: Form and Translucent Record Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Side: Create record form */}
        <div className="md:col-span-1 p-6 rounded-2xl glassmorphism border border-white/5 h-fit">
          <h3 className="text-lg font-extrabold text-white mb-4 uppercase tracking-wider">Add Record</h3>
          <form onSubmit={handleAddRecord} className="space-y-4">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="What are you thinking today?"
              required
              rows={4}
              className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl focus:outline-none focus:border-cyan-neon focus:ring-1 focus:ring-cyan-neon text-white text-sm placeholder-slate-500 resize-none transition-all"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-cyan-neon hover:bg-cyan-400 text-slate-950 font-bold uppercase tracking-wider text-xs rounded-xl shadow-lg shadow-cyan-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {submitting ? "Adding..." : "Add Record"}
            </button>
          </form>
        </div>

        {/* Right Side: Dashboard List of Translucent Cards */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-lg font-extrabold text-white uppercase tracking-wider flex items-center justify-between">
            <span>Transaction Logs</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-900 border border-white/5 font-normal text-slate-400">
              {records.length} total
            </span>
          </h3>

          {records.length === 0 ? (
            <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
              No records found. Play the gravity game to generate logs!
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((rec) => (
                <div
                  key={rec.id}
                  className="p-5 rounded-xl glassmorphism border border-white/10 flex justify-between items-start hover:border-cyan-neon/30 transition-all group"
                >
                  <div className="space-y-2">
                    <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{rec.data}</p>
                    <span className="inline-block text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      {new Date(rec.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteRecord(rec.id)}
                    className="p-2 text-slate-500 hover:text-pink-neon transition-colors"
                    aria-label="Delete record"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reward Ads Modal Integration */}
      <AdTriggerModal
        isOpen={adModalOpen}
        onClose={() => setAdModalOpen(false)}
        onAdComplete={handleAdComplete}
      />
    </div>
  );
}

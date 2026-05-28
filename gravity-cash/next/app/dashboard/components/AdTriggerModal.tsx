"use client";

import React, { useState } from "react";

interface AdTriggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdComplete: () => void;
}

export default function AdTriggerModal({ isOpen, onClose, onAdComplete }: AdTriggerModalProps) {
  const [adPlaying, setAdPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  if (!isOpen) return null;

  const startAd = () => {
    setAdPlaying(true);
    let current = 0;
    const interval = setInterval(() => {
      current += 10;
      setProgress(current);
      if (current >= 100) {
        clearInterval(interval);
        setAdPlaying(false);
        onAdComplete();
        onClose();
      }
    }, 300); // simulated 3 seconds ad
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm p-6 rounded-2xl glassmorphism neon-border-pink text-center space-y-6">
        {!adPlaying ? (
          <>
            <div className="text-4xl animate-bounce">🎁</div>
            <div>
              <h3 className="text-xl font-black text-pink-neon neon-glow-pink uppercase tracking-wider">
                Special Box Opened!
              </h3>
              <p className="text-xs text-gray-400 mt-2">
                Watch a quick 3-second sponsor video to claim a huge reward of <span className="text-white font-bold">50 Points</span>!
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-slate-400 font-bold uppercase tracking-wider text-xs rounded-xl border border-white/5 transition-all"
              >
                Skip
              </button>
              <button
                onClick={startAd}
                className="flex-1 py-3 bg-gradient-to-r from-pink-neon to-purple-600 hover:from-pink-neon hover:to-pink-500 text-white font-bold uppercase tracking-wider text-xs rounded-xl shadow-lg shadow-pink-500/20 active:scale-[0.98] transition-all"
              >
                Watch Ad
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-4 py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-neon mx-auto"></div>
            <p className="text-xs uppercase font-black tracking-widest text-slate-400">Loading Sponsor Video...</p>
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-white/5">
              <div
                className="bg-pink-neon h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

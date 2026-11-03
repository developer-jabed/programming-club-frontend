"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

const MESSAGES = [
  "Preparing your workspace",
  "Securing your session",
  "Syncing the latest data",
  "Almost there",
];

export default function Loading() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setIndex((i) => (i + 1) % MESSAGES.length),
      1800,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#060d0c] text-white"
    >
      {/* ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_40%,rgba(16,185,129,0.16),transparent_70%),radial-gradient(40%_30%_at_80%_90%,rgba(245,158,11,0.07),transparent_70%)]"
      />

      {/* orbit loader */}
      <div className="relative h-28 w-28">
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
          <defs>
            <linearGradient id="loader-arc" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6ee7b7" />
              <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
            </linearGradient>
          </defs>
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="1.5"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="url(#loader-arc)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="90 190"
            style={{ originX: "50%", originY: "50%" }}
            animate={reduce ? undefined : { rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "linear" }}
          />
        </svg>

        {/* breathing core */}
        <motion.span
          aria-hidden
          className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-300 shadow-[0_0_28px_6px_rgba(52,211,153,0.55)]"
          animate={reduce ? undefined : { scale: [1, 1.5, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        />
      </div>

      {/* rotating status text */}
      <div className="mt-10 h-7">
        <AnimatePresence mode="wait">
          <motion.p
            key={index}
            initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
            transition={{ duration: 0.35 }}
            className="text-lg font-medium tracking-wide text-slate-100"
          >
            {MESSAGES[index]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* indeterminate bar */}
      <div className="relative mt-5 h-[2px] w-48 overflow-hidden rounded-full bg-white/10">
        <motion.span
          className="absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-transparent via-emerald-300 to-transparent"
          initial={{ x: "-100%" }}
          animate={reduce ? { x: "100%" } : { x: ["-100%", "300%"] }}
          transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
        />
      </div>

      <p className="mt-8 text-xs tracking-[0.2em] text-slate-500">
        Please wait a moment
      </p>
    </div>
  );
}
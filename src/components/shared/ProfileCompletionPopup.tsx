"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import {
  FACEBOOK_URL,
  MESSENGER_URL,
  PORTFOLIO_URL,
  WHATSAPP_URL,
} from "@/lib/profile-completion";

const STORAGE_KEY = "profile-completion-dismissed-at";
// How long to stay hidden after the user closes the popup.
const COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

// --- dismissed-state store (localStorage + in-memory fallback) ---
let memoryDismissed = false;
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot(): boolean {
  if (memoryDismissed) return true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const dismissedAt = Number(raw);
    if (!Number.isFinite(dismissedAt)) return false;
    return Date.now() - dismissedAt < COOLDOWN_MS;
  } catch {
    return false;
  }
}

// Server: treat as dismissed so nothing renders during SSR (no hydration mismatch).
function getServerSnapshot(): boolean {
  return true;
}

function dismiss() {
  memoryDismissed = true;
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    // storage unavailable – in-memory flag still closes the popup
  }
  listeners.forEach((listener) => listener());
}

// --- icons (inline, zero dependencies) ---
function ChatIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 20.5l1.7-5.4A8.4 8.4 0 1 1 21 11.5Z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <span
      className="text-lg font-bold leading-none"
      aria-hidden="true"
      style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
    >
      f
    </span>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 opacity-50 transition-transform group-hover:translate-x-0.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

const LINKS = [
  {
    href: FACEBOOK_URL,
    title: "Follow our Facebook page",
    subtitle: "Updates, events & announcements",
    icon: <FacebookIcon />,
    iconClass: "bg-blue-600",
  },
  {
    href: WHATSAPP_URL,
    title: "Join WhatsApp group",
    subtitle: "Chat with members instantly",
    icon: <ChatIcon />,
    iconClass: "bg-green-600",
  },
  {
    href: MESSENGER_URL,
    title: "Join Messenger group",
    subtitle: "Stay connected with the club",
    icon: <ChatIcon />,
    iconClass: "bg-sky-500",
  },
] as const;

export default function ProfileCompletionPopup({
  missingFields,
}: {
  missingFields: string[];
}) {
  const dismissed = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
  const open = !dismissed && missingFields.length > 0;
  const primaryRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    primaryRef.current?.focus();

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="pcp-overlay fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={dismiss}
      role="presentation"
    >
      <style>{`
        @keyframes pcp-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes pcp-pop {
          from { opacity: 0; transform: translateY(16px) scale(.98) }
          to { opacity: 1; transform: translateY(0) scale(1) }
        }
        .pcp-overlay { animation: pcp-fade .18s ease-out }
        .pcp-card { animation: pcp-pop .22s cubic-bezier(.2,.8,.2,1) }
        @media (prefers-reduced-motion: reduce) {
          .pcp-overlay, .pcp-card { animation: none }
        }
      `}</style>

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pcp-title"
        className="pcp-card max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white shadow-2xl ring-1 ring-black/5 sm:rounded-3xl dark:bg-zinc-900 dark:ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 px-6 pb-6 pt-7 text-white">
          <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-12 -left-8 h-28 w-28 rounded-full bg-white/10" />

          <button
            type="button"
            onClick={dismiss}
            aria-label="Close"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-lg leading-none text-white transition hover:bg-white/25"
          >
            ×
          </button>

          <p className="text-xs font-medium uppercase tracking-widest text-white/70">
            Programming Club
          </p>
          <h2 id="pcp-title" className="mt-1 text-xl font-semibold">
            Complete your profile
          </h2>
          <p className="mt-1.5 text-sm text-white/80">
            Finish your profile and stay connected with the club community.
          </p>
        </div>

        <div className="space-y-5 p-6">
          {/* Missing fields */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Missing ({missingFields.length})
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {missingFields.map((field) => (
                <li
                  key={field}
                  className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20"
                >
                  {field}
                </li>
              ))}
            </ul>
          </div>

          {/* Primary CTA */}
          <a
            ref={primaryRef}
            href={PORTFOLIO_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={dismiss}
            className="block rounded-xl bg-zinc-900 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-900"
          >
            Complete profile
          </a>

          {/* Community links */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Join the community
            </p>
            <div className="space-y-2">
              {LINKS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-xl border border-zinc-200 p-3 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/60"
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white ${item.iconClass}`}
                  >
                    {item.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {item.title}
                    </span>
                    <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {item.subtitle}
                    </span>
                  </span>
                  <ArrowIcon />
                </a>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={dismiss}
            className="w-full py-1 text-center text-xs font-medium text-zinc-500 transition hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Remind me later
          </button>
        </div>
      </div>
    </div>
  );
}
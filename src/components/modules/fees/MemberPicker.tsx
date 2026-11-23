// components/modules/fees/MemberPicker.tsx
// Drop-in replacement for the MemberPicker that lives in Dialogue.tsx.
"use client";

import { useEffect, useState } from "react";
import { getMemberOptions } from "@/service/user/user.service"; // adjust path
import { cn } from "@/types/fees.format";
import { Avatar, inputCls } from "./FeeClient";

type Member = {
  id: string;
  name: string;
  email?: string;
  roll?: string;
  registration?: string;
  group?: string;
  semester?: number;
};

interface MemberPickerProps {
  value?: string;
  onChange: (id: string | undefined) => void;
  error?: string;
}

export function MemberPicker({ value, onChange, error }: MemberPickerProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("");
  const [semester, setSemester] = useState("");

  useEffect(() => {
    getMemberOptions().then((r) => {
      if (r.success) setMembers(r.data as Member[]);
      setLoading(false);
    });
  }, []);

  const filtered = members.filter((m) => {
    const text = `${m.name} ${m.roll ?? ""} ${m.registration ?? ""} ${m.email ?? ""}`.toLowerCase();
    if (q && !text.includes(q.toLowerCase())) return false;
    if (group && m.group !== group) return false;
    if (semester && String(m.semester) !== semester) return false;
    return true;
  });

  const selected = members.find((m) => m.id === value);

  return (
    <div className="space-y-2.5">
      <div className="grid gap-2 sm:grid-cols-3">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, roll…"
          className={inputCls}
        />
        <input
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          placeholder="Group"
          className={inputCls}
        />
        <input
          type="number"
          min={1}
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          placeholder="Semester"
          className={inputCls}
        />
      </div>

      {selected && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3.5 py-2.5 text-sm">
          <div>
            <span className="font-medium text-emerald-200">{selected.name}</span>
            {selected.roll && <span className="ml-2 text-emerald-300/70">Roll {selected.roll}</span>}
          </div>
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="text-xs font-medium text-emerald-300 hover:text-white"
          >
            Clear
          </button>
        </div>
      )}

      <div className="max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-white/[0.03]">
        {loading ? (
          <p className="p-3.5 text-sm text-slate-500">Loading members…</p>
        ) : filtered.length === 0 ? (
          <p className="p-3.5 text-sm text-slate-500">No members match the filters</p>
        ) : (
          filtered.map((m) => {
            const isSelected = m.id === value;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onChange(m.id)}
                className={cn(
                  "flex w-full items-center gap-3 border-b border-white/5 px-3.5 py-2.5 text-left text-sm transition-colors last:border-b-0",
                  isSelected ? "bg-emerald-400/10 text-emerald-100" : "text-slate-200 hover:bg-white/[0.05]"
                )}
              >
                <Avatar name={m.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{m.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {[m.roll && `Roll ${m.roll}`, m.group, m.semester && `Sem ${m.semester}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                {isSelected && <span className="text-xs font-medium text-emerald-300">Selected</span>}
              </button>
            );
          })
        )}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
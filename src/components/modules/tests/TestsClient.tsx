"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ClipboardList, Clock, Award } from "lucide-react";

interface Props {
  tests: any[];
}

export default function TestsClient({ tests }: Props) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");

  const filtered = useMemo(() => {
    return tests.filter((t) => {
      const matchSearch =
        !search || t.title?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = status === "ALL" || t.status === status;
      return matchSearch && matchStatus;
    });
  }, [tests, search, status]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tests..."
            className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm"
        >
          <option value="ALL">All Status</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground text-sm">No tests found</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="rounded-2xl border border-border bg-card p-5 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="font-semibold text-foreground line-clamp-1">{t.title}</h3>
                <StatusBadge status={t.status} />
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                {t.description || "No description"}
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                {t.durationMinutes && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {t.durationMinutes}m
                  </span>
                )}
                {t.totalMarks != null && (
                  <span className="flex items-center gap-1">
                    <Award className="h-3.5 w-3.5" />
                    {t.totalMarks} marks
                  </span>
                )}
              </div>
              {t.status === "PUBLISHED" && (
                <Link
                  href={`/tests/${t.id}`}
                  className="inline-flex w-full justify-center rounded-xl bg-primary text-primary-foreground py-2 text-sm font-medium hover:brightness-110 transition"
                >
                  Take Test
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PUBLISHED: "bg-primary/15 text-primary border-primary/25",
    DRAFT: "bg-muted text-muted-foreground border-border",
    CLOSED: "bg-accent/15 text-accent border-accent/25",
    ARCHIVED: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${map[status] || map.DRAFT}`}>
      {status}
    </span>
  );
}

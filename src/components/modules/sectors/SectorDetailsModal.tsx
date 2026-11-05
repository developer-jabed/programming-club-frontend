"use client";

import { useEffect, useState } from "react";
import { getSectorMembers } from "@/service/sector/sector.service";
import { X, Loader2 } from "lucide-react";
import type { Sector } from "./SectorFormFields";

/* eslint-disable @typescript-eslint/no-explicit-any */

function formatDate(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border/60 last:border-0">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pt-0.5">
        {label}
      </span>
      <span className="text-sm text-foreground text-right break-words max-w-[65%]">
        {children}
      </span>
    </div>
  );
}

export default function SectorDetailsModal({
  sector,
  onClose,
}: {
  sector: Sector;
  onClose: () => void;
}) {
  // null = still loading
  const [members, setMembers] = useState<any[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    getSectorMembers(sector.id).then((res) => {
      if (!cancelled) setMembers(res.success ? res.data ?? [] : []);
    });

    return () => {
      cancelled = true;
    };
  }, [sector.id]);

  const color = sector.color || "#10b981";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
        <div className="h-1" style={{ background: color }} />

        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center text-xl"
              style={{ background: `${color}22`, color }}
            >
              {sector.icon || "📁"}
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-lg truncate">{sector.name}</h2>
              <p className="text-xs text-muted-foreground truncate">
                /{sector.slug}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <Row label="Description">{sector.description || "—"}</Row>
            <Row label="Status">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  sector.isActive === false
                    ? "bg-muted text-muted-foreground"
                    : "bg-primary/15 text-primary"
                }`}
              >
                {sector.isActive === false ? "Inactive" : "Active"}
              </span>
            </Row>
            <Row label="Order">{sector.order ?? 0}</Row>
            <Row label="Color">
              <span className="inline-flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full border border-border"
                  style={{ background: color }}
                />
                {color}
              </span>
            </Row>
            <Row label="Created">{formatDate(sector.createdAt)}</Row>
            <Row label="Updated">{formatDate(sector.updatedAt)}</Row>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">
              Members{members ? ` (${members.length})` : ""}
            </h3>

            {members === null ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading members...
              </div>
            ) : members.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No members yet.
              </p>
            ) : (
              <ul className="space-y-1.5 max-h-56 overflow-y-auto">
                {members.map((m: any, i: number) => {
                  const user = m.user ?? m;
                  return (
                    <li
                      key={m.id ?? user.id ?? i}
                      className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                    >
                      <span className="text-sm font-medium truncate">
                        {user.name || "Unnamed"}
                      </span>
                      <span className="text-xs text-muted-foreground truncate ml-3">
                        {user.email || ""}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
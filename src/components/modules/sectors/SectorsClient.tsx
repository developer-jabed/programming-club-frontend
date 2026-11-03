"use client";

import { useState, useTransition } from "react";
import { joinSector, leaveSector } from "@/service/sector/sector.service";
import { Layers, Users, LogIn, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  sectors: any[];
}

export default function SectorsClient({ sectors }: Props) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleJoin = (id: string) => {
    setPendingId(id);
    startTransition(async () => {
      const res = await joinSector(id);
      if (res.success) toast.success(res.message || "Joined!");
      else toast.error(res.message || "Failed");
      setPendingId(null);
    });
  };

  const handleLeave = (id: string) => {
    setPendingId(id);
    startTransition(async () => {
      const res = await leaveSector(id);
      if (res.success) toast.success(res.message || "Left sector");
      else toast.error(res.message || "Failed");
      setPendingId(null);
    });
  };

  if (!sectors.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-16 text-center">
        <Layers className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
        <p className="text-muted-foreground text-sm">No sectors yet</p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {sectors.map((s) => {
        const isMember = s.isMember || s.members?.some?.((m: any) => m.isCurrent);
        const loading = isPending && pendingId === s.id;

        return (
          <div
            key={s.id}
            className="rounded-2xl border border-border bg-card p-5 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div
                className="h-11 w-11 rounded-xl flex items-center justify-center text-lg font-bold shrink-0"
                style={{
                  background: s.color ? `${s.color}22` : "oklch(0.72 0.16 160 / 0.15)",
                  color: s.color || "var(--primary)",
                }}
              >
                {s.icon || s.name?.[0] || "S"}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{s.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {s.description || "No description"}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                {s._count?.members ?? s.members?.length ?? 0} members
              </span>

              <button
                disabled={loading}
                onClick={() => (isMember ? handleLeave(s.id) : handleJoin(s.id))}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  isMember
                    ? "border border-border hover:bg-muted text-muted-foreground"
                    : "bg-primary text-primary-foreground hover:brightness-110"
                }`}
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : isMember ? (
                  <LogOut className="h-3.5 w-3.5" />
                ) : (
                  <LogIn className="h-3.5 w-3.5" />
                )}
                {isMember ? "Leave" : "Join"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Search,
  Loader2,
  UserPlus,
  UserMinus,
  Check,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  assignMembersToSector,
  getSectorMembers,
  removeMemberFromSector,
} from "@/service/sector/sector-members.service";
import type { Sector } from "./SectorFormFields";

export interface Member {
  id: string;
  name: string;
  email?: string;
  role?: string;
  roll?: string;
  phone?: string;
  profilePicture?: string;
}

interface Props {
  sector: Sector;
  users: Member[];
  onClose: () => void;
}

function Avatar({ user, color }: { user: Member; color: string }) {
  if (user.profilePicture) {
    return (
      <img
        src={user.profilePicture}
        alt={user.name}
        className="h-9 w-9 shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <div
      className="h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-sm font-semibold"
      style={{ background: `${color}22`, color }}
    >
      {user.name?.charAt(0).toUpperCase() || "?"}
    </div>
  );
}

function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}

const matches = (u: Member, q: string) =>
  !q ||
  u.name?.toLowerCase().includes(q) ||
  u.email?.toLowerCase().includes(q) ||
  u.roll?.toLowerCase().includes(q) ||
  u.phone?.toLowerCase().includes(q);

export default function ManageSectorMembersModal({ sector, users, onClose }: Props) {
  const router = useRouter();
  const color = sector.color || "#10b981";

  const [loading, setLoading] = useState(true);
  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [assignedSearch, setAssignedSearch] = useState("");
  const [availableSearch, setAvailableSearch] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Load current members of this sector
  useEffect(() => {
    let cancelled = false;
    getSectorMembers(sector.id).then((res) => {
      if (cancelled) return;
      if (res.success) {
        setAssignedIds(res.data.map((m: any) => m.id));
      } else {
        toast.error(res.message || "Failed to load members");
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [sector.id]);

  const assignedSet = useMemo(() => new Set(assignedIds), [assignedIds]);

  const assigned = useMemo(() => {
    const q = assignedSearch.trim().toLowerCase();
    return users.filter((u) => assignedSet.has(u.id) && matches(u, q));
  }, [users, assignedSet, assignedSearch]);

  const available = useMemo(() => {
    const q = availableSearch.trim().toLowerCase();
    return users.filter((u) => !assignedSet.has(u.id) && matches(u, q));
  }, [users, assignedSet, availableSearch]);

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const allVisibleSelected =
    available.length > 0 && available.every((u) => selected.includes(u.id));

  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      const visible = new Set(available.map((u) => u.id));
      setSelected((prev) => prev.filter((id) => !visible.has(id)));
    } else {
      setSelected((prev) => [
        ...new Set([...prev, ...available.map((u) => u.id)]),
      ]);
    }
  };

  const handleAssign = () => {
    const ids = [...selected];
    startTransition(async () => {
      const res = await assignMembersToSector(sector.id, ids);
      if (res.success) {
        toast.success(res.message);
        setAssignedIds((prev) => [...new Set([...prev, ...ids])]);
        setSelected([]);
        router.refresh();
      } else {
        toast.error(res.message || "Failed to assign");
      }
    });
  };

  const handleRemove = (userId: string) => {
    setRemovingId(userId);
    startTransition(async () => {
      const res = await removeMemberFromSector(sector.id, userId);
      if (res.success) {
        toast.success(res.message);
        setAssignedIds((prev) => prev.filter((id) => id !== userId));
        router.refresh();
      } else {
        toast.error(res.message || "Failed to remove");
      }
      setRemovingId(null);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
        onClick={isPending ? undefined : onClose}
      />

      <div className="relative w-full max-w-4xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        <div className="h-1" style={{ background: color }} />

        {/* Header */}
        <div className="flex items-center justify-between gap-3 p-5 border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="h-11 w-11 shrink-0 rounded-xl flex items-center justify-center text-xl"
              style={{ background: `${color}22`, color }}
            >
              {sector.icon || "📁"}
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-lg truncate">{sector.name}</h2>
              <p className="text-xs text-muted-foreground">
                Manage sector members
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
              style={{ background: `${color}22`, color }}
            >
              <Users className="h-3.5 w-3.5" />
              {assignedIds.length} assigned
            </span>
            <button onClick={onClose} className="rounded-lg p-2 hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="grid md:grid-cols-2 flex-1 min-h-0 divide-y md:divide-y-0 md:divide-x divide-border">
          {/* Assigned */}
          <div className="flex flex-col min-h-0 p-4 gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                In this sector
              </h3>
              <span className="text-xs text-muted-foreground">
                {assigned.length}
              </span>
            </div>
            <SearchBox
              value={assignedSearch}
              onChange={setAssignedSearch}
              placeholder="Search assigned..."
            />
            <div className="flex-1 min-h-[200px] overflow-y-auto space-y-1.5 pr-1">
              {loading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : assigned.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                  {assignedIds.length === 0
                    ? "No members assigned yet"
                    : "No matches"}
                </div>
              ) : (
                assigned.map((u) => (
                  <div
                    key={u.id}
                    className="group flex items-center gap-3 rounded-xl border border-border bg-background p-2.5 hover:border-primary/30 transition-colors"
                  >
                    <Avatar user={u} color={color} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{u.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {u.email}
                        {u.roll ? ` · ${u.roll}` : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemove(u.id)}
                      disabled={isPending}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
                    >
                      {removingId === u.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <UserMinus className="h-3.5 w-3.5" />
                      )}
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Available */}
          <div className="flex flex-col min-h-0 p-4 gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Add members
              </h3>
              <button
                onClick={toggleAllVisible}
                disabled={available.length === 0}
                className="text-xs font-medium text-primary hover:underline disabled:opacity-40 disabled:no-underline"
              >
                {allVisibleSelected ? "Clear all" : "Select all"}
              </button>
            </div>
            <SearchBox
              value={availableSearch}
              onChange={setAvailableSearch}
              placeholder="Search by name, email or roll..."
            />
            <div className="flex-1 min-h-[200px] overflow-y-auto space-y-1.5 pr-1">
              {available.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                  {users.length === assignedIds.length
                    ? "Everyone is already assigned"
                    : "No members found"}
                </div>
              ) : (
                available.map((u) => {
                  const isSel = selected.includes(u.id);
                  return (
                    <button
                      type="button"
                      key={u.id}
                      onClick={() => toggle(u.id)}
                      className={`w-full flex items-center gap-3 rounded-xl border p-2.5 text-left transition-all ${
                        isSel
                          ? "border-primary bg-primary/10"
                          : "border-border bg-background hover:border-primary/30"
                      }`}
                    >
                      <Avatar user={u} color={color} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{u.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {u.email}
                          {u.roll ? ` · ${u.roll}` : ""}
                        </p>
                      </div>
                      {u.role && (
                        <span className="hidden sm:inline rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                          {u.role}
                        </span>
                      )}
                      <span
                        className={`h-5 w-5 shrink-0 rounded-md border flex items-center justify-center transition-colors ${
                          isSel
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-border"
                        }`}
                      >
                        {isSel && <Check className="h-3.5 w-3.5" />}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-border p-4 bg-muted/30">
          <p className="text-sm text-muted-foreground">
            {selected.length > 0
              ? `${selected.length} selected`
              : "Select members to assign"}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-sm hover:bg-muted"
            >
              Done
            </button>
            <button
              onClick={handleAssign}
              disabled={isPending || selected.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2 text-sm font-medium disabled:opacity-50 glow-primary"
            >
              {isPending && removingId === null ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              Assign{selected.length > 0 ? ` (${selected.length})` : ""}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
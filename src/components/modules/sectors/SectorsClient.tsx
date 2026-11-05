"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteSector } from "@/service/sector/sector.service";
import {
  Eye,
  Pencil,
  Trash2,
  Search,
  Loader2,
  Users,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import type { Sector } from "./SectorFormFields";
import EditSectorModal from "./EditSectorModal";
import SectorDetailsModal from "./SectorDetailsModal";
import ManageSectorMembersModal, {
  type Member,
} from "./ManageSectorMembersModal";

type StatusFilter = "all" | "active" | "inactive";

function DeleteDialog({
  sector,
  onClose,
}: {
  sector: Sector;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteSector(sector.id);
      if (res.success) {
        toast.success(res.message || "Sector deleted!");
        router.refresh();
        onClose();
      } else {
        toast.error(res.message || "Failed to delete sector");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
        onClick={isPending ? undefined : onClose}
      />
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        <div className="h-1 bg-destructive" />
        <div className="p-5 space-y-3">
          <h2 className="font-semibold text-lg">Delete sector?</h2>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{sector.name}</span>{" "}
            will be permanently deleted. This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              disabled={isPending}
              className="rounded-xl border border-border px-4 py-2 text-sm hover:bg-muted disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-destructive text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SectorsClient({
  sectors,
  users,
}: {
  sectors: Sector[];
  users: Member[];
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [viewing, setViewing] = useState<Sector | null>(null);
  const [editing, setEditing] = useState<Sector | null>(null);
  const [deleting, setDeleting] = useState<Sector | null>(null);
  const [managing, setManaging] = useState<Sector | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sectors
      .filter((s) => {
        if (status === "active" && s.isActive === false) return false;
        if (status === "inactive" && s.isActive !== false) return false;
        if (!q) return true;
        return (
          s.name.toLowerCase().includes(q) ||
          s.slug?.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [sectors, search, status]);

  const activeCount = sectors.filter((s) => s.isActive !== false).length;

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total", value: sectors.length },
          { label: "Active", value: activeCount },
          { label: "Inactive", value: sectors.length - activeCount },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-border bg-card p-4"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {s.label}
            </p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sectors..."
            className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No sectors found.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((sector) => {
            const color = sector.color || "#10b981";
            const inactive = sector.isActive === false;

            return (
              <div
                key={sector.id}
                className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col"
              >
                <div className="h-1" style={{ background: color }} />
                <div className="p-4 flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center text-xl"
                        style={{ background: `${color}22`, color }}
                      >
                        {sector.icon || "📁"}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate">
                          {sector.name}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">
                          /{sector.slug}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        inactive
                          ? "bg-muted text-muted-foreground"
                          : "bg-primary/15 text-primary"
                      }`}
                    >
                      {inactive ? "Inactive" : "Active"}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 min-h-10">
                    {sector.description || "No description"}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {sector._count?.members ?? 0} members
                    </span>
                    <span>Order: {sector.order ?? 0}</span>
                  </div>

                  <button
                    onClick={() => setManaging(sector)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition hover:brightness-110"
                    style={{
                      borderColor: `${color}55`,
                      background: `${color}15`,
                      color,
                    }}
                  >
                    <UserPlus className="h-4 w-4" />
                    Manage Members
                  </button>
                </div>

                <div className="flex items-center justify-end gap-1 border-t border-border p-2">
                  <button
                    onClick={() => setViewing(sector)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-muted"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View
                  </button>
                  <button
                    onClick={() => setEditing(sector)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-muted"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleting(sector)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewing && (
        <SectorDetailsModal sector={viewing} onClose={() => setViewing(null)} />
      )}
      {editing && (
        <EditSectorModal sector={editing} onClose={() => setEditing(null)} />
      )}
      {deleting && (
        <DeleteDialog sector={deleting} onClose={() => setDeleting(null)} />
      )}
      {managing && (
        <ManageSectorMembersModal
          key={managing.id}
          sector={managing}
          users={users}
          onClose={() => setManaging(null)}
        />
      )}
    </div>
  );
}
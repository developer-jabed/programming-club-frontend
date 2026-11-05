/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */
"use client";

import { useMemo, useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  Power,
  Search,
  Shield,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { deleteUser, setUserStatus } from "@/service/user/user.service";
import UserFormModal from "./UserFormModal";

const PAGE_SIZE = 20;

const subscribe = () => () => {};
const useMounted = () =>
  useSyncExternalStore(subscribe, () => true, () => false);

export default function UsersClient({ users }: { users: any[] }) {
  const router = useRouter();
  const mounted = useMounted();

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [group, setGroup] = useState("ALL");
  const [page, setPage] = useState(1);

  const [modal, setModal] = useState<null | "new" | any>(null);
  const [deleting, setDeleting] = useState<any | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const groups = useMemo(
    () =>
      Array.from(new Set(users.map((u) => u.group).filter(Boolean))).sort() as string[],
    [users]
  );

  const stats = useMemo(
    () => ({
      total: users.length,
      active: users.filter((u) => u.status === "ACTIVE").length,
      admins: users.filter((u) => u.role === "ADMIN").length,
      moderators: users.filter((u) => u.role === "MODERATOR").length,
      members: users.filter((u) => u.role === "MEMBER").length,
    }),
    [users]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchSearch =
        !q ||
        [u.name, u.email, u.roll, u.registration, u.phone, u.group].some((v) =>
          v?.toLowerCase?.().includes(q)
        );
      return (
        matchSearch &&
        (role === "ALL" || u.role === role) &&
        (status === "ALL" || u.status === status) &&
        (group === "ALL" || u.group === group)
      );
    });
  }, [users, search, role, status, group]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const run = (
    id: string,
    fn: () => Promise<{ success: boolean; message?: string }>,
    after?: () => void
  ) => {
    setBusyId(id);
    startTransition(async () => {
      const res = await fn();
      if (res.success) {
        toast.success(res.message || "Done");
        after?.();
        router.refresh();
      } else {
        toast.error(res.message || "Failed");
      }
      setBusyId(null);
    });
  };

  const toggleStatus = (u: any) =>
    run(u.id, () =>
      setUserStatus(u.id, u.status === "ACTIVE" ? "INACTIVE" : "ACTIVE")
    );

  const confirmDelete = () => {
    if (!deleting) return;
    const id = deleting.id;
    run(id, () => deleteUser(id), () => setDeleting(null));
  };

  const filterChange =
    (setter: (v: string) => void) =>
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setter(e.target.value);
      setPage(1);
    };

  const select = "rounded-xl border border-border bg-card px-3 py-2.5 text-sm";

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat label="Total" value={stats.total} />
        <Stat label="Active" value={stats.active} />
        <Stat label="Admins" value={stats.admins} />
        <Stat label="Moderators" value={stats.moderators} />
        <Stat label="Members" value={stats.members} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search name, email, roll, registration, phone..."
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select value={role} onChange={filterChange(setRole)} className={select}>
          <option value="ALL">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="MODERATOR">Moderator</option>
          <option value="MEMBER">Member</option>
        </select>
        <select value={status} onChange={filterChange(setStatus)} className={select}>
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <select value={group} onChange={filterChange(setGroup)} className={select}>
          <option value="ALL">All Groups</option>
          {groups.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <button
          onClick={() => setModal("new")}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:brightness-110 glow-primary"
        >
          <Plus className="h-4 w-4" />
          Add User
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Academic</th>
                <th className="px-4 py-3 font-semibold">Last login</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => {
                const busy = busyId === u.id && isPending;
                return (
                  <tr
                    key={u.id}
                    className="border-b border-border/50 transition hover:bg-muted/30"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {u.profilePicture ? (
                          <img
                            src={u.profilePicture}
                            alt=""
                            className="h-9 w-9 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-sm font-bold text-primary">
                            {u.name?.[0]?.toUpperCase() || "?"}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-medium">{u.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusDot status={u.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {[
                        u.group && `Group ${u.group}`,
                        u.semester != null && `Sem ${u.semester}`,
                        u.roll && `Roll ${u.roll}`,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {u.lastLoginAt
                        ? mounted
                          ? format(new Date(u.lastLoginAt), "MMM d, h:mm a")
                          : ""
                        : "Never"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {busy && (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                        <button
                          onClick={() => toggleStatus(u)}
                          disabled={isPending}
                          title={u.status === "ACTIVE" ? "Deactivate" : "Activate"}
                          className="rounded-lg p-2 hover:bg-muted disabled:opacity-50"
                        >
                          <Power
                            className={`h-4 w-4 ${
                              u.status === "ACTIVE"
                                ? "text-primary"
                                : "text-muted-foreground"
                            }`}
                          />
                        </button>
                        <button
                          onClick={() => setModal(u)}
                          className="rounded-lg p-2 hover:bg-muted"
                          aria-label="Edit user"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleting(u)}
                          className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
                          aria-label="Deactivate user"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
          <span>
            {filtered.length === 0
              ? "0 users"
              : `${(current - 1) * PAGE_SIZE + 1}–${Math.min(
                  current * PAGE_SIZE,
                  filtered.length
                )} of ${filtered.length}`}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(current - 1)}
              disabled={current <= 1}
              className="rounded-lg border border-border p-1.5 hover:bg-muted disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span>
              Page {current} / {pages}
            </span>
            <button
              onClick={() => setPage(current + 1)}
              disabled={current >= pages}
              className="rounded-lg border border-border p-1.5 hover:bg-muted disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {modal && (
        <UserFormModal
          key={modal === "new" ? "new" : modal.id}
          user={modal === "new" ? null : modal}
          onClose={() => setModal(null)}
        />
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={() => !isPending && setDeleting(null)}
          />
          <div className="relative w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-5 shadow-2xl">
            <h2 className="text-lg font-semibold">Deactivate user?</h2>
            <p className="text-sm text-muted-foreground">
              &quot;{deleting.name}&quot; will be set to inactive and lose access.
              You can reactivate them later with the power button.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleting(null)}
                disabled={isPending}
                className="rounded-xl border border-border px-4 py-2 text-sm hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-destructive px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    ADMIN: "bg-accent/15 text-accent border-accent/25",
    MODERATOR: "bg-primary/15 text-primary border-primary/25",
    MEMBER: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
        map[role] || map.MEMBER
      }`}
    >
      {role === "ADMIN" ? (
        <Shield className="h-3 w-3" />
      ) : (
        <UserIcon className="h-3 w-3" />
      )}
      {role}
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  const c: Record<string, string> = {
    ACTIVE: "bg-primary",
    INACTIVE: "bg-muted-foreground",
    SUSPENDED: "bg-destructive",
    PENDING: "bg-accent",
  };
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className={`h-1.5 w-1.5 rounded-full ${c[status] || c.INACTIVE}`} />
      {status}
    </span>
  );
}
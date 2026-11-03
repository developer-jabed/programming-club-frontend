"use client";

import { useMemo, useState, useTransition } from "react";
import { Search, Shield, User, Trash2, Loader2 } from "lucide-react";
import { deleteUser } from "@/service/user/user.service";
import { toast } from "sonner";

interface Props {
  users: any[];
}

export default function UsersClient({ users }: Props) {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("ALL");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        !search ||
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase());
      const matchRole = role === "ALL" || u.role === role;
      return matchSearch && matchRole;
    });
  }, [users, search, role]);

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    setPendingId(id);
    startTransition(async () => {
      const res = await deleteUser(id);
      if (res.success) toast.success(res.message || "Deleted");
      else toast.error(res.message || "Failed");
      setPendingId(null);
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm"
        >
          <option value="ALL">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="MODERATOR">Moderator</option>
          <option value="MEMBER">Member</option>
        </select>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center font-bold text-sm">
                        {u.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusDot status={u.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      disabled={isPending && pendingId === u.id}
                      onClick={() => handleDelete(u.id, u.name)}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition"
                    >
                      {isPending && pendingId === u.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
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
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${map[role] || map.MEMBER}`}>
      {role === "ADMIN" ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
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

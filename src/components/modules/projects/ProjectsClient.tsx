"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  deleteProject,
  requestJoinProject,
} from "@/service/project/project.service";
import {
  Eye,
  Pencil,
  Trash2,
  Search,
  Loader2,
  Users,
  Tag,
  UserPlus,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import EditProjectModal from "./EditProjectModal";
import {
  StatusBadge,
  STATUS_OPTIONS,
  type Project,
} from "./ProjectFormFields";
import { getMyMembership } from "@/service/project/project-access";

type Tab = "mine" | "joined";

function DeleteDialog({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteProject(project.id);
      if (res.success) {
        toast.success(res.message || "Project deleted!");
        router.refresh();
        onClose();
      } else {
        toast.error(res.message || "Failed to delete project");
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
          <h2 className="font-semibold text-lg">Delete project?</h2>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{project.title}</span>{" "}
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

export default function ProjectsClient({
  myProjects = [],
  joinedProjects = [],
  sectors = [],
  currentUserId,
}: {
  myProjects?: Project[];
  joinedProjects?: Project[];
  sectors?: { id: string; name: string }[];
  currentUserId?: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const loggedIn = !!currentUserId;

  const [tab, setTab] = useState<Tab>(
    loggedIn && myProjects.length > 0 ? "mine" : "joined"
  );
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sectorId, setSectorId] = useState("all");
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);

  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [, startJoin] = useTransition();

  const isMineTab = tab === "mine";
  const source = isMineTab ? myProjects : joinedProjects;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return source.filter((p) => {
      if (status !== "all" && p.status !== status) return false;
      if (sectorId !== "all" && p.sectorId !== sectorId) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [source, search, status, sectorId]);

  const count = (s: string) => source.filter((p) => p.status === s).length;
  const memberCount = (p: Project) => p._count?.members ?? 0;

  const handleJoin = (projectId: string) => {
    setJoiningId(projectId);
    startJoin(async () => {
      const res = await requestJoinProject(projectId);
      setJoiningId(null);
      if (res.success) {
        toast.success(res.message || "Join request sent!");
        router.refresh();
      } else {
        toast.error(res.message || "Failed to send join request");
      }
    });
  };

  const renderJoinAction = (project: Project) => {
    const membership = getMyMembership(project, currentUserId);
    const st = membership?.status;

    if (membership && (!st || st === "ACTIVE")) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-primary">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Member
        </span>
      );
    }

    if (st === "PENDING") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          Request sent
        </span>
      );
    }

    if (st === "REJECTED") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-destructive">
          Request rejected
        </span>
      );
    }

    const busy = joiningId === project.id;
    return (
      <button
        onClick={() => handleJoin(project.id)}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:brightness-110 disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <UserPlus className="h-3.5 w-3.5" />
        )}
        Join Request
      </button>
    );
  };

  const tabs: { key: Tab; label: string; total: number }[] = [
    { key: "mine", label: "Owned", total: myProjects.length },
    { key: "joined", label: "Joined", total: joinedProjects.length },
  ];

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="inline-flex rounded-xl border border-border bg-card p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === t.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {t.label}
            <span
              className={`rounded-md px-1.5 py-0.5 text-[11px] ${
                tab === t.key ? "bg-primary-foreground/20" : "bg-muted"
              }`}
            >
              {t.total}
            </span>
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: source.length },
          { label: "Open", value: count("OPEN") },
          { label: "In Progress", value: count("IN_PROGRESS") },
          { label: "Completed", value: count("COMPLETED") },
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
            placeholder="Search projects or tags..."
            className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="all">All status</option>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={sectorId}
          onChange={(e) => setSectorId(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="all">All sectors</option>
          {sectors.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          {isMineTab
            ? "You haven't created any projects yet."
            : "You haven't joined any projects yet."}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((project) => (
            <div
              key={project.id}
              className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col"
            >
              <div className="p-4 flex-1 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={project.status} />
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground border border-border rounded-md px-1.5 py-0.5">
                    {project.isPublic === false ? "Private" : "Public"}
                  </span>
                  {isMineTab && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 rounded-md px-1.5 py-0.5">
                      Owner
                    </span>
                  )}
                  {!isMineTab && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-500/10 rounded-md px-1.5 py-0.5">
                      Member
                    </span>
                  )}
                  {project.sector?.name && (
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {project.sector.name}
                    </span>
                  )}
                </div>

                <h3 className="font-semibold truncate">{project.title}</h3>

                <p className="text-sm text-muted-foreground line-clamp-2 min-h-10">
                  {project.description || "No description"}
                </p>

                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {memberCount(project)}
                    {project.maxMembers ? ` / ${project.maxMembers}` : ""}
                  </span>
                  {(project.tags || []).slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 rounded-md bg-primary/10 text-primary px-1.5 py-0.5"
                    >
                      <Tag className="h-3 w-3" />
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-1 border-t border-border p-2">
                {isMineTab ? (
                  <>
                    <Link
                      href={`${pathname}/${project.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-muted"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </Link>
                    <button
                      onClick={() => setEditing(project)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-muted"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleting(project)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href={`${pathname}/${project.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-muted"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View Details
                    </Link>
                    {loggedIn && renderJoinAction(project)}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <EditProjectModal
          project={editing}
          sectors={sectors}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <DeleteDialog project={deleting} onClose={() => setDeleting(null)} />
      )}
    </div>
  );
}
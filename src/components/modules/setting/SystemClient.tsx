/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { format } from "date-fns";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  Eraser,
  HeartPulse,
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
  Save,
  ScrollText,
  ShieldCheck,
  SlidersHorizontal,
  ToggleRight,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  clearCaches,
  exportData,
  forceLogout,
  getAuditLogs,
  getSystemHealth,
  importMembers,
  runDangerAction,
  updateSystemConfig,
  type ActionResult,
  type DangerAction,
  type SystemConfig,
  type SystemHealth,
} from "@/service/system/system.service";

interface Props {
  health: SystemHealth | null;
  config: SystemConfig | null;
  logs: any;
  sessions: any;
  currentUserId?: string;
  failed?: string[];
}

type Notice = { type: "ok" | "err"; text: string } | null;

const subscribe = () => () => {};
const useMounted = () =>
  useSyncExternalStore(subscribe, () => true, () => false);

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const WRAPPER_KEYS = ["data", "items", "results", "rows", "list", "logs", "sessions"];

function toArray(input: any, depth = 0): any[] {
  if (Array.isArray(input)) return input;
  if (input == null || typeof input !== "object" || depth > 2) return [];
  for (const k of WRAPPER_KEYS) if (Array.isArray(input[k])) return input[k];
  for (const k of WRAPPER_KEYS) {
    if (input[k] && typeof input[k] === "object") {
      const inner = toArray(input[k], depth + 1);
      if (inner.length > 0) return inner;
    }
  }
  for (const v of Object.values(input)) if (Array.isArray(v)) return v;
  return [];
}

const DEFAULT_CONFIG: SystemConfig = {
  clubName: "",
  contactEmail: "",
  accentColor: "#6366f1",
  registrationOpen: true,
  requireApproval: false,
  maintenanceMode: false,
  announcement: "",
  features: { tests: true, leaderboard: true, projects: true },
  semesters: [],
  shifts: [],
  groups: [],
};

const fmtUptime = (s?: number) => {
  if (typeof s !== "number") return "—";
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const csvEscape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

function downloadText(filename: string, text: string, type = "text/csv") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const TABS = [
  { id: "health", label: "Health", icon: HeartPulse },
  { id: "config", label: "Configuration", icon: SlidersHorizontal },
  { id: "features", label: "Features", icon: ToggleRight },
  { id: "audit", label: "Audit log", icon: ScrollText },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "data", label: "Data tools", icon: Database },
  { id: "danger", label: "Danger zone", icon: AlertTriangle },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ─────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────
export default function SystemClient({
  health,
  config,
  logs,
  sessions,
  currentUserId,
  failed = [],
}: Props) {
  const [tab, setTab] = useState<TabId>("health");
  const [notice, setNotice] = useState<Notice>(null);
  const [isPending, startTransition] = useTransition();
  const [draft, setDraft] = useState<SystemConfig>({
    ...DEFAULT_CONFIG,
    ...(config || {}),
    features: { ...DEFAULT_CONFIG.features, ...(config?.features || {}) },
  });

  const run = (
    fn: () => Promise<ActionResult>,
    okText: string,
    after?: (r: ActionResult) => void
  ) =>
    startTransition(async () => {
      const r = await fn();
      setNotice({
        type: r.success ? "ok" : "err",
        text: r.success ? r.message || okText : r.message || "Something went wrong",
      });
      if (r.success) after?.(r);
    });

  const save = (patch: Partial<SystemConfig>, okText = "Saved") =>
    run(() => updateSystemConfig(patch), okText);

  return (
    <div className="space-y-4">
      {failed.length > 0 && (
        <p className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertTriangle className="h-3.5 w-3.5" />
          Could not load: {failed.join(", ")}
        </p>
      )}

      {notice && (
        <div
          className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-sm ${
            notice.type === "ok"
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }`}
        >
          <span className="flex items-center gap-2">
            {notice.type === "ok" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            {notice.text}
          </span>
          <button onClick={() => setNotice(null)} aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Sub navigation: sidebar on desktop, scrollable tabs on mobile */}
        <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${
                tab === t.id
                  ? "bg-primary/10 font-semibold text-primary"
                  : "text-muted-foreground hover:bg-muted"
              } ${t.id === "danger" && tab !== t.id ? "hover:text-destructive" : ""}`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0">
          {tab === "health" && <HealthTab initial={health} />}
          {tab === "config" && (
            <ConfigTab draft={draft} setDraft={setDraft} onSave={save} busy={isPending} />
          )}
          {tab === "features" && (
            <FeaturesTab draft={draft} setDraft={setDraft} onSave={save} busy={isPending} />
          )}
          {tab === "audit" && <AuditTab initial={logs} />}
          {tab === "security" && (
            <SecurityTab
              initial={sessions}
              currentUserId={currentUserId}
              run={run}
              busy={isPending}
            />
          )}
          {tab === "data" && <DataTab run={run} busy={isPending} setNotice={setNotice} />}
          {tab === "danger" && (
            <DangerTab semesters={draft.semesters} run={run} busy={isPending} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 1. Health
// ─────────────────────────────────────────────────────────────
function HealthTab({ initial }: { initial: SystemHealth | null }) {
  const [health, setHealth] = useState<SystemHealth | null>(initial);
  const [err, setErr] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const mounted = useMounted();

  const refresh = () =>
    startTransition(async () => {
      const r = await getSystemHealth();
      if (r.success) {
        setHealth(r.data || null);
        setErr(null);
      } else setErr(r.message || "Could not refresh");
    });

  const status = health?.status || "UNKNOWN";
  const tone =
    status === "OK"
      ? "bg-emerald-500"
      : status === "DEGRADED"
      ? "bg-amber-500"
      : status === "DOWN"
      ? "bg-red-500"
      : "bg-muted-foreground";

  const cards = [
    { label: "Version", value: health?.version ?? "—" },
    { label: "Environment", value: health?.environment ?? "—" },
    { label: "Uptime", value: fmtUptime(health?.uptimeSeconds) },
    {
      label: "DB latency",
      value: typeof health?.dbLatencyMs === "number" ? `${health.dbLatencyMs} ms` : "—",
    },
    {
      label: "API latency",
      value: typeof health?.apiLatencyMs === "number" ? `${health.apiLatencyMs} ms` : "—",
    },
    { label: "Members", value: health?.counts?.members ?? "—" },
    { label: "Pending approvals", value: health?.counts?.pendingApprovals ?? "—" },
    { label: "Failed requests today", value: health?.counts?.failedRequestsToday ?? "—" },
  ];

  return (
    <Panel
      title="System health"
      icon={<HeartPulse className="h-4 w-4 text-primary" />}
      action={
        <button
          onClick={refresh}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </button>
      }
    >
      <div className="mb-4 flex items-center gap-2 text-sm">
        <span className={`h-2.5 w-2.5 rounded-full ${tone}`} />
        <span className="font-semibold">{status}</span>
        <span className="text-xs text-muted-foreground">
          {mounted && health?.checkedAt
            ? `· last checked ${format(new Date(health.checkedAt), "MMM d, h:mm:ss a")}`
            : ""}
        </span>
      </div>
      {err && <p className="mb-3 text-xs text-destructive">{err}</p>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {c.label}
            </p>
            <p className="mt-1 break-words text-lg font-bold tabular-nums">{c.value}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. Configuration
// ─────────────────────────────────────────────────────────────
function ConfigTab({
  draft,
  setDraft,
  onSave,
  busy,
}: {
  draft: SystemConfig;
  setDraft: React.Dispatch<React.SetStateAction<SystemConfig>>;
  onSave: (patch: Partial<SystemConfig>, okText?: string) => void;
  busy: boolean;
}) {
  const set = <K extends keyof SystemConfig>(k: K, v: SystemConfig[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  return (
    <div className="space-y-6">
      <Panel title="Club identity" icon={<SlidersHorizontal className="h-4 w-4 text-primary" />}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Club name">
            <input
              value={draft.clubName}
              onChange={(e) => set("clubName", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Contact email">
            <input
              type="email"
              value={draft.contactEmail}
              onChange={(e) => set("contactEmail", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Accent color">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={draft.accentColor}
                onChange={(e) => set("accentColor", e.target.value)}
                className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-card"
              />
              <span className="text-sm tabular-nums text-muted-foreground">
                {draft.accentColor}
              </span>
            </div>
          </Field>
        </div>
        <SaveBar
          busy={busy}
          onClick={() =>
            onSave(
              {
                clubName: draft.clubName,
                contactEmail: draft.contactEmail,
                accentColor: draft.accentColor,
              },
              "Club identity saved"
            )
          }
        />
      </Panel>

      <Panel title="Registration" icon={<ShieldCheck className="h-4 w-4 text-primary" />}>
        <div className="space-y-3">
          <Toggle
            label="Registration open"
            hint="When off, new members cannot sign up."
            checked={draft.registrationOpen}
            disabled={busy}
            onChange={(v) => {
              set("registrationOpen", v);
              onSave({ registrationOpen: v }, "Registration updated");
            }}
          />
          <Toggle
            label="Require approval"
            hint="New members stay pending until an admin approves them."
            checked={draft.requireApproval}
            disabled={busy}
            onChange={(v) => {
              set("requireApproval", v);
              onSave({ requireApproval: v }, "Approval setting updated");
            }}
          />
        </div>
      </Panel>

      <Panel title="Dropdown lists" icon={<Database className="h-4 w-4 text-primary" />}>
        <div className="space-y-6">
          <ListEditor
            label="Semesters"
            items={draft.semesters}
            onChange={(v) => set("semesters", v)}
          />
          <ListEditor label="Shifts" items={draft.shifts} onChange={(v) => set("shifts", v)} />
          <ListEditor label="Groups" items={draft.groups} onChange={(v) => set("groups", v)} />
        </div>
        <SaveBar
          busy={busy}
          onClick={() =>
            onSave(
              { semesters: draft.semesters, shifts: draft.shifts, groups: draft.groups },
              "Lists saved"
            )
          }
        />
      </Panel>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. Features + maintenance
// ─────────────────────────────────────────────────────────────
function FeaturesTab({
  draft,
  setDraft,
  onSave,
  busy,
}: {
  draft: SystemConfig;
  setDraft: React.Dispatch<React.SetStateAction<SystemConfig>>;
  onSave: (patch: Partial<SystemConfig>, okText?: string) => void;
  busy: boolean;
}) {
  const toggleFeature = (key: keyof SystemConfig["features"], v: boolean) => {
    const features = { ...draft.features, [key]: v };
    setDraft((d) => ({ ...d, features }));
    onSave({ features }, "Feature updated");
  };

  return (
    <div className="space-y-6">
      <Panel title="Modules" icon={<ToggleRight className="h-4 w-4 text-primary" />}>
        <div className="space-y-3">
          <Toggle
            label="Tests"
            hint="Quizzes and test attempts."
            checked={draft.features.tests}
            disabled={busy}
            onChange={(v) => toggleFeature("tests", v)}
          />
          <Toggle
            label="Leaderboard"
            hint="Public ranking of member scores."
            checked={draft.features.leaderboard}
            disabled={busy}
            onChange={(v) => toggleFeature("leaderboard", v)}
          />
          <Toggle
            label="Projects"
            hint="Project boards and tasks."
            checked={draft.features.projects}
            disabled={busy}
            onChange={(v) => toggleFeature("projects", v)}
          />
        </div>
      </Panel>

      <Panel title="Maintenance and announcement" icon={<AlertTriangle className="h-4 w-4 text-primary" />}>
        <div className="space-y-4">
          <Toggle
            label="Maintenance mode"
            hint="Shows a maintenance page to non-admin users."
            checked={draft.maintenanceMode}
            disabled={busy}
            onChange={(v) => {
              setDraft((d) => ({ ...d, maintenanceMode: v }));
              onSave({ maintenanceMode: v }, v ? "Maintenance mode on" : "Maintenance mode off");
            }}
          />
          <Field label="Site-wide announcement (leave empty to hide)">
            <textarea
              rows={3}
              value={draft.announcement}
              onChange={(e) => setDraft((d) => ({ ...d, announcement: e.target.value }))}
              className={inputCls}
              placeholder="e.g. Exam week: tests are paused on Friday."
            />
          </Field>
        </div>
        <SaveBar
          busy={busy}
          onClick={() => onSave({ announcement: draft.announcement }, "Announcement saved")}
        />
      </Panel>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. Audit log
// ─────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

function AuditTab({ initial }: { initial: any }) {
  const mounted = useMounted();
  const [rows, setRows] = useState<any[]>(toArray(initial));
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const load = (p: number, s = search, a = action) =>
    startTransition(async () => {
      const r = await getAuditLogs({ page: p, limit: PAGE_SIZE, search: s, action: a });
      if (r.success) {
        setRows(toArray(r.data));
        setPage(p);
        setErr(null);
      } else setErr(r.message || "Could not load logs");
    });

  const exportCsv = () => {
    const header = ["Date", "Actor", "Action", "Details"].map(csvEscape).join(",");
    const lines = rows.map((l) =>
      [
        l.createdAt,
        l.user?.name || l.actor?.name || l.actorName || "",
        l.action || "",
        l.message || l.details || l.title || "",
      ]
        .map(csvEscape)
        .join(",")
    );
    downloadText(`audit-log-page-${page}.csv`, [header, ...lines].join("\n"));
  };

  return (
    <Panel
      title="Audit log"
      icon={<ScrollText className="h-4 w-4 text-primary" />}
      action={
        <button
          onClick={exportCsv}
          disabled={rows.length === 0}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-60"
        >
          <Download className="h-4 w-4" />
          CSV
        </button>
      }
    >
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(1)}
          placeholder="Search user or details…"
          className={`${inputCls} flex-1`}
        />
        <select
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            load(1, search, e.target.value);
          }}
          className={`${inputCls} sm:w-48`}
        >
          <option value="">All actions</option>
          <option value="ROLE_CHANGE">Role change</option>
          <option value="USER_SUSPEND">Suspend</option>
          <option value="PROJECT_DELETE">Project delete</option>
          <option value="CONFIG_UPDATE">Config update</option>
          <option value="LOGIN">Login</option>
        </select>
        <button
          onClick={() => load(1)}
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Apply
        </button>
      </div>

      {err && <p className="mb-3 text-xs text-destructive">{err}</p>}

      <div className="max-h-[28rem] space-y-3 overflow-y-auto">
        {rows.map((l, i) => (
          <div key={l.id || i} className="flex gap-3 text-sm">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <div className="min-w-0 flex-1">
              <p className="break-words">
                {l.action && (
                  <span className="mr-2 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {l.action}
                  </span>
                )}
                {l.message || l.details || l.title}
                {(l.user?.name || l.actor?.name || l.actorName) && (
                  <span className="text-muted-foreground">
                    {" "}
                    · {l.user?.name || l.actor?.name || l.actorName}
                  </span>
                )}
              </p>
              <p className="mt-0.5 min-h-4 text-xs text-muted-foreground">
                {mounted && l.createdAt ? format(new Date(l.createdAt), "MMM d, h:mm a") : ""}
              </p>
            </div>
          </div>
        ))}
        {rows.length === 0 && <Empty text="No log entries" />}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => load(page - 1)}
          disabled={page <= 1 || isPending}
          className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-xs text-muted-foreground">Page {page}</span>
        <button
          onClick={() => load(page + 1)}
          disabled={rows.length < PAGE_SIZE || isPending}
          className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </Panel>
  );
}

// ─────────────────────────────────────────────────────────────
// 5. Security & sessions
// ─────────────────────────────────────────────────────────────
function SecurityTab({
  initial,
  currentUserId,
  run,
  busy,
}: {
  initial: any;
  currentUserId?: string;
  run: (fn: () => Promise<ActionResult>, ok: string, after?: (r: ActionResult) => void) => void;
  busy: boolean;
}) {
  const mounted = useMounted();
  const [rows, setRows] = useState<any[]>(toArray(initial));

  const roles = [
    { role: "ADMIN", text: "Full access, including this System area." },
    { role: "MODERATOR", text: "Manages members, projects and content." },
    { role: "MEMBER", text: "Takes tests, joins projects, edits own profile." },
  ];

  return (
    <div className="space-y-6">
      <Panel title="Active sessions" icon={<ShieldCheck className="h-4 w-4 text-primary" />}>
        <div className="max-h-96 space-y-1.5 overflow-y-auto">
          {rows.map((s, i) => {
            const userId = s.userId || s.user?.id || s.id;
            const name = s.user?.name || s.name || "Unknown";
            const isMe = userId === currentUserId;
            return (
              <div
                key={userId || i}
                className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/40"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">
                    {name}
                    {s.role || s.user?.role ? (
                      <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {s.role || s.user?.role}
                      </span>
                    ) : null}
                  </p>
                  <p className="min-h-4 text-xs text-muted-foreground">
                    {mounted && (s.lastLoginAt || s.createdAt)
                      ? `Last login ${format(
                          new Date(s.lastLoginAt || s.createdAt),
                          "MMM d, h:mm a"
                        )}`
                      : ""}
                    {s.ip ? ` · ${s.ip}` : ""}
                  </p>
                </div>
                <button
                  disabled={busy || isMe || !userId}
                  title={isMe ? "You cannot force-logout yourself" : "Force logout"}
                  onClick={() => {
                    if (!confirm(`Force logout ${name}?`)) return;
                    run(
                      () => forceLogout(userId),
                      `${name} was logged out`,
                      () => setRows((r) => r.filter((x) => (x.userId || x.user?.id || x.id) !== userId))
                    );
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs hover:bg-muted disabled:opacity-40"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </button>
              </div>
            );
          })}
          {rows.length === 0 && <Empty text="No active sessions" />}
        </div>
      </Panel>

      <Panel title="Roles overview" icon={<ShieldCheck className="h-4 w-4 text-primary" />}>
        <div className="space-y-2">
          {roles.map((r) => (
            <div key={r.role} className="flex items-start gap-3 text-sm">
              <span className="w-24 shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-center text-[10px] font-semibold uppercase tracking-wider text-primary">
                {r.role}
              </span>
              <p className="text-muted-foreground">{r.text}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 6. Data tools
// ─────────────────────────────────────────────────────────────
function DataTab({
  run,
  busy,
  setNotice,
}: {
  run: (fn: () => Promise<ActionResult>, ok: string, after?: (r: ActionResult) => void) => void;
  busy: boolean;
  setNotice: (n: Notice) => void;
}) {
  const exports = [
    { type: "members", label: "Members" },
    { type: "results", label: "Test results" },
    { type: "activities", label: "Activity" },
  ] as const;

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setNotice({ type: "err", text: "Please choose a .csv file" });
      return;
    }
    const text = await file.text();
    if (!confirm(`Import members from ${file.name}?`)) return;
    run(() => importMembers(text), "Import finished");
  };

  return (
    <div className="space-y-6">
      <Panel title="Export" icon={<Download className="h-4 w-4 text-primary" />}>
        <div className="flex flex-wrap gap-3">
          {exports.map((e) => (
            <button
              key={e.type}
              disabled={busy}
              onClick={() =>
                run(
                  () => exportData(e.type),
                  `${e.label} exported`,
                  (r) => {
                    const csv = typeof r.data === "string" ? r.data : "";
                    if (!csv) {
                      setNotice({ type: "err", text: "Backend returned no CSV data" });
                      return;
                    }
                    downloadText(`${e.type}-${format(new Date(), "yyyy-MM-dd")}.csv`, csv);
                  }
                )
              }
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm hover:bg-muted disabled:opacity-60"
            >
              <Download className="h-4 w-4" />
              {e.label}
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="Bulk import members" icon={<Upload className="h-4 w-4 text-primary" />}>
        <p className="mb-3 text-sm text-muted-foreground">
          Upload a CSV with a header row (for example: name, email, roll, semester, shift, group).
        </p>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-sm hover:bg-muted">
          <Upload className="h-4 w-4" />
          Choose CSV file
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              onFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
      </Panel>

      <Panel title="Cache" icon={<Eraser className="h-4 w-4 text-primary" />}>
        <p className="mb-3 text-sm text-muted-foreground">
          Revalidates cached server data (user info, analytics, members and more) so changes show
          up immediately.
        </p>
        <button
          disabled={busy}
          onClick={() => run(() => clearCaches(), "Cache cleared")}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eraser className="h-4 w-4" />}
          Clear cache
        </button>
      </Panel>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 7. Danger zone
// ─────────────────────────────────────────────────────────────
function DangerTab({
  semesters,
  run,
  busy,
}: {
  semesters: string[];
  run: (fn: () => Promise<ActionResult>, ok: string, after?: (r: ActionResult) => void) => void;
  busy: boolean;
}) {
  const [semester, setSemester] = useState(semesters[0] || "");
  const [days, setDays] = useState(90);

  return (
    <section className="rounded-2xl border border-destructive/50 bg-card p-5">
      <h2 className="mb-1 flex items-center gap-2 font-semibold text-destructive">
        <AlertTriangle className="h-4 w-4" />
        Danger zone
      </h2>
      <p className="mb-5 text-sm text-muted-foreground">
        These actions cannot be undone. Type the confirmation word to enable each button.
      </p>

      <div className="space-y-4">
        <DangerCard
          title="Reset leaderboard"
          description="Sets every member's score back to zero."
          word="RESET"
          busy={busy}
          onConfirm={() => run(() => runDangerAction("reset-leaderboard"), "Leaderboard reset")}
        />

        <DangerCard
          title="Archive semester"
          description="Moves the selected semester's data to the archive."
          word="ARCHIVE"
          busy={busy}
          disabled={!semester}
          extra={
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className={`${inputCls} sm:w-48`}
            >
              {semesters.length === 0 && <option value="">No semesters configured</option>}
              {semesters.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          }
          onConfirm={() =>
            run(() => runDangerAction("archive-semester", { semester }), `${semester} archived`)
          }
        />

        <DangerCard
          title="Purge old activity logs"
          description="Permanently deletes audit and activity entries older than the chosen number of days."
          word="PURGE"
          busy={busy}
          extra={
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Older than
              <input
                type="number"
                min={7}
                value={days}
                onChange={(e) => setDays(Math.max(7, Number(e.target.value) || 7))}
                className={`${inputCls} w-24`}
              />
              days
            </div>
          }
          onConfirm={() =>
            run(
              () => runDangerAction("purge-logs" as DangerAction, { olderThanDays: days }),
              "Old logs purged"
            )
          }
        />
      </div>
    </section>
  );
}

function DangerCard({
  title,
  description,
  word,
  busy,
  disabled,
  extra,
  onConfirm,
}: {
  title: string;
  description: string;
  word: string;
  busy: boolean;
  disabled?: boolean;
  extra?: React.ReactNode;
  onConfirm: () => void;
}) {
  const [typed, setTyped] = useState("");
  const ready = typed === word && !busy && !disabled;

  return (
    <div className="rounded-xl border border-destructive/30 p-4">
      <p className="font-medium">{title}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      {extra && <div className="mt-3">{extra}</div>}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={`Type ${word}`}
          className={`${inputCls} sm:w-48`}
        />
        <button
          disabled={!ready}
          onClick={() => {
            onConfirm();
            setTyped("");
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-destructive px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Confirm
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Shared pieces
// ─────────────────────────────────────────────────────────────
const inputCls =
  "w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary";

function Panel({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold">
          {icon}
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-8 text-center text-sm text-muted-foreground">{text}</p>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function SaveBar({ busy, onClick }: { busy: boolean; onClick: () => void }) {
  return (
    <div className="mt-5 flex justify-end">
      <button
        onClick={onClick}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save changes
      </button>
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border p-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60 ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function ListEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: string[];
  onChange: (v: string[]) => void;
}) {
  const [value, setValue] = useState("");

  const add = () => {
    const v = value.trim();
    if (!v || items.includes(v)) return;
    onChange([...items, v]);
    setValue("");
  };

  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="mb-2 flex flex-wrap gap-2">
        {items.map((it) => (
          <span
            key={it}
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
          >
            {it}
            <button
              type="button"
              aria-label={`Remove ${it}`}
              onClick={() => onChange(items.filter((x) => x !== it))}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {items.length === 0 && <span className="text-xs text-muted-foreground">None yet</span>}
      </div>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={`Add to ${label.toLowerCase()}`}
          className={inputCls}
        />
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 text-sm hover:bg-muted"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>
    </div>
  );
}
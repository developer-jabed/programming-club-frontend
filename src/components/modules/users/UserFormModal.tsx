/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { createUser, updateUser } from "@/service/user/user.service";

// ⚠ Must match your Prisma `Shift` enum. Check with:
//   grep -n -A6 "enum Shift" prisma/schema.prisma
const SHIFTS = [
  { value: "MORNING", label: "Morning" },
  { value: "DAY", label: "Day" },
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// Keep in sync with the server action
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const input =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const label =
  "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground";

export default function UserFormModal({
  user,
  onClose,
}: {
  user: any | null; // null = create
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const editing = !!user;

  const [f, setF] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    password: "",
    role: user?.role ?? "MEMBER",
    status: user?.status ?? "ACTIVE",
    phone: user?.phone ?? "",
    roll: user?.roll ?? "",
    semester: user?.semester != null ? String(user.semester) : "",
    shift: user?.shift ?? "",
    group: user?.group ?? "",
    registration: user?.registration ?? "",
    bloodGroup: user?.bloodGroup ?? "",
    presentAddress: user?.presentAddress ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Profile picture state
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removePicture, setRemovePicture] = useState(false);

  // Revoke the old object URL when it changes and on unmount
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<any>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  const clearFileInput = () => {
    if (fileRef.current) fileRef.current.value = "";
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (!picked) return;

    if (!ALLOWED_IMAGE_TYPES.includes(picked.type)) {
      setErrors((p) => ({
        ...p,
        profilePicture: "Only JPG, PNG or WebP images are allowed",
      }));
      clearFileInput();
      return;
    }
    if (picked.size > MAX_IMAGE_SIZE) {
      setErrors((p) => ({
        ...p,
        profilePicture: "Image must be 5MB or smaller",
      }));
      clearFileInput();
      return;
    }

    setErrors((p) => {
      const { profilePicture, ...rest } = p;
      return rest;
    });
    setFile(picked);
    setPreview(URL.createObjectURL(picked));
    setRemovePicture(false);
  };

  const clearSelected = () => {
    setFile(null);
    setPreview(null);
    clearFileInput();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const fd = new FormData();
    (Object.keys(f) as (keyof typeof f)[]).forEach((k) => {
      if (k === "password") {
        if (f.password) fd.set("password", f.password); // optional on edit
        return;
      }
      if (k === "status" && !editing) return;
      fd.set(k, f[k]);
    });

    // Picture: a new file wins; otherwise optional removal (edit only)
    if (file) {
      fd.set("profilePicture", file);
    } else if (editing && removePicture) {
      fd.set("removeProfilePicture", "true");
    }

    startTransition(async () => {
      const res: any = editing
        ? await updateUser(user.id, null, fd)
        : await createUser(null, fd);

      if (res.success) {
        toast.success(res.message || "Saved");
        router.refresh();
        onClose();
      } else {
        if (res.errors && typeof res.errors === "object") setErrors(res.errors);
        toast.error(res.message || "Failed to save user");
      }
    });
  };

  const err = (k: string) =>
    errors[k] ? (
      <p className="text-xs text-destructive">{String(errors[k])}</p>
    ) : null;

  // What the avatar shows: new preview > existing picture (unless removed) > initial
  const shownPicture = preview ?? (removePicture ? null : user?.profilePicture ?? null);
  const initial = (f.name?.[0] || "?").toUpperCase();
  const hasExisting = editing && !!user?.profilePicture;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
        onClick={() => !isPending && onClose()}
      />
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="h-1 bg-gradient-to-r from-primary to-accent" />
        <div className="flex items-center justify-between border-b border-border p-5">
          <h2 className="text-lg font-semibold">
            {editing ? "Edit User" : "Add User"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-muted"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5 overflow-y-auto p-5">
          {/* Profile picture */}
          <div className="flex items-center gap-4">
            {shownPicture ? (
              <img
                src={shownPicture}
                alt=""
                className="h-20 w-20 shrink-0 rounded-2xl border border-border object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-2xl font-bold text-primary">
                {initial}
              </div>
            )}

            <div className="min-w-0 space-y-2">
              <p className={label}>Profile picture</p>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  name="profilePicture"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={onPickFile}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-medium hover:bg-muted disabled:opacity-60"
                >
                  <ImagePlus className="h-4 w-4" />
                  {shownPicture ? "Change picture" : "Upload picture"}
                </button>

                {file && (
                  <button
                    type="button"
                    onClick={clearSelected}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs hover:bg-muted disabled:opacity-60"
                  >
                    <X className="h-4 w-4" />
                    Clear selection
                  </button>
                )}

                {hasExisting && !file && !removePicture && (
                  <button
                    type="button"
                    onClick={() => setRemovePicture(true)}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-60"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove picture
                  </button>
                )}

                {hasExisting && removePicture && !file && (
                  <button
                    type="button"
                    onClick={() => setRemovePicture(false)}
                    disabled={isPending}
                    className="rounded-xl border border-border px-3 py-2 text-xs hover:bg-muted disabled:opacity-60"
                  >
                    Undo remove
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                JPG, PNG or WebP · max 5MB
                {file ? ` · ${file.name}` : ""}
              </p>
              {err("profilePicture")}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className={label}>Name *</label>
              <input
                value={f.name}
                onChange={set("name")}
                required
                className={input}
                placeholder="Full name"
              />
              {err("name")}
            </div>
            <div className="space-y-1.5">
              <label className={label}>Email *</label>
              <input
                value={f.email}
                onChange={set("email")}
                type="email"
                required
                className={input}
                placeholder="email@example.com"
              />
              {err("email")}
            </div>
            <div className="space-y-1.5">
              <label className={label}>
                {editing ? "New password" : "Password *"}
              </label>
              <input
                value={f.password}
                onChange={set("password")}
                type="password"
                required={!editing}
                minLength={6}
                autoComplete="new-password"
                className={input}
                placeholder={editing ? "Leave blank to keep current" : "Min 6 characters"}
              />
              {err("password")}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className={label}>Role</label>
                <select value={f.role} onChange={set("role")} className={input}>
                  <option value="MEMBER">Member</option>
                  <option value="MODERATOR">Moderator</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              {editing && (
                <div className="space-y-1.5">
                  <label className={label}>Status</label>
                  <select value={f.status} onChange={set("status")} className={input}>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-border p-4">
            <p className={label}>Profile</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className={label}>Phone</label>
                <input value={f.phone} onChange={set("phone")} className={input} />
              </div>
              <div className="space-y-1.5">
                <label className={label}>Roll</label>
                <input value={f.roll} onChange={set("roll")} className={input} />
              </div>
              <div className="space-y-1.5">
                <label className={label}>Registration</label>
                <input
                  value={f.registration}
                  onChange={set("registration")}
                  className={input}
                />
                {err("registration")}
              </div>
              <div className="space-y-1.5">
                <label className={label}>Semester</label>
                <input
                  type="number"
                  min={1}
                  value={f.semester}
                  onChange={set("semester")}
                  className={input}
                />
                {err("semester")}
              </div>
              <div className="space-y-1.5">
                <label className={label}>Shift</label>
                <select value={f.shift} onChange={set("shift")} className={input}>
                  <option value="">—</option>
                  {SHIFTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={label}>Group</label>
                <input value={f.group} onChange={set("group")} className={input} />
              </div>
              <div className="space-y-1.5">
                <label className={label}>Blood group</label>
                <select
                  value={f.bloodGroup}
                  onChange={set("bloodGroup")}
                  className={input}
                >
                  <option value="">—</option>
                  {BLOOD_GROUPS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className={label}>Present address</label>
                <input
                  value={f.presentAddress}
                  onChange={set("presentAddress")}
                  className={input}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-xl border border-border px-4 py-2 text-sm hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60 glow-primary"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Save changes" : "Create user"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
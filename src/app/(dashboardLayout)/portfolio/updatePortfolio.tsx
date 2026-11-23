"use client";

import { useActionState, useState } from "react";
import { Pencil, X, Loader2 } from "lucide-react";
import { updateUser } from "@/service";

type UserData = {
  id: string;
  name: string;
  phone?: string | null;
  roll?: string | null;
  semester?: number | null;
  shift?: string | null;
  group?: string | null;
  registration?: string | null;
  bloodGroup?: string | null;
  presentAddress?: string | null;
  profilePicture?: string | null;
};

type State = {
  success: boolean;
  message?: string;
  errors?: Record<string, string>;
} | null;

// TODO: match your Prisma `Shift` enum values
const SHIFT_OPTIONS = ["MORNING", "DAY"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const inputCls =
  "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30";

function Field({
  label,
  name,
  error,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={name} className="block text-sm">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
      {error && (
        <span className="mt-1 block text-xs text-destructive">{error}</span>
      )}
    </label>
  );
}

export default function UpdatePortfolio({ user }: { user: UserData }) {
  const [open, setOpen] = useState(false);
  const [removePic, setRemovePic] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  // Close/reset inside the action itself: no effect, no cascading renders.
  const [state, action, pending] = useActionState<State, FormData>(
    async (prev, formData) => {
      const res = await updateUser(user.id, prev, formData);
      if (res?.success) {
        setOpen(false);
        setRemovePic(false);
        setPreview((old) => {
          if (old) URL.revokeObjectURL(old);
          return null;
        });
      }
      return res as State;
    },
    null
  );

  const err = (k: string) => state?.errors?.[k];
  const currentPic = removePic ? null : preview ?? user.profilePicture;

  if (!open) {
    return (
      <div className="space-y-2">
        {state?.success && (
          <p className="text-sm text-green-600">{state.message}</p>
        )}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          <Pencil className="h-4 w-4" />
          Edit profile
        </button>
      </div>
    );
  }

  return (
    <section className="w-full rounded-2xl border border-border bg-card p-5 text-left">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">Edit profile</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="rounded-md p-1 text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Role, email and status are intentionally NOT included,
          so updateUser never sends them and they stay unchanged. */}
      <form action={action} className="space-y-5">
        {/* Picture */}
        <div className="flex items-center gap-4">
          {currentPic ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentPic}
              alt={user.name}
              className="h-20 w-20 rounded-full border border-border object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
              No photo
            </div>
          )}
          <div className="space-y-2 text-sm">
            <input
              type="file"
              name="profilePicture"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setPreview((old) => {
                  if (old) URL.revokeObjectURL(old);
                  return f ? URL.createObjectURL(f) : null;
                });
                if (f) setRemovePic(false);
              }}
            />
            {err("profilePicture") && (
              <p className="text-xs text-destructive">
                {err("profilePicture")}
              </p>
            )}
            {user.profilePicture && (
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={removePic}
                  onChange={(e) => setRemovePic(e.target.checked)}
                />
                Remove current photo
              </label>
            )}
            <input
              type="hidden"
              name="removeProfilePicture"
              value={removePic ? "true" : "false"}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" name="name" error={err("name")}>
            <input
              id="name"
              name="name"
              defaultValue={user.name}
              required
              className={inputCls}
            />
          </Field>

          <Field label="Phone" name="phone" error={err("phone")}>
            <input
              id="phone"
              name="phone"
              defaultValue={user.phone ?? ""}
              className={inputCls}
            />
          </Field>

          <Field label="Roll" name="roll" error={err("roll")}>
            <input
              id="roll"
              name="roll"
              defaultValue={user.roll ?? ""}
              className={inputCls}
            />
          </Field>

          <Field
            label="Registration"
            name="registration"
            error={err("registration")}
          >
            <input
              id="registration"
              name="registration"
              defaultValue={user.registration ?? ""}
              className={inputCls}
            />
          </Field>

          <Field label="Semester" name="semester" error={err("semester")}>
            <input
              id="semester"
              name="semester"
              type="number"
              min={1}
              step={1}
              defaultValue={user.semester ?? ""}
              className={inputCls}
            />
          </Field>

          <Field label="Shift" name="shift" error={err("shift")}>
            <select
              id="shift"
              name="shift"
              defaultValue={user.shift ?? ""}
              className={inputCls}
            >
              <option value="">— None —</option>
              {SHIFT_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Group" name="group" error={err("group")}>
            <input
              id="group"
              name="group"
              defaultValue={user.group ?? ""}
              className={inputCls}
            />
          </Field>

          <Field
            label="Blood group"
            name="bloodGroup"
            error={err("bloodGroup")}
          >
            <select
              id="bloodGroup"
              name="bloodGroup"
              defaultValue={user.bloodGroup ?? ""}
              className={inputCls}
            >
              <option value="">— None —</option>
              {BLOOD_GROUPS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field
          label="Present address"
          name="presentAddress"
          error={err("presentAddress")}
        >
          <textarea
            id="presentAddress"
            name="presentAddress"
            rows={2}
            defaultValue={user.presentAddress ?? ""}
            className={inputCls}
          />
        </Field>


        {state && !state.success && state.message && (
          <p className="text-sm text-destructive">{state.message}</p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg border border-border px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </button>
        </div>
      </form>
    </section>
  );
}
"use client";

import { changePasswordAction } from "@/service/auth/auth.service";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Key, Loader2, Lock, ShieldCheck, XCircle } from "lucide-react";
import { useRef, useState, useTransition } from "react";

/* ─── helpers ─── */
const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

const inputCls =
  "h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-11 text-sm text-slate-100 " +
  "placeholder:text-slate-500 [color-scheme:dark] transition-colors hover:border-white/20 " +
  "focus:border-emerald-400/60 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-emerald-400/15 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

/* ─── Password strength ─── */
const STRENGTH = [
  { label: "", text: "", bar: "" },
  { label: "Weak", text: "text-red-400", bar: "bg-red-400" },
  { label: "Fair", text: "text-amber-400", bar: "bg-amber-400" },
  { label: "Good", text: "text-sky-400", bar: "bg-sky-400" },
  { label: "Strong", text: "text-emerald-400", bar: "bg-emerald-400" },
  { label: "Excellent", text: "text-teal-300", bar: "bg-teal-300" },
] as const;

function getStrength(pwd: string) {
  if (!pwd) return { score: 0, ...STRENGTH[0] };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  // keep the original thresholds: ≤1 weak, 2 fair, 3 good, 4 strong, 5 excellent
  const level = Math.max(1, score);
  return { score, ...STRENGTH[level] };
}

/* ─── Eye-toggle input ─── */
function SecureInput({
  id,
  name,
  placeholder,
  disabled,
  value,
  onChange,
}: {
  id: string;
  name: string;
  placeholder: string;
  disabled: boolean;
  value: string;
  onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="group relative">
      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-emerald-400" />
      <input
        className={inputCls}
        type={show ? "text" : "password"}
        id={id}
        name={name}
        placeholder={placeholder}
        required
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={name === "oldPassword" ? "current-password" : "new-password"}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        tabIndex={-1}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-emerald-300"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

const labelCls = "flex items-center justify-between text-xs font-medium text-slate-300";

const ChangePasswordPage = () => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newPwd, setNewPwd] = useState("");
  const [oldPwd, setOldPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const strength = getStrength(newPwd);
  const matchOk = confirmPwd.length > 0 && newPwd === confirmPwd;
  const matchBad = confirmPwd.length > 0 && newPwd !== confirmPwd;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPwd !== confirmPwd) {
      setError("New password and confirm password do not match.");
      return;
    }

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const result = await changePasswordAction(null, formData);
        if (result.success) {
          setSuccess(result.message || "Password changed successfully!");
          setOldPwd("");
          setNewPwd("");
          setConfirmPwd("");
          formRef.current?.reset();
        } else {
          setError(result.message || "Failed to change password.");
        }
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  };

  const reqs = [
    { met: newPwd.length >= 8, text: "8+ characters" },
    { met: /[A-Z]/.test(newPwd), text: "Uppercase letter" },
    { met: /[0-9]/.test(newPwd), text: "Number" },
    { met: /[^A-Za-z0-9]/.test(newPwd), text: "Special character" },
  ];

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-9rem)] w-full max-w-xl flex-col justify-center space-y-6">
      {/* Header */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-400/10 text-emerald-300">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Change password</h1>
          <p className="text-sm text-slate-400">Keep your account safe with a strong password.</p>
        </div>
      </div>

      <form ref={formRef} onSubmit={handleSubmit}>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm">
          <div className="space-y-5 p-5 sm:p-6">
            {/* Alerts */}
            {error && (
              <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-400/20 bg-red-400/10 px-3.5 py-3 text-sm text-red-300">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div role="status" className="flex items-start gap-2.5 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3.5 py-3 text-sm text-emerald-300">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Current password */}
            <div className="space-y-1.5">
              <label className={labelCls} htmlFor="oldPassword">
                Current password
              </label>
              <SecureInput
                id="oldPassword"
                name="oldPassword"
                placeholder="Enter your current password"
                disabled={isPending}
                value={oldPwd}
                onChange={setOldPwd}
              />
            </div>

            {/* New password */}
            <div className="space-y-2.5">
              <div className="space-y-1.5">
                <label className={labelCls} htmlFor="newPassword">
                  New password
                  {newPwd && (
                    <span className={cn("rounded-md bg-white/5 px-2 py-0.5 text-[11px] font-semibold", strength.text)}>
                      {strength.label}
                    </span>
                  )}
                </label>
                <SecureInput
                  id="newPassword"
                  name="newPassword"
                  placeholder="Create a strong new password"
                  disabled={isPending}
                  value={newPwd}
                  onChange={setNewPwd}
                />
              </div>

              {newPwd && (
                <>
                  <div className="flex gap-1" aria-hidden>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-1 flex-1 rounded-full transition-colors duration-300",
                          i <= strength.score ? strength.bar : "bg-white/10"
                        )}
                      />
                    ))}
                  </div>

                  <ul className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
                    {reqs.map(({ met, text }) => (
                      <li
                        key={text}
                        className={cn(
                          "flex items-center gap-2 text-xs transition-colors",
                          met ? "text-emerald-300" : "text-slate-500"
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 shrink-0 rounded-full transition-colors",
                            met ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" : "bg-white/15"
                          )}
                        />
                        {text}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <label className={labelCls} htmlFor="confirmPassword">
                Confirm new password
              </label>
              <SecureInput
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Re-enter your new password"
                disabled={isPending}
                value={confirmPwd}
                onChange={setConfirmPwd}
              />
              {matchOk && (
                <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Passwords match
                </p>
              )}
              {matchBad && (
                <p className="flex items-center gap-1.5 text-xs font-medium text-red-400">
                  <XCircle className="h-3.5 w-3.5" /> Passwords do not match
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-4 sm:px-6">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <AlertCircle className="h-3.5 w-3.5" /> Use a unique password not used elsewhere
            </span>
            <button
              type="submit"
              disabled={isPending || matchBad}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 text-sm font-semibold text-emerald-950 shadow-[0_0_24px_-8px_rgba(52,211,153,0.7)] transition hover:bg-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Updating…
                </>
              ) : (
                <>
                  <Key className="h-4 w-4" /> Update password
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChangePasswordPage;
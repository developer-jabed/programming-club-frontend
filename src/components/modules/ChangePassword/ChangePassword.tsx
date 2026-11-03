"use client";

import { Loader2, Key, Eye, EyeOff, CheckCircle2, XCircle, ShieldCheck, Lock, AlertCircle } from "lucide-react";
import { useState, useTransition, useRef } from "react";
import { changePassword } from "@/service/auth/auth.service";

/* ─── Password strength helper ─── */
function getStrength(pwd: string): { score: number; label: string; color: string } {
    if (!pwd) return { score: 0, label: "", color: "#E2E8F0" };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { score, label: "Weak", color: "#F43F5E" };
    if (score <= 2) return { score, label: "Fair", color: "#F59E0B" };
    if (score <= 3) return { score, label: "Good", color: "#3B82F6" };
    if (score <= 4) return { score, label: "Strong", color: "#10B981" };
    return { score, label: "Excellent", color: "#6366F1" };
}

/* ─── Eye-toggle input ─── */
function SecureInput({
    id, name, placeholder, disabled, value, onChange,
}: {
    id: string; name: string; placeholder: string;
    disabled: boolean; value: string;
    onChange: (v: string) => void;
}) {
    const [show, setShow] = useState(false);
    return (
        <div className="cpw-input-wrap">
            <div className="cpw-input-icon"><Lock /></div>
            <input
                className="cpw-input"
                type={show ? "text" : "password"}
                id={id} name={name}
                placeholder={placeholder}
                required disabled={disabled}
                value={value}
                onChange={e => onChange(e.target.value)}
                autoComplete={name === "oldPassword" ? "current-password" : "new-password"}
            />
            <button
                type="button"
                className="cpw-eye"
                onClick={() => setShow(s => !s)}
                tabIndex={-1}
                aria-label={show ? "Hide password" : "Show password"}
            >
                {show ? <EyeOff /> : <Eye />}
            </button>
        </div>
    );
}

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
                const result = await changePassword(null, formData);
                if (result.success) {
                    setSuccess(result.message || "Password changed successfully!");
                    setOldPwd(""); setNewPwd(""); setConfirmPwd("");
                    formRef.current?.reset();
                } else {
                    setError(result.message || "Failed to change password.");
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (err: any) {
                setError("Something went wrong. Please try again.");
            }
        });
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

                /* ─ Root: transparent, inherits dashboard bg ─ */
                .cpw-root {
                    font-family: 'DM Sans', sans-serif;
                    max-width: 520px;
                    padding: 32px 0 80px;
                    color: #1E293B;
                
                }

                /* ─ Page header ─ */
                .cpw-header { margin-bottom: 28px; }

                .cpw-title-row {
                    display: flex; align-items: center; gap: 12px;
                    margin-bottom: 6px;
                }
                .cpw-icon-badge {
                    width: 44px; height: 44px; border-radius: 12px;
                    background: linear-gradient(135deg, #EEF2FF, #E0E7FF);
                    border: 1px solid #C7D2FE;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0;
                    box-shadow: 0 2px 8px rgba(99,102,241,0.18);
                }
                .cpw-icon-badge svg { width: 20px; height: 20px; color: #6366F1; }

                .cpw-title-text {}
                .cpw-title {
                    font-family: 'Syne', sans-serif;
                    font-weight: 800; font-size: 22px;
                    color: #0F172A; line-height: 1;
                }
                .cpw-subtitle { font-size: 13px; color: #94A3B8; margin-top: 3px; }

                /* ─ Card ─ */
                .cpw-card {
                    background: #fff;
                    border-radius: 20px;
                    border: 1px solid rgba(0,0,0,0.07);
                    box-shadow:
                        0 1px 2px rgba(0,0,0,0.04),
                        0 6px 24px rgba(99,102,241,0.08);
                    overflow: hidden;
                    animation: cpw-rise 0.4s ease both;
                }
                @keyframes cpw-rise {
                    from { opacity: 0; transform: translateY(14px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                /* Decorative top strip */
                .cpw-strip {
                    height: 5px;
                    background: linear-gradient(90deg, #6366F1, #8B5CF6, #38BDF8);
                }

                /* Card section label */
                .cpw-section-label {
                    display: flex; align-items: center; gap: 8px;
                    padding: 16px 22px 0;
                    font-size: 10px; font-weight: 700;
                    text-transform: uppercase; letter-spacing: 1.5px;
                    color: #94A3B8;
                }
                .cpw-section-label::after {
                    content: ''; flex: 1; height: 1px; background: #F1F5F9;
                }

                /* Body */
                .cpw-body {
                    padding: 18px 22px 22px;
                    display: flex; flex-direction: column; gap: 18px;
                }

                /* ─ Alert banners ─ */
                .cpw-alert {
                    display: flex; align-items: flex-start; gap: 10px;
                    padding: 12px 14px; border-radius: 10px;
                    font-size: 13px; line-height: 1.5;
                    animation: cpw-slide 0.2s ease;
                }
                @keyframes cpw-slide {
                    from { opacity: 0; transform: translateY(-4px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .cpw-alert svg { width: 15px; height: 15px; flex-shrink: 0; margin-top: 1px; }
                .cpw-alert-error   { background: #FFF1F2; border: 1px solid #FECDD3; color: #BE123C; }
                .cpw-alert-success { background: #F0FDF4; border: 1px solid #BBF7D0; color: #15803D; }

                /* ─ Field ─ */
                .cpw-field { display: flex; flex-direction: column; gap: 6px; }

                .cpw-label {
                    font-size: 11px; font-weight: 600; color: #475569;
                    text-transform: uppercase; letter-spacing: 1px;
                    display: flex; align-items: center; justify-content: space-between;
                }
                .cpw-label-badge {
                    font-size: 10px; font-weight: 600; letter-spacing: 0.5px;
                    padding: 2px 7px; border-radius: 5px; text-transform: none;
                }

                /* Input wrapper */
                .cpw-input-wrap {
                    position: relative; display: flex; align-items: center;
                }
                .cpw-input-icon {
                    position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
                    color: #CBD5E1; pointer-events: none;
                    display: flex; align-items: center;
                }
                .cpw-input-icon svg { width: 14px; height: 14px; }

                .cpw-input {
                    width: 100%;
                    padding: 11px 42px 11px 38px;
                    border: 1.5px solid #E2E8F0;
                    border-radius: 11px; font-size: 14px;
                    color: #1E293B; background: #FAFBFC;
                    font-family: 'DM Sans', sans-serif;
                    outline: none; transition: all 0.18s;
                    letter-spacing: 0.2px;
                }
                .cpw-input::placeholder { color: #CBD5E1; letter-spacing: 0; }
                .cpw-input:focus {
                    border-color: #6366F1;
                    background: #fff;
                    box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
                }
                .cpw-input:focus + .cpw-eye,
                .cpw-input-wrap:focus-within .cpw-input-icon { color: #6366F1; }
                .cpw-input:disabled { opacity: 0.5; cursor: not-allowed; }

                .cpw-eye {
                    position: absolute; right: 12px; top: 50%;
                    transform: translateY(-50%);
                    background: none; border: none; cursor: pointer;
                    color: #94A3B8; padding: 3px;
                    display: flex; align-items: center;
                    border-radius: 5px; transition: all 0.14s;
                }
                .cpw-eye:hover { color: #6366F1; background: #EEF2FF; }
                .cpw-eye svg { width: 15px; height: 15px; }

                /* ─ Strength meter ─ */
                .cpw-strength { display: flex; flex-direction: column; gap: 6px; }
                .cpw-strength-bars { display: flex; gap: 4px; }
                .cpw-strength-bar {
                    flex: 1; height: 3px; border-radius: 99px;
                    background: #E2E8F0;
                    transition: background 0.3s ease;
                }
                .cpw-strength-footer {
                    display: flex; justify-content: space-between;
                    font-size: 11px; color: #94A3B8;
                }
                .cpw-strength-label { font-weight: 600; transition: color 0.2s; }

                /* Requirements checklist */
                .cpw-reqs {
                    display: grid; grid-template-columns: 1fr 1fr; gap: 5px;
                    padding: 12px 14px;
                    background: #F8FAFC; border: 1px solid #F1F5F9;
                    border-radius: 10px;
                }
                .cpw-req {
                    display: flex; align-items: center; gap: 6px;
                    font-size: 11px; color: #94A3B8;
                    transition: color 0.2s;
                }
                .cpw-req.met { color: #10B981; }
                .cpw-req-dot {
                    width: 6px; height: 6px; border-radius: 50%;
                    background: #E2E8F0; flex-shrink: 0;
                    transition: background 0.2s;
                }
                .cpw-req.met .cpw-req-dot { background: #10B981; box-shadow: 0 0 4px rgba(16,185,129,0.4); }

                /* Match indicator */
                .cpw-match {
                    font-size: 11px; font-weight: 500;
                    display: flex; align-items: center; gap: 5px;
                    padding: 0 2px;
                }
                .cpw-match svg { width: 12px; height: 12px; }
                .cpw-match.ok  { color: #10B981; }
                .cpw-match.bad { color: #F43F5E; }

                /* ─ Footer ─ */
                .cpw-footer {
                    padding: 16px 22px;
                    border-top: 1px solid #F8FAFC;
                    display: flex; align-items: center; justify-content: space-between;
                }
                .cpw-tip {
                    font-size: 11px; color: #CBD5E1;
                    display: flex; align-items: center; gap: 5px;
                }
                .cpw-tip svg { width: 11px; height: 11px; }
                .cpw-page{
                  display: flex; justify-content: center; padding: 40px 20px;
                }

                .cpw-submit {
                    display: flex; align-items: center; gap: 8px;
                    background: #6366F1; color: #fff; border: none;
                    padding: 11px 24px; border-radius: 11px;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 13px; font-weight: 600;
                    cursor: pointer; transition: all 0.2s;
                    box-shadow: 0 2px 10px rgba(99,102,241,0.28);
                }
                .cpw-submit:hover:not(:disabled) {
                    background: #4F46E5;
                    transform: translateY(-1px);
                    box-shadow: 0 6px 20px rgba(99,102,241,0.38);
                }
                .cpw-submit:active:not(:disabled) { transform: translateY(0); }
                .cpw-submit:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }
                .cpw-submit svg { width: 14px; height: 14px; }

                .cpw-spin { animation: spin 0.9s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>

            <div className="cpw-page">
                <div className="cpw-root">
                    {/* Page header */}
                    <div className="cpw-header">
                        <div className="cpw-title-row">
                            <div className="cpw-icon-badge"><ShieldCheck /></div>
                            <div className="cpw-title-text">
                                <div className="cpw-title">Change Password</div>
                                <div className="cpw-subtitle">Keep your account safe with a strong password</div>
                            </div>
                        </div>
                    </div>

                    <form ref={formRef} onSubmit={handleSubmit}>
                        <div className="cpw-card">
                            <div className="cpw-strip" />
                            <div className="cpw-section-label">Security Credentials</div>

                            <div className="cpw-body">
                                {/* Alerts */}
                                {error && (
                                    <div className="cpw-alert cpw-alert-error">
                                        <XCircle /><span>{error}</span>
                                    </div>
                                )}
                                {success && (
                                    <div className="cpw-alert cpw-alert-success">
                                        <CheckCircle2 /><span>{success}</span>
                                    </div>
                                )}

                                {/* Current password */}
                                <div className="cpw-field">
                                    <label className="cpw-label" htmlFor="oldPassword">
                                        Current Password
                                    </label>
                                    <SecureInput
                                        id="oldPassword" name="oldPassword"
                                        placeholder="Enter your current password"
                                        disabled={isPending}
                                        value={oldPwd}
                                        onChange={setOldPwd}
                                    />
                                </div>

                                {/* New password + strength */}
                                <div className="cpw-field">
                                    <label className="cpw-label" htmlFor="newPassword">
                                        New Password
                                        {newPwd && (
                                            <span
                                                className="cpw-label-badge"
                                                style={{
                                                    color: strength.color,
                                                    background: strength.color + "18",
                                                }}
                                            >
                                                {strength.label}
                                            </span>
                                        )}
                                    </label>
                                    <SecureInput
                                        id="newPassword" name="newPassword"
                                        placeholder="Create a strong new password"
                                        disabled={isPending}
                                        value={newPwd}
                                        onChange={setNewPwd}
                                    />
                                    {/* Strength bars */}
                                    {newPwd && (
                                        <div className="cpw-strength">
                                            <div className="cpw-strength-bars">
                                                {[1, 2, 3, 4, 5].map(i => (
                                                    <div
                                                        key={i}
                                                        className="cpw-strength-bar"
                                                        style={{ background: i <= strength.score ? strength.color : "#E2E8F0" }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {/* Requirements */}
                                    {newPwd && (
                                        <div className="cpw-reqs">
                                            {[
                                                { met: newPwd.length >= 8, text: "8+ characters" },
                                                { met: /[A-Z]/.test(newPwd), text: "Uppercase letter" },
                                                { met: /[0-9]/.test(newPwd), text: "Number" },
                                                { met: /[^A-Za-z0-9]/.test(newPwd), text: "Special character" },
                                            ].map(({ met, text }) => (
                                                <div className={`cpw-req${met ? " met" : ""}`} key={text}>
                                                    <div className="cpw-req-dot" />
                                                    {text}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Confirm password */}
                                <div className="cpw-field">
                                    <label className="cpw-label" htmlFor="confirmPassword">
                                        Confirm New Password
                                    </label>
                                    <SecureInput
                                        id="confirmPassword" name="confirmPassword"
                                        placeholder="Re-enter your new password"
                                        disabled={isPending}
                                        value={confirmPwd}
                                        onChange={setConfirmPwd}
                                    />
                                    {matchOk && (
                                        <div className="cpw-match ok">
                                            <CheckCircle2 /> Passwords match
                                        </div>
                                    )}
                                    {matchBad && (
                                        <div className="cpw-match bad">
                                            <XCircle /> Passwords do not match
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="cpw-footer">
                                <span className="cpw-tip">
                                    <AlertCircle /> Use a unique password not used elsewhere
                                </span>
                                <button
                                    type="submit"
                                    className="cpw-submit"
                                    disabled={isPending || matchBad}
                                >
                                    {isPending ? (
                                        <><Loader2 className="cpw-spin" /> Updating...</>
                                    ) : (
                                        <><Key /> Update Password</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default ChangePasswordPage;